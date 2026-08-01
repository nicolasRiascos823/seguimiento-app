import { Global, Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { TypeOrmModule } from '@nestjs/typeorm';

import {

  Apprentice,

  AuditLog,

  Competency,

  Environment,

  Evaluation,

  FileObject,

  FollowUp,

  Group,

  ImportBatch,

  ImportRowError,

  LearningOutcome,

  PerformanceStatus,

  RefreshToken,

  Schedule,

  Trimester,

  User,

  Warning,

} from './entities';



export const entities = [

  User,

  Group,

  Apprentice,

  Trimester,

  Environment,

  Schedule,

  PerformanceStatus,

  Evaluation,

  Competency,

  LearningOutcome,

  FollowUp,

  FileObject,

  Warning,

  ImportBatch,

  ImportRowError,

  AuditLog,

  RefreshToken,

];



@Global()

@Module({

  imports: [

    TypeOrmModule.forRootAsync({

      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (config: ConfigService) => {

        const databaseUrl = config.get<string>('DATABASE_URL');

        const isProd = config.get<string>('NODE_ENV') === 'production';

        const synchronize =

          config.get<string>('TYPEORM_SYNC') === 'true' || !isProd;



        if (databaseUrl) {

          const url = new URL(databaseUrl);

          return {

            type: 'postgres' as const,

            host: url.hostname,

            port: Number(url.port || 5432),

            username: decodeURIComponent(url.username),

            password: decodeURIComponent(url.password),

            database: url.pathname.replace(/^\//, ''),

            schema: url.searchParams.get('schema') || 'public',

            entities,

            synchronize,

            logging: !isProd,

          };

        }



        return {

          type: 'postgres' as const,

          host: config.get<string>('DB_HOST', 'localhost'),

          port: Number(config.get<string>('DB_PORT', '5432')),

          username: config.get<string>('DB_USER', 'postgres'),

          password: config.get<string>('DB_PASSWORD', 'postgres'),

          database: config.get<string>('DB_NAME', 'seguimiento'),

          schema: config.get<string>('DB_SCHEMA', 'public'),

          entities,

          synchronize,

          logging: !isProd,

        };

      },

    }),

    TypeOrmModule.forFeature(entities),

  ],

  exports: [TypeOrmModule],

})

export class DatabaseModule {}


