import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  membershipId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.system.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário inválido');
    }

    if (user.isPlatformAdmin) {
      return {
        userId: user.id,
        tenantId: payload.tenantId,
        membershipId: payload.membershipId,
        email: user.email,
        name: user.name,
        permissions: ['*'],
        isPlatformAdmin: true,
      };
    }

    const membership = await this.prisma.system.membership.findFirst({
      where: {
        id: payload.membershipId,
        userId: user.id,
        tenantId: payload.tenantId,
        status: 'ACTIVE',
      },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: { include: { permission: true } },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Vínculo com a oficina inválido');
    }

    const permissions = Array.from(
      new Set(
        membership.roles.flatMap((membershipRole) =>
          membershipRole.role.permissions.map(
            (rolePermission) => rolePermission.permission.code,
          ),
        ),
      ),
    );

    return {
      userId: user.id,
      tenantId: membership.tenantId,
      membershipId: membership.id,
      email: user.email,
      name: user.name,
      permissions,
      isPlatformAdmin: false,
    };
  }
}
