import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Group, User, Apprentice } from '../database/entities';
import { Role, UserStatus } from '../database/enums';
import { AuditService } from '../audit/audit.service';
import { CreateGroupDto, UpdateGroupDto } from './dto/group.dto';
import { AuthUser } from '../common/decorators/current-user.decorator';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Apprentice)
    private readonly apprenticesRepo: Repository<Apprentice>,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateGroupDto, actor: AuthUser) {
    await this.ensureLeader(dto.leaderId);

    const exists = await this.groupsRepo.findOne({
      where: { number: dto.number },
    });
    if (exists) throw new ConflictException('La ficha ya existe');

    const entry = this.groupsRepo.create({
      number: dto.number,
      leaderId: dto.leaderId,
    });
    const group = await this.groupsRepo.save(entry);
    const result = await this.findOneWithLeader(group.id);

    await this.audit.log({
      actorId: actor.id,
      action: 'CREATE',
      entity: 'Group',
      entityId: group.id,
      payload: dto,
    });

    return result;
  }

  async findAll(
    query: { page?: number; limit?: number; search?: string; status?: string },
    user: AuthUser,
  ) {
    const { page, limit, skip, take } = paginate(query.page, query.limit);

    const qb = this.groupsRepo
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.leader', 'leader')
      .orderBy('group.number', 'ASC')
      .skip(skip)
      .take(take);

    if (user.role === Role.INSTRUCTOR) {
      qb.andWhere('group.leaderId = :leaderId', { leaderId: user.id });
    }
    if (query.status) {
      qb.andWhere('group.status = :status', { status: query.status });
    }
    if (query.search) {
      qb.andWhere(
        '(group.number ILIKE :search OR leader.fullName ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return paginatedResult(items, total, page, limit);
  }

  async findOne(id: string, user: AuthUser) {
    const group = await this.groupsRepo.findOne({
      where: { id },
      relations: { leader: true },
    });
    if (!group) throw new NotFoundException('Ficha no encontrada');

    const apprenticeCount = await this.apprenticesRepo.count({
      where: { groupId: id },
    });

    this.assertAccess(group.leaderId, user);
    return { ...group, _count: { apprentices: apprenticeCount } };
  }

  async update(id: string, dto: UpdateGroupDto, actor: AuthUser) {
    await this.findOne(id, actor);
    if (dto.leaderId) await this.ensureLeader(dto.leaderId);

    await this.groupsRepo.update(id, dto);
    const group = await this.findOneWithLeader(id);

    await this.audit.log({
      actorId: actor.id,
      action: 'UPDATE',
      entity: 'Group',
      entityId: id,
      payload: dto,
    });

    return group;
  }

  assertAccess(leaderId: string, user: AuthUser) {
    if (user.role === Role.ADMIN) return;
    if (leaderId !== user.id) {
      throw new ForbiddenException('No tienes acceso a esta ficha');
    }
  }

  private async ensureLeader(leaderId: string) {
    const leader = await this.usersRepo.findOne({
      where: {
        id: leaderId,
        role: Role.INSTRUCTOR,
        status: UserStatus.ACTIVE,
      },
    });
    if (!leader) {
      throw new BadRequestException(
        'El instructor líder debe existir, estar activo y tener rol INSTRUCTOR',
      );
    }
  }

  private async findOneWithLeader(id: string) {
    const group = await this.groupsRepo.findOne({
      where: { id },
      relations: { leader: true },
    });
    if (!group) throw new NotFoundException('Ficha no encontrada');
    return group;
  }
}
