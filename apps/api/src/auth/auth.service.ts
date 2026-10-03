import { createHash, randomUUID } from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import {
  ROLE_TEMPLATES,
  listPermissionDefinitions,
  resolveRolePermissions,
} from '@gestor/shared';
import { PrismaService } from '../prisma/prisma.service';
import type { LoginDto } from './dto/login.dto';
import type { RefreshDto } from './dto/refresh.dto';
import type { RegisterTenantDto } from './dto/register-tenant.dto';
import type { JwtPayload } from './strategies/jwt.strategy';

interface RefreshPayload extends JwtPayload {
  jti: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  private get accessSecret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }

  private get accessExpiresIn(): string {
    return this.config.get<string>('JWT_EXPIRES_IN', '15m');
  }

  private get refreshSecret(): string {
    return this.config.getOrThrow<string>('REFRESH_SECRET');
  }

  private get refreshExpiresIn(): string {
    return this.config.get<string>('REFRESH_EXPIRES_IN', '30d');
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.system.user.findUnique({
      where: { email: dto.email },
    });
    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const memberships = await this.prisma.system.membership.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
    if (memberships.length === 0) {
      throw new ForbiddenException('Usuário sem vínculo com nenhuma oficina');
    }

    const membership = dto.tenantId
      ? memberships.find((item) => item.tenantId === dto.tenantId)
      : memberships.length === 1
        ? memberships[0]
        : undefined;

    if (!membership) {
      throw new BadRequestException(
        'Selecione a oficina (informe tenantId): o usuário pertence a mais de uma.',
      );
    }

    const tenant = await this.prisma.system.tenant.findUnique({
      where: { id: membership.tenantId },
    });
    if (!tenant) throw new UnauthorizedException('Oficina inválida');

    const tokens = await this.issueSession({
      userId: user.id,
      tenantId: membership.tenantId,
      membershipId: membership.id,
      email: user.email,
      name: user.name,
    });

    return {
      ...tokens,
      membershipId: membership.id,
      user: { id: user.id, email: user.email, name: user.name },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    };
  }

  async refresh(dto: RefreshDto) {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(dto.refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    const stored = await this.prisma.system.refreshToken.findUnique({
      where: { id: payload.jti },
    });
    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() < Date.now() ||
      stored.tokenHash !== this.hashToken(dto.refreshToken)
    ) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    const user = await this.prisma.system.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário inválido');
    }

    // Rotação: revoga o usado e emite um novo par.
    await this.prisma.system.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueSession({
      userId: user.id,
      tenantId: payload.tenantId,
      membershipId: payload.membershipId,
      email: user.email,
      name: user.name,
    });
  }

  async logout(dto: RefreshDto): Promise<{ success: true }> {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(dto.refreshToken, {
        secret: this.refreshSecret,
      });
      await this.prisma.system.refreshToken.updateMany({
        where: { id: payload.jti, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    } catch {
      // Logout é idempotente: token inválido não gera erro.
    }
    return { success: true };
  }

  async registerTenant(dto: RegisterTenantDto) {
    const slug = dto.slug ?? this.slugify(dto.tenantName);

    const [slugTaken, emailTaken] = await Promise.all([
      this.prisma.system.tenant.findUnique({ where: { slug } }),
      this.prisma.system.user.findUnique({ where: { email: dto.ownerEmail } }),
    ]);
    if (slugTaken) throw new ConflictException('Já existe uma oficina com este slug');
    if (emailTaken) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.ownerPassword, 10);

    const { tenant, user, membership } = await this.prisma.system.$transaction(
      async (tx) => {
        await this.ensurePermissions(tx);

        const tenant = await tx.tenant.create({
          data: { name: dto.tenantName, slug, status: 'ACTIVE', plan: 'trial' },
        });
        const branch = await tx.branch.create({
          data: { tenantId: tenant.id, name: 'Matriz', code: 'MATRIZ' },
        });
        const user = await tx.user.create({
          data: {
            email: dto.ownerEmail,
            name: dto.ownerName,
            passwordHash,
            isActive: true,
          },
        });
        const membership = await tx.membership.create({
          data: {
            tenantId: tenant.id,
            userId: user.id,
            branchId: branch.id,
            isOwner: true,
            status: 'ACTIVE',
          },
        });

        let ownerRoleId: string | undefined;
        for (const template of ROLE_TEMPLATES) {
          const role = await tx.role.create({
            data: {
              tenantId: tenant.id,
              name: template.name,
              slug: template.slug,
              description: template.description,
              scope: 'TENANT',
              isSystem: true,
            },
          });
          const codes = resolveRolePermissions(template);
          const permissions = await tx.permission.findMany({
            where: { code: { in: codes } },
            select: { id: true },
          });
          if (permissions.length > 0) {
            await tx.rolePermission.createMany({
              data: permissions.map((permission) => ({
                roleId: role.id,
                permissionId: permission.id,
              })),
              skipDuplicates: true,
            });
          }
          if (template.isOwner) ownerRoleId = role.id;
        }

        if (ownerRoleId) {
          await tx.membershipRole.create({
            data: { membershipId: membership.id, roleId: ownerRoleId },
          });
        }

        return { tenant, user, membership };
      },
    );

    const tokens = await this.issueSession({
      userId: user.id,
      tenantId: tenant.id,
      membershipId: membership.id,
      email: user.email,
      name: user.name,
    });

    return {
      ...tokens,
      membershipId: membership.id,
      user: { id: user.id, email: user.email, name: user.name },
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug },
    };
  }

  private async issueSession(params: {
    userId: string;
    tenantId: string;
    membershipId: string;
    email: string;
    name: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: 'Bearer';
    expiresIn: string;
  }> {
    const accessToken = await this.jwt.signAsync(
      { sub: params.userId, tenantId: params.tenantId, membershipId: params.membershipId },
      { secret: this.accessSecret, expiresIn: this.accessExpiresIn },
    );

    const jti = randomUUID();
    const refreshToken = await this.jwt.signAsync(
      {
        sub: params.userId,
        tenantId: params.tenantId,
        membershipId: params.membershipId,
        jti,
      },
      { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn },
    );

    const decoded = this.jwt.decode<{ exp: number }>(refreshToken);
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.system.refreshToken.create({
      data: {
        id: jti,
        userId: params.userId,
        tenantId: params.tenantId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessExpiresIn,
    };
  }

  /** Garante que o catálogo de permissões exista (idempotente). */
  private async ensurePermissions(tx: Prisma.TransactionClient): Promise<void> {
    const definitions = listPermissionDefinitions();
    await tx.permission.createMany({
      data: definitions.map((definition) => ({
        code: definition.code,
        feature: definition.feature,
        action: definition.action,
      })),
      skipDuplicates: true,
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private slugify(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60);
  }
}
