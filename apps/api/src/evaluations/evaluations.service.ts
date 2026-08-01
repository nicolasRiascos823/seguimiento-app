import {

  BadRequestException,

  ForbiddenException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import {

  Apprentice,

  Evaluation,

  PerformanceStatus,

  Schedule,

  User,

} from '../database/entities';

import { Role, ScheduleStatus } from '../database/enums';

import { AuditService } from '../audit/audit.service';

import { GroupsService } from '../groups/groups.service';

import {

  EvaluationMatrixQueryDto,

  UpsertEvaluationDto,

} from './dto/evaluation.dto';

import { AuthUser } from '../common/decorators/current-user.decorator';



@Injectable()

export class EvaluationsService {

  constructor(

    @InjectRepository(Evaluation)

    private readonly evaluationsRepo: Repository<Evaluation>,

    @InjectRepository(Apprentice)

    private readonly apprenticesRepo: Repository<Apprentice>,

    @InjectRepository(Schedule)

    private readonly schedulesRepo: Repository<Schedule>,

    @InjectRepository(PerformanceStatus)

    private readonly performanceStatusesRepo: Repository<PerformanceStatus>,

    @InjectRepository(User)

    private readonly usersRepo: Repository<User>,

    private readonly audit: AuditService,

    private readonly groupsService: GroupsService,

  ) {}



  async getMatrix(query: EvaluationMatrixQueryDto, user: AuthUser) {

    await this.groupsService.findOne(query.groupId, user);



    const [apprentices, scheduleRows, evaluations] = await Promise.all([

      this.apprenticesRepo.find({

        where: { groupId: query.groupId },

        order: { lastName: 'ASC', firstName: 'ASC' },

      }),

      this.schedulesRepo.find({

        where: {

          trimesterId: query.trimesterId,

          groupId: query.groupId,

          status: ScheduleStatus.ACTIVE,

        },

        relations: { instructor: true },

      }),

      this.evaluationsRepo.find({

        where: {

          trimesterId: query.trimesterId,

          groupId: query.groupId,

        },

        relations: {

          apprentice: true,

          instructor: true,

          performanceStatus: true,

        },

      }),

    ]);



    const instructorMap = new Map<string, User>();

    for (const schedule of scheduleRows) {

      if (schedule.instructor) {

        instructorMap.set(schedule.instructorId, schedule.instructor);

      }

    }



    const instructors = [...instructorMap.values()].sort((a, b) =>

      a.fullName.localeCompare(b.fullName),

    );



    return { apprentices, instructors, evaluations };

  }



  async upsert(dto: UpsertEvaluationDto, actor: AuthUser) {

    if (

      actor.role === Role.INSTRUCTOR &&

      dto.instructorId !== actor.id

    ) {

      throw new ForbiddenException(

        'Solo puede registrar evaluaciones donde usted es el instructor',

      );

    }



    await this.groupsService.findOne(dto.groupId, actor);



    const apprentice = await this.apprenticesRepo.findOne({

      where: { id: dto.apprenticeId, groupId: dto.groupId },

    });

    if (!apprentice) {

      throw new BadRequestException(

        'El aprendiz no pertenece a la ficha indicada',

      );

    }



    const instructorSchedule = await this.schedulesRepo.findOne({

      where: {

        trimesterId: dto.trimesterId,

        groupId: dto.groupId,

        instructorId: dto.instructorId,

        status: ScheduleStatus.ACTIVE,

      },

    });

    if (!instructorSchedule) {

      throw new BadRequestException(

        'El instructor no tiene horario activo para esta ficha y trimestre',

      );

    }



    const performanceStatus = await this.performanceStatusesRepo.findOne({

      where: { id: dto.performanceStatusId, active: true },

    });

    if (!performanceStatus) {

      throw new BadRequestException('Estado de desempeño no válido');

    }



    const instructor = await this.usersRepo.findOne({

      where: { id: dto.instructorId },

    });

    if (!instructor) {

      throw new NotFoundException('Instructor no encontrado');

    }



    let evaluation = await this.evaluationsRepo.findOne({

      where: {

        trimesterId: dto.trimesterId,

        groupId: dto.groupId,

        apprenticeId: dto.apprenticeId,

        instructorId: dto.instructorId,

      },

    });



    const isCreate = !evaluation;



    if (evaluation) {

      evaluation.performanceStatusId = dto.performanceStatusId;

      evaluation.observations = dto.observations;

      evaluation.commitments = dto.commitments ?? null;

    } else {

      evaluation = this.evaluationsRepo.create({

        trimesterId: dto.trimesterId,

        groupId: dto.groupId,

        apprenticeId: dto.apprenticeId,

        instructorId: dto.instructorId,

        performanceStatusId: dto.performanceStatusId,

        observations: dto.observations,

        commitments: dto.commitments ?? null,

      });

    }



    const saved = await this.evaluationsRepo.save(evaluation);

    const result = await this.evaluationsRepo.findOne({

      where: { id: saved.id },

      relations: {

        apprentice: true,

        instructor: true,

        performanceStatus: true,

        trimester: true,

        group: true,

      },

    });



    await this.audit.log({

      actorId: actor.id,

      action: isCreate ? 'CREATE' : 'UPDATE',

      entity: 'Evaluation',

      entityId: saved.id,

      payload: dto,

    });



    return result!;

  }

}


