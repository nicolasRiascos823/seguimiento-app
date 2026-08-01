import {

  ConflictException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { PerformanceStatus } from '../database/entities';

import { AuditService } from '../audit/audit.service';

import {

  CreatePerformanceStatusDto,

  UpdatePerformanceStatusDto,

} from './dto/performance-status.dto';

import { AuthUser } from '../common/decorators/current-user.decorator';



@Injectable()

export class PerformanceStatusesService {

  constructor(

    @InjectRepository(PerformanceStatus)

    private readonly performanceStatusesRepo: Repository<PerformanceStatus>,

    private readonly audit: AuditService,

  ) {}



  async create(dto: CreatePerformanceStatusDto, actor: AuthUser) {

    const exists = await this.performanceStatusesRepo.findOne({

      where: { code: dto.code },

    });

    if (exists) {

      throw new ConflictException('El código de estado ya existe');

    }



    const entry = this.performanceStatusesRepo.create(dto);

    const item = await this.performanceStatusesRepo.save(entry);



    await this.audit.log({

      actorId: actor.id,

      action: 'CREATE',

      entity: 'PerformanceStatus',

      entityId: item.id,

      payload: dto,

    });



    return item;

  }



  async findAll(activeOnly = false) {

    const qb = this.performanceStatusesRepo

      .createQueryBuilder('status')

      .orderBy('status.sortOrder', 'ASC')

      .addOrderBy('status.name', 'ASC');



    if (activeOnly) {

      qb.andWhere('status.active = true');

    }



    return qb.getMany();

  }



  async findOne(id: string) {

    const item = await this.performanceStatusesRepo.findOne({ where: { id } });

    if (!item) {

      throw new NotFoundException('Estado de desempeño no encontrado');

    }

    return item;

  }



  async update(id: string, dto: UpdatePerformanceStatusDto, actor: AuthUser) {

    await this.findOne(id);



    if (dto.code) {

      const exists = await this.performanceStatusesRepo.findOne({

        where: { code: dto.code },

      });

      if (exists && exists.id !== id) {

        throw new ConflictException('El código de estado ya existe');

      }

    }



    await this.performanceStatusesRepo.update(id, dto);

    const item = await this.findOne(id);



    await this.audit.log({

      actorId: actor.id,

      action: 'UPDATE',

      entity: 'PerformanceStatus',

      entityId: id,

      payload: dto,

    });



    return item;

  }

}


