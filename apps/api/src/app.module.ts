import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { CoreModule } from './common/core.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';
import { HealthModule } from './health/health.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { JobCardsModule } from './modules/job-cards/job-cards.module';
import { PartsModule } from './modules/parts/parts.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { ReportsModule } from './modules/reports/reports.module';
import { StockModule } from './modules/stock/stock.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), '..', '..', '.env'),
      ],
    }),
    PrismaModule,
    CoreModule,
    AuthModule,
    HealthModule,
    CustomersModule,
    VehiclesModule,
    AppointmentsModule,
    InspectionsModule,
    JobCardsModule,
    QuotationsModule,
    InvoicesModule,
    PartsModule,
    StockModule,
    SuppliersModule,
    ExpensesModule,
    PurchasesModule,
    ReportsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: TenantContextInterceptor },
  ],
})
export class AppModule {}
