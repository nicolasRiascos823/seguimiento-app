import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { Not, Repository } from 'typeorm';
import { User } from '../database/entities';
import { Role, UserStatus } from '../database/enums';
import { AuditService } from '../audit/audit.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { paginate, paginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateUserDto, actorId: string) {
    const email = dto.email.toLowerCase();
    const exists = await this.usersRepo.findOne({ where: { email } });
    if (exists) {
      throw new ConflictException('El correo ya está registrado');
    }

    const entry = this.usersRepo.create({
      fullName: dto.fullName,
      email,
      passwordHash: await argon2.hash(dto.password),
      role: dto.role,
    });
    const user = await this.usersRepo.save(entry);

    await this.audit.log({
      actorId,
      action: 'CREATE',
      entity: 'User',
      entityId: user.id,
      payload: { email: user.email, role: user.role },
    });

    return this.pickPublic(user);
  }

  async findAll(query: { page?: number; limit?: number; search?: string; role?: Role }) {
    const { page, limit, skip, take } = paginate(query.page, query.limit);

    const qb = this.usersRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.fullName',
        'user.email',
        'user.role',
        'user.status',
        'user.createdAt',
        'user.updatedAt',
      ])
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(take);

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }
    if (query.search) {
      qb.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    return paginatedResult(items, total, page, limit);
  }

  async findOne(id: string) {
    const user = await this.usersRepo.findOne({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    await this.findOne(id);

    if (dto.email) {
      const email = dto.email.toLowerCase();
      const exists = await this.usersRepo.findOne({
        where: { email, id: Not(id) },
      });
      if (exists) throw new ConflictException('El correo ya está registrado');
    }

    await this.usersRepo.update(id, {
      fullName: dto.fullName,
      email: dto.email?.toLowerCase(),
      role: dto.role,
      status: dto.status,
      ...(dto.password
        ? { passwordHash: await argon2.hash(dto.password) }
        : {}),
    });

    const user = await this.findOne(id);

    await this.audit.log({
      actorId,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      payload: dto,
    });

    return user;
  }

  async deactivate(id: string, actorId: string) {
    await this.findOne(id);
    await this.usersRepo.update(id, { status: UserStatus.INACTIVE });
    const user = await this.findOne(id);

    await this.audit.log({
      actorId,
      action: 'DEACTIVATE',
      entity: 'User',
      entityId: id,
    });

    return user;
  }

  async listInstructors() {
    return this.usersRepo.find({
      where: {
        role: Role.INSTRUCTOR,
        status: UserStatus.ACTIVE,
      },
      select: { id: true, fullName: true, email: true },
      order: { fullName: 'ASC' },
    });
  }

  private pickPublic(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
