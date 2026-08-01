import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Apprentice } from '../database/entities';
import { Role } from '../database/enums';
import { AuditService } from '../audit/audit.service';
import { GroupsService } from '../groups/groups.service';
import { CreateApprenticeDto, UpdateApprenticeDto } from './dto/apprentice.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class ApprenticesService {
  constructor(
    @InjectRepository(Apprentice)
    private readonly apprenticesRepo: Repository<Apprentice>,
    private readonly audit: AuditService,
    private readonly groupsService: GroupsService,
  ) {}

  async create(dto: CreateApprenticeDto, actor: AuthUser) {
    await this.groupsService.findOne(dto.groupId, actor);

    const entry = this.apprenticesRepo.create({
      ...dto,
      document: dto.document.trim(),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email?.toLowerCase(),
    });
    const apprentice = await this.apprenticesRepo.save(entry);
    return this.findOneWithRelations(apprentice.id);
  }

  async findAll(
    query: {
      page?: number;
      limit?: number;
      search?: string;
      groupId?: string;
      status?: string;
      document?: string;
      leaderId?: string;
    },
    user: AuthUser,
  ) {
    const { page, limit, skip, take } = paginate(query.page, query.limit);

    const qb = this.apprenticesRepo
      .createQueryBuilder('apprentice')
      .leftJoinAndSelect('apprentice.group', 'group')
      .leftJoinAndSelect('group.leader', 'leader')
      .orderBy('apprentice.lastName', 'ASC')
      .addOrderBy('apprentice.firstName', 'ASC')
      .skip(skip)
      .take(take);

    if (user.role === Role.INSTRUCTOR) {
      qb.andWhere('group.leaderId = :userId', { userId: user.id });
    }
    if (query.groupId) {
      qb.andWhere('apprentice.groupId = :groupId', { groupId: query.groupId });
    }
    if (query.status) {
      qb.andWhere('apprentice.status = :status', { status: query.status });
    }
    if (query.document) {
      qb.andWhere('apprentice.document ILIKE :document', {
        document: `%${query.document}%`,
      });
    }
    if (query.leaderId) {
      qb.andWhere('group.leaderId = :leaderId', { leaderId: query.leaderId });
    }
    if (query.search) {
      qb.andWhere(
        `(apprentice.firstName ILIKE :search OR apprentice.lastName ILIKE :search OR apprentice.document ILIKE :search OR group.number ILIKE :search)`,
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return paginatedResult(items, total, page, limit);
  }

  async findOne(id: string, user: AuthUser) {
    const apprentice = await this.findOneWithRelations(id);
    if (!apprentice) throw new NotFoundException('Aprendiz no encontrado');
    this.groupsService.assertAccess(apprentice.group.leaderId, user);
    return apprentice;
  }

  async update(id: string, dto: UpdateApprenticeDto, actor: AuthUser) {
    const current = await this.findOne(id, actor);
    if (dto.groupId && dto.groupId !== current.groupId) {
      await this.groupsService.findOne(dto.groupId, actor);
    }

    await this.apprenticesRepo.update(id, {
      ...dto,
      email: dto.email?.toLowerCase(),
    });

    const apprentice = await this.findOneWithRelations(id);

    if (dto.status && dto.status !== current.status) {
      await this.audit.log({
        actorId: actor.id,
        action: 'STATUS_CHANGE',
        entity: 'Apprentice',
        entityId: id,
        payload: { from: current.status, to: dto.status },
      });
    } else {
      await this.audit.log({
        actorId: actor.id,
        action: 'UPDATE',
        entity: 'Apprentice',
        entityId: id,
        payload: dto,
      });
    }

    return apprentice;
  }

  async ensureAccessByApprenticeId(apprenticeId: string, user: AuthUser) {
    const apprentice = await this.apprenticesRepo.findOne({
      where: { id: apprenticeId },
      relations: { group: true },
    });
    if (!apprentice) throw new NotFoundException('Aprendiz no encontrado');
    if (
      user.role === Role.INSTRUCTOR &&
      apprentice.group.leaderId !== user.id
    ) {
      throw new ForbiddenException('No tienes acceso a este aprendiz');
    }
    return apprentice;
  }

  private findOneWithRelations(id: string) {
    return this.apprenticesRepo.findOne({
      where: { id },
      relations: { group: { leader: true } },
    });
  }
}
