import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import {
  Environment,
  Evaluation,
  Group,
  Schedule,
  Trimester,
  User,
} from '../database/entities';
import {
  EnvironmentStatus,
  Role,
  ScheduleStatus,
  TIME_BLOCKS,
  TrimesterStatus,
  UserStatus,
  WeekDay,
  isValidTimeBlock,
  timeBlockEnd,
  expandTimeBlocks,
} from '../database/enums';
import { AuditService } from '../audit/audit.service';
import {
  CalendarSchedulesQueryDto,
  CreateScheduleDto,
  ListSchedulesQueryDto,
  UpdateScheduleDto,
} from './dto/schedule.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';

const WEEK_DAYS = Object.values(WeekDay);
const MAX_INSTRUCTOR_BLOCKS_PER_DAY = 10;

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly schedulesRepo: Repository<Schedule>,
    @InjectRepository(Trimester)
    private readonly trimestersRepo: Repository<Trimester>,
    @InjectRepository(Group)
    private readonly groupsRepo: Repository<Group>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Environment)
    private readonly environmentsRepo: Repository<Environment>,
    @InjectRepository(Evaluation)
    private readonly evaluationsRepo: Repository<Evaluation>,
    private readonly audit: AuditService,
  ) {}

  getTimeBlocks() {
    return TIME_BLOCKS.map((start) => ({
      start,
      end: timeBlockEnd(start),
      label: `${start} - ${timeBlockEnd(start)}`,
    }));
  }

  async findAll(query: ListSchedulesQueryDto) {
    const qb = this.buildListQuery(query);
    return qb.getMany();
  }

  async getCalendar(query: CalendarSchedulesQueryDto) {
    const schedules = await this.buildListQuery(query).getMany();
    const timeBlocks = this.getTimeBlocks();

    const grid = WEEK_DAYS.map((weekDay) => ({
      weekDay,
      blocks: timeBlocks.map((block) => ({
        blockStart: block.start,
        blockEnd: block.end,
        label: block.label,
        schedules: schedules.filter(
          (s) => s.weekDay === weekDay && s.blockStart === block.start,
        ),
      })),
    }));

    return { timeBlocks, days: grid, schedules };
  }

  async create(dto: CreateScheduleDto, actor: AuthUser) {
    await this.validateReferences(dto);
    let blocks: string[];
    try {
      blocks = expandTimeBlocks(dto.blockStart, dto.blockEnd);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Rango horario inválido',
      );
    }
    if (!blocks.length) {
      throw new BadRequestException(
        'El rango no incluye ningún bloque de 1 hora válido',
      );
    }
    for (const blockStart of blocks) {
      await this.validateBusinessRules(
        {
          trimesterId: dto.trimesterId,
          groupId: dto.groupId,
          instructorId: dto.instructorId,
          environmentId: dto.environmentId,
          weekDay: dto.weekDay,
          blockStart,
        },
        undefined,
        blocks.length,
      );
    }
    const entries = blocks.map((blockStart) =>
      this.schedulesRepo.create({
        trimesterId: dto.trimesterId,
        groupId: dto.groupId,
        instructorId: dto.instructorId,
        environmentId: dto.environmentId,
        weekDay: dto.weekDay,
        blockStart,
        status: ScheduleStatus.ACTIVE,
      }),
    );
    const saved = await this.schedulesRepo.save(entries);
    await this.audit.log({
      actorId: actor.id,
      action: 'CREATE',
      entity: 'Schedule',
      entityId: saved[0]?.id,
      payload: { ...dto, blocksCreated: blocks },
    });
    return Promise.all(saved.map((s) => this.findOneWithRelations(s.id)));
  }

  async update(id: string, dto: UpdateScheduleDto, actor: AuthUser) {
    const existing = await this.findOneWithRelations(id);
    if (!existing) throw new NotFoundException('Horario no encontrado');

    const merged = {
      trimesterId: dto.trimesterId ?? existing.trimesterId,
      groupId: dto.groupId ?? existing.groupId,
      instructorId: dto.instructorId ?? existing.instructorId,
      environmentId: dto.environmentId ?? existing.environmentId,
      weekDay: dto.weekDay ?? existing.weekDay,
      blockStart: dto.blockStart ?? existing.blockStart,
    };

    await this.validateReferences(merged);
    await this.validateBusinessRules(merged, id);

    await this.schedulesRepo.update(id, dto);
    const result = await this.findOneWithRelations(id);

    await this.audit.log({
      actorId: actor.id,
      action: 'UPDATE',
      entity: 'Schedule',
      entityId: id,
      payload: dto,
    });

    return result!;
  }

  async deactivate(id: string, actor: AuthUser) {
    const existing = await this.findOneWithRelations(id);
    if (!existing) throw new NotFoundException('Horario no encontrado');

    await this.schedulesRepo.update(id, { status: ScheduleStatus.INACTIVE });
    const result = await this.findOneWithRelations(id);

    await this.audit.log({
      actorId: actor.id,
      action: 'DEACTIVATE',
      entity: 'Schedule',
      entityId: id,
    });

    return result!;
  }

  async remove(id: string, actor: AuthUser) {
    const existing = await this.findOneWithRelations(id);
    if (!existing) throw new NotFoundException('Horario no encontrado');

    const trimesterEvaluations = await this.evaluationsRepo.count({
      where: { trimesterId: existing.trimesterId },
    });
    if (trimesterEvaluations > 0) {
      throw new BadRequestException(
        'No se puede eliminar el horario: existen seguimientos asociados al trimestre',
      );
    }

    const groupEvaluations = await this.evaluationsRepo.count({
      where: {
        trimesterId: existing.trimesterId,
        groupId: existing.groupId,
      },
    });
    if (groupEvaluations > 0) {
      throw new BadRequestException(
        'No se puede eliminar el horario: existen seguimientos asociados a la ficha en este trimestre',
      );
    }

    await this.schedulesRepo.softRemove(existing);

    await this.audit.log({
      actorId: actor.id,
      action: 'DELETE',
      entity: 'Schedule',
      entityId: id,
    });

    return { deleted: true };
  }

  private buildListQuery(
    query: ListSchedulesQueryDto | CalendarSchedulesQueryDto,
  ) {
    const qb = this.schedulesRepo
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.trimester', 'trimester')
      .leftJoinAndSelect('schedule.group', 'group')
      .leftJoinAndSelect('schedule.instructor', 'instructor')
      .leftJoinAndSelect('schedule.environment', 'environment')
      .where('schedule.trimesterId = :trimesterId', {
        trimesterId: query.trimesterId,
      })
      .orderBy('schedule.weekDay', 'ASC')
      .addOrderBy('schedule.blockStart', 'ASC');

    if (query.groupId) {
      qb.andWhere('schedule.groupId = :groupId', { groupId: query.groupId });
    }
    if (query.instructorId) {
      qb.andWhere('schedule.instructorId = :instructorId', {
        instructorId: query.instructorId,
      });
    }

    return qb;
  }

  private async validateReferences(dto: {
    trimesterId: string;
    groupId: string;
    instructorId: string;
    environmentId: string;
  }) {
    const trimester = await this.trimestersRepo.findOne({
      where: { id: dto.trimesterId, status: TrimesterStatus.ACTIVE },
    });
    if (!trimester) {
      throw new BadRequestException('Trimestre no encontrado o inactivo');
    }

    const group = await this.groupsRepo.findOne({ where: { id: dto.groupId } });
    if (!group) throw new BadRequestException('Ficha no encontrada');

    const instructor = await this.usersRepo.findOne({
      where: {
        id: dto.instructorId,
        role: Role.INSTRUCTOR,
        status: UserStatus.ACTIVE,
      },
    });
    if (!instructor) {
      throw new BadRequestException('Instructor no encontrado o inactivo');
    }

    const environment = await this.environmentsRepo.findOne({
      where: { id: dto.environmentId, status: EnvironmentStatus.ACTIVE },
    });
    if (!environment) {
      throw new BadRequestException('Ambiente no encontrado o inactivo');
    }
  }

  private async validateBusinessRules(
    dto: {
      trimesterId: string;
      groupId: string;
      instructorId: string;
      environmentId: string;
      weekDay: WeekDay;
      blockStart: string;
    },
    excludeId?: string,
    additionalBlocksInBatch = 1,
  ) {
    if (!isValidTimeBlock(dto.blockStart)) {
      throw new BadRequestException(
        'El bloque horario no es válido. Use uno de los bloques predefinidos',
      );
    }

    const instructorBlockCount = await this.schedulesRepo.count({
      where: {
        trimesterId: dto.trimesterId,
        instructorId: dto.instructorId,
        weekDay: dto.weekDay,
        status: ScheduleStatus.ACTIVE,
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
    if (instructorBlockCount + additionalBlocksInBatch > MAX_INSTRUCTOR_BLOCKS_PER_DAY) {
      throw new BadRequestException(
        `El instructor superaría el máximo de ${MAX_INSTRUCTOR_BLOCKS_PER_DAY} horas en este día`,
      );
    }

    await this.assertNoOverlap(
      {
        trimesterId: dto.trimesterId,
        weekDay: dto.weekDay,
        blockStart: dto.blockStart,
        status: ScheduleStatus.ACTIVE,
      },
      'instructorId',
      dto.instructorId,
      'El instructor ya tiene un bloque activo en este horario',
      excludeId,
    );

    await this.assertNoOverlap(
      {
        trimesterId: dto.trimesterId,
        weekDay: dto.weekDay,
        blockStart: dto.blockStart,
      },
      'groupId',
      dto.groupId,
      'La ficha ya tiene un bloque en este horario',
      excludeId,
    );

    await this.assertNoOverlap(
      {
        trimesterId: dto.trimesterId,
        weekDay: dto.weekDay,
        blockStart: dto.blockStart,
        status: ScheduleStatus.ACTIVE,
      },
      'environmentId',
      dto.environmentId,
      'El ambiente ya está ocupado en este horario',
      excludeId,
    );
  }

  private async assertNoOverlap(
    base: Record<string, unknown>,
    field: 'instructorId' | 'groupId' | 'environmentId',
    value: string,
    message: string,
    excludeId?: string,
  ) {
    const where: Record<string, unknown> = {
      ...base,
      [field]: value,
      status: ScheduleStatus.ACTIVE,
    };
    if (excludeId) where.id = Not(excludeId);

    const conflict = await this.schedulesRepo.findOne({ where });
    if (conflict) throw new ConflictException(message);
  }

  private findOneWithRelations(id: string) {
    return this.schedulesRepo.findOne({
      where: { id },
      relations: {
        trimester: true,
        group: true,
        instructor: true,
        environment: true,
      },
    });
  }
}

