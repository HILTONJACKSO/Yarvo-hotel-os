import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AppConfigModule } from './config/app-config.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { validate } from './config/env.validation';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { RoomTypesModule } from './modules/room-types/room-types.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { GuestsModule } from './modules/guests/guests.module';
import { ReservationsModule } from './modules/reservations/reservations.module';
import { FoliosModule } from './modules/folios/folios.module';
import { WorkOrdersModule } from './modules/work-orders/work-orders.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EmailModule } from './modules/email/email.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { PosModule } from './modules/pos/pos.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { NightAuditModule } from './modules/night-audit/night-audit.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { TaxesModule } from './modules/taxes/taxes.module';
import { EventsModule } from './modules/events/events.module';
import { StaffModule } from './modules/staff/staff.module';
import { PublicModule } from './modules/public/public.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    // ─── Config ─────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? ['../../.env.test', '../../.env'] : ['../../.env.development', '../../.env'],
      validate,
      cache: true,
    }),

    // ─── Logging ─────────────────────────────────────────────────────────────
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            process.env.NODE_ENV === 'production'
              ? winston.format.json()
              : winston.format.combine(
                  winston.format.colorize(),
                  winston.format.printf(({ timestamp, level, message, context, stack }) => {
                    return `${timestamp} [${level}] ${context ? `[${context}]` : ''} ${message}${stack ? `\n${stack}` : ''}`;
                  }),
                ),
          ),
        }),
        // Production: also log to file
        ...(process.env.NODE_ENV === 'production'
          ? [
              new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                ),
              }),
              new winston.transports.File({
                filename: 'logs/combined.log',
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                ),
              }),
            ]
          : []),
      ],
    }),

    // ─── Rate Limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRootAsync({
      useFactory: () => [
        {
          ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60000', 10),
          limit: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
        },
      ],
    }),

    // ─── App Config (validates env vars) ─────────────────────────────────────
    AppConfigModule,

    // ─── Database (Prisma) ────────────────────────────────────────────────────
    PrismaModule,

    // ─── Feature Modules ──────────────────────────────────────────────────────
    HealthModule,

    UsersModule,

    AuthModule,

    RoomTypesModule,

    RoomsModule,

    GuestsModule,

    ReservationsModule,

    FoliosModule,

    WorkOrdersModule,

    AnalyticsModule,

    EmailModule,

    PropertiesModule,

    PosModule,

    InventoryModule,

    ExpensesModule,

    NightAuditModule,

    TicketsModule,

    TaxesModule,

    EventsModule,
    
    StaffModule,

    PublicModule,

    CompaniesModule,

    AuditLogsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}

