import 'reflect-metadata';

import { config as loadEnv } from 'dotenv';

import { resolve } from 'path';

import { DataSource } from 'typeorm';

import * as argon2 from 'argon2';

import { entities } from './database.module';

import {

  DocumentType,

  EnvironmentStatus,

  Role,

  TrimesterStatus,

  UserStatus,

  WeekDay,

} from './enums';

import {

  Apprentice,

  Competency,

  Environment,

  Group,

  LearningOutcome,

  PerformanceStatus,

  Schedule,

  Trimester,

  User,

} from './entities';



loadEnv({ path: resolve(__dirname, '../../../../.env') });

loadEnv({ path: resolve(__dirname, '../../.env'), override: true });



function buildDataSource() {

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {

    const url = new URL(databaseUrl);

    return new DataSource({

      type: 'postgres',

      host: url.hostname,

      port: Number(url.port || 5432),

      username: decodeURIComponent(url.username),

      password: decodeURIComponent(url.password),

      database: url.pathname.replace(/^\//, ''),

      schema: url.searchParams.get('schema') || 'public',

      entities,

      synchronize: true,

    });

  }



  return new DataSource({

    type: 'postgres',

    host: process.env.DB_HOST || 'localhost',

    port: Number(process.env.DB_PORT || 5432),

    username: process.env.DB_USER || 'postgres',

    password: process.env.DB_PASSWORD || 'postgres',

    database: process.env.DB_NAME || 'seguimiento',

    entities,

    synchronize: true,

  });

}



async function main() {

  const ds = buildDataSource();

  await ds.initialize();



  const users = ds.getRepository(User);

  const groups = ds.getRepository(Group);

  const competencies = ds.getRepository(Competency);

  const outcomes = ds.getRepository(LearningOutcome);

  const apprentices = ds.getRepository(Apprentice);

  const trimesters = ds.getRepository(Trimester);

  const environments = ds.getRepository(Environment);

  const performanceStatuses = ds.getRepository(PerformanceStatus);

  const schedules = ds.getRepository(Schedule);



  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@sena.edu.co').toLowerCase();

  const instructorEmail = (

    process.env.SEED_INSTRUCTOR_EMAIL || 'instructor@sena.edu.co'

  ).toLowerCase();



  let admin = await users.findOne({ where: { email: adminEmail } });

  if (!admin) {

    admin = await users.save(

      users.create({

        fullName: 'Administrador SENA',

        email: adminEmail,

        passwordHash: await argon2.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin123!'),

        role: Role.ADMIN,

        status: UserStatus.ACTIVE,

      }),

    );

  }



  let instructor = await users.findOne({ where: { email: instructorEmail } });

  if (!instructor) {

    instructor = await users.save(

      users.create({

        fullName: 'Instructor Líder',

        email: instructorEmail,

        passwordHash: await argon2.hash(

          process.env.SEED_INSTRUCTOR_PASSWORD || 'Instructor123!',

        ),

        role: Role.INSTRUCTOR,

        status: UserStatus.ACTIVE,

      }),

    );

  }



  let group = await groups.findOne({ where: { number: '2557890' } });

  if (!group) {

    group = await groups.save(

      groups.create({

        number: '2557890',

        leaderId: instructor.id,

      }),

    );

  }



  let trimester = await trimesters.findOne({ where: { name: 'Trimestre 2026-1' } });

  if (!trimester) {

    trimester = await trimesters.save(

      trimesters.create({

        name: 'Trimestre 2026-1',

        startDate: '2026-01-15',

        endDate: '2026-04-15',

        status: TrimesterStatus.ACTIVE,

      }),

    );

  }



  for (const env of [
    { name: 'Ambiente 101', isVirtual: false },
    { name: 'Ambiente 102', isVirtual: false },
    { name: 'Taller A', isVirtual: false },
    { name: 'Ambiente Virtual', isVirtual: true },
  ]) {
    const existing = await environments.findOne({ where: { name: env.name } });
    if (!existing) {
      await environments.save(
        environments.create({
          name: env.name,
          status: EnvironmentStatus.ACTIVE,
          isVirtual: env.isVirtual,
        }),
      );
    } else if (env.isVirtual && !existing.isVirtual) {
      await environments.update(existing.id, { isVirtual: true });
    }
  }



  const defaultPerformanceStatuses = [

    { code: 'EXCELLENT', name: 'Excelente', sortOrder: 1 },

    { code: 'GOOD', name: 'Bueno', sortOrder: 2 },

    { code: 'ACCEPTABLE', name: 'Aceptable', sortOrder: 3 },

    { code: 'NEEDS_FOLLOW_UP', name: 'Requiere seguimiento', sortOrder: 4 },

    { code: 'CRITICAL', name: 'Crítico', sortOrder: 5 },

  ];



  for (const status of defaultPerformanceStatuses) {

    const existing = await performanceStatuses.findOne({

      where: { code: status.code },

    });

    if (!existing) {

      await performanceStatuses.save(performanceStatuses.create(status));

    }

  }



  let competency = await competencies.findOne({

    where: { code: 'COMP-240201001' },

  });

  if (!competency) {

    competency = await competencies.save(

      competencies.create({

        code: 'COMP-240201001',

        name: 'Analizar requerimientos del cliente',

        description: 'Competencia de ejemplo para seguimiento formativo',

      }),

    );

  }



  for (const ra of [

    { code: 'RA-01', name: 'Identificar necesidades del cliente' },

    { code: 'RA-02', name: 'Documentar requisitos funcionales' },

  ]) {

    const existing = await outcomes.findOne({

      where: { competencyId: competency.id, code: ra.code },

    });

    if (!existing) {

      await outcomes.save(

        outcomes.create({

          ...ra,

          competencyId: competency.id,

        }),

      );

    }

  }



  const apprentice = await apprentices.findOne({

    where: { documentType: DocumentType.CC, document: '1000000001' },

  });

  if (!apprentice) {

    await apprentices.save(

      apprentices.create({

        documentType: DocumentType.CC,

        document: '1000000001',

        firstName: 'Ana',

        lastName: 'Pérez',

        email: 'ana.perez@ejemplo.com',

        phone: '3001234567',

        groupId: group.id,

      }),

    );

  }



  const environment = await environments.findOne({

    where: { name: 'Ambiente 101' },

  });

  if (environment) {

    const existingSchedule = await schedules.findOne({

      where: {

        trimesterId: trimester.id,

        groupId: group.id,

        instructorId: instructor.id,

        weekDay: WeekDay.MONDAY,

        blockStart: '08:00',

      },

    });

    if (!existingSchedule) {

      await schedules.save(

        schedules.create({

          trimesterId: trimester.id,

          groupId: group.id,

          instructorId: instructor.id,

          environmentId: environment.id,

          weekDay: WeekDay.MONDAY,

          blockStart: '08:00',

        }),

      );

    }

  }



  console.log('Seed completed:', {

    admin: admin.email,

    instructor: instructor.email,

    group: group.number,

    trimester: trimester.name,

  });



  await ds.destroy();

}



main().catch((error) => {

  console.error(error);

  process.exit(1);

});


