import {

  ForbiddenException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Warning } from '../database/entities';

import {

  CommitteeStatus,

  Role,

  WarningCallNumber,

} from '../database/enums';

import { AuditService } from '../audit/audit.service';

import { ApprenticesService } from '../apprentices/apprentices.service';

import {

  CreateWarningDto,

  UpdateWarningCommitteeStatusDto,

} from './dto/warning.dto';

import { AuthUser } from '../common/decorators/current-user.decorator';

import { paginate, paginatedResult } from '../common/dto/pagination.dto';



@Injectable()

export class WarningsService {

  constructor(

    @InjectRepository(Warning)

    private readonly warningsRepo: Repository<Warning>,

    private readonly audit: AuditService,

    private readonly apprenticesService: ApprenticesService,

  ) {}



  async create(dto: CreateWarningDto, actor: AuthUser) {

    await this.apprenticesService.ensureAccessByApprenticeId(

      dto.apprenticeId,

      actor,

    );



    const committeeStatus =

      dto.callNumber === WarningCallNumber.SECOND

        ? CommitteeStatus.PENDING

        : CommitteeStatus.NONE;



    const entry = this.warningsRepo.create({

      date: new Date(dto.date),

      apprenticeId: dto.apprenticeId,

      instructorId: actor.id,

      reason: dto.reason,

      observation: dto.observation ?? null,

      callNumber: dto.callNumber,

      committeeStatus,

    });

    const warning = await this.warningsRepo.save(entry);

    const result = await this.findOneWithRelations(warning.id);



    await this.audit.log({

      actorId: actor.id,

      action: 'CREATE',

      entity: 'Warning',

      entityId: warning.id,

    });



    return result!;

  }



  async updateCommitteeStatus(

    id: string,

    dto: UpdateWarningCommitteeStatusDto,

    actor: AuthUser,

  ) {

    const warning = await this.findOneWithRelations(id);

    if (!warning) throw new NotFoundException('Llamado de atención no encontrado');



    await this.assertCommitteeAccess(warning, actor);



    await this.warningsRepo.update(id, {

      committeeStatus: dto.committeeStatus,

    });

    const result = await this.findOneWithRelations(id);



    await this.audit.log({

      actorId: actor.id,

      action: 'UPDATE',

      entity: 'Warning',

      entityId: id,

      payload: dto,

    });



    return result!;

  }



  async findAll(

    query: {

      page?: number;

      limit?: number;

      apprenticeId?: string;

      callNumber?: WarningCallNumber;

      committeeStatus?: CommitteeStatus;

    },

    user: AuthUser,

  ) {

    const { page, limit, skip, take } = paginate(query.page, query.limit);



    const qb = this.buildListQuery(user);

    if (query.apprenticeId) {

      qb.andWhere('warning.apprenticeId = :apprenticeId', {

        apprenticeId: query.apprenticeId,

      });

    }

    if (query.callNumber) {

      qb.andWhere('warning.callNumber = :callNumber', {

        callNumber: query.callNumber,

      });

    }

    if (query.committeeStatus) {

      qb.andWhere('warning.committeeStatus = :committeeStatus', {

        committeeStatus: query.committeeStatus,

      });

    }



    const [items, total] = await qb

      .orderBy('warning.date', 'DESC')

      .skip(skip)

      .take(take)

      .getManyAndCount();



    return paginatedResult(items, total, page, limit);

  }



  async findOne(id: string, user: AuthUser) {

    const item = await this.findOneWithRelations(id);

    if (!item) throw new NotFoundException('Llamado de atención no encontrado');

    await this.apprenticesService.ensureAccessByApprenticeId(

      item.apprenticeId,

      user,

    );

    return item;

  }



  private async assertCommitteeAccess(warning: Warning, user: AuthUser) {

    if (user.role === Role.ADMIN) return;



    if (warning.instructorId === user.id) {

      await this.apprenticesService.ensureAccessByApprenticeId(

        warning.apprenticeId,

        user,

      );

      return;

    }



    throw new ForbiddenException(

      'No tiene permiso para actualizar el estado de comité',

    );

  }



  private buildListQuery(user: AuthUser) {

    const qb = this.warningsRepo

      .createQueryBuilder('warning')

      .leftJoinAndSelect('warning.apprentice', 'apprentice')

      .leftJoinAndSelect('warning.instructor', 'instructor');



    if (user.role === Role.INSTRUCTOR) {

      qb.innerJoin('apprentice.group', 'group').andWhere(

        'group.leaderId = :leaderId',

        { leaderId: user.id },

      );

    }



    return qb;

  }



  private findOneWithRelations(id: string) {

    return this.warningsRepo.findOne({

      where: { id },

      relations: { apprentice: true, instructor: true },

    });

  }

}


