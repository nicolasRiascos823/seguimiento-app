import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GroupsModule } from './groups/groups.module';
import { ApprenticesModule } from './apprentices/apprentices.module';
import { CatalogsModule } from './catalogs/catalogs.module';
import { FollowUpsModule } from './follow-ups/follow-ups.module';
import { WarningsModule } from './warnings/warnings.module';
import { FilesModule } from './files/files.module';
import { TimelineModule } from './timeline/timeline.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { TrimestersModule } from './trimesters/trimesters.module';
import { EnvironmentsModule } from './environments/environments.module';
import { SchedulesModule } from './schedules/schedules.module';
import { PerformanceStatusesModule } from './performance-statuses/performance-statuses.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { ReportsModule } from './reports/reports.module';
import { KeepAliveModule } from './keep-alive/keep-alive.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    DatabaseModule,
    AuditModule,
    AuthModule,
    UsersModule,
    GroupsModule,
    ApprenticesModule,
    CatalogsModule,
    FollowUpsModule,
    WarningsModule,
    FilesModule,
    TimelineModule,
    DashboardModule,
    TrimestersModule,
    EnvironmentsModule,
    SchedulesModule,
    PerformanceStatusesModule,
    EvaluationsModule,
    ReportsModule,
    KeepAliveModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
