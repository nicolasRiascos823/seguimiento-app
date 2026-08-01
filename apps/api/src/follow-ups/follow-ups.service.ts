import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FollowUp, LearningOutcome } from '../database/entities';
import { Role } from '../database/enums';
import { AuditService } from '../audit/audit.service';
import { ApprenticesService } from '../apprentices/apprentices.service';
import { CreateFollowUpDto } from './dto/follow-up.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class FollowUpsService {
  constructor(
    @InjectRepository(FollowUp)
    private readonly followUpsRepo: Repository<FollowUp>,
    @InjectRepository(LearningOutcome)
    private readonly learningOutcomesRepo: Repository<LearningOutcome>,
    private readonly audit: AuditService,
    private readonly apprenticesService: ApprenticesService,
  ) {}

  async create(dto: CreateFollowUpDto, actor: AuthUser) {
    await this.apprenticesService.ensureAccessByApprenticeId(
      dto.apprenticeId,
      actor,
    );

    const ra = await this.learningOutcomesRepo.findOne({
      where: {
        id: dto.learningOutcomeId,
        competencyId: dto.competencyId,
        active: true,
      },
    });
    if (!ra) {
      throw new BadRequestException(
        'El resultado de aprendizaje no pertenece a la competencia o está inactivo',
      );
    }

    const entry = this.followUpsRepo.create({
      date: new Date(dto.date),
      apprenticeId: dto.apprenticeId,
      instructorId: actor.id,
      competencyId: dto.competencyId,
      learningOutcomeId: dto.learningOutcomeId,
      observations: dto.observations,
      commitments: dto.commitments,
      status: dto.status,
    });
    const followUp = await this.followUpsRepo.save(entry);
    const result = await this.findOneWithRelations(followUp.id);

    await this.audit.log({
      actorId: actor.id,
      action: 'CREATE',
      entity: 'FollowUp',
      entityId: followUp.id,
    });

    return result!;
  }

  async findAll(
    query: {
      page?: number;
      limit?: number;
      apprenticeId?: string;
      instructorId?: string;
    },
    user: AuthUser,
  ) {
    const { page, limit, skip, take } = paginate(query.page, query.limit);

    const qb = this.buildListQuery(user);
    if (query.apprenticeId) {
      qb.andWhere('followUp.apprenticeId = :apprenticeId', {
        apprenticeId: query.apprenticeId,
      });
    }
    if (query.instructorId) {
      qb.andWhere('followUp.instructorId = :instructorId', {
        instructorId: query.instructorId,
      });
    }

    const [items, total] = await qb
      .orderBy('followUp.date', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return paginatedResult(items, total, page, limit);
  }

  async findOne(id: string, user: AuthUser) {
    const item = await this.findOneWithRelations(id);
    if (!item) throw new NotFoundException('Seguimiento no encontrado');
    await this.apprenticesService.ensureAccessByApprenticeId(
      item.apprenticeId,
      user,
    );
    return item;
  }

  private buildListQuery(user: AuthUser) {
    const qb = this.followUpsRepo
      .createQueryBuilder('followUp')
      .leftJoinAndSelect('followUp.apprentice', 'apprentice')
      .leftJoinAndSelect('followUp.instructor', 'instructor')
      .leftJoinAndSelect('followUp.competency', 'competency')
      .leftJoinAndSelect('followUp.learningOutcome', 'learningOutcome');

    if (user.role === Role.INSTRUCTOR) {
      qb.innerJoin('apprentice.group', 'group').andWhere(
        'group.leaderId = :leaderId',
        { leaderId: user.id },
      );
    }

    return qb;
  }

  private findOneWithRelations(id: string) {
    return this.followUpsRepo.findOne({
      where: { id },
      relations: {
        apprentice: true,
        instructor: true,
        competency: true,
        learningOutcome: true,
      },
    });
  }
}
