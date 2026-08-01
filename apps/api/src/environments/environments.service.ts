import {

  ConflictException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Environment } from '../database/entities';

import { EnvironmentStatus } from '../database/enums';

import { AuditService } from '../audit/audit.service';

import { CreateEnvironmentDto, UpdateEnvironmentDto } from './dto/environment.dto';

import { AuthUser } from '../common/decorators/current-user.decorator';



@Injectable()

export class EnvironmentsService {

  constructor(

    @InjectRepository(Environment)

    private readonly environmentsRepo: Repository<Environment>,

    private readonly audit: AuditService,

  ) {}



  async create(dto: CreateEnvironmentDto, actor: AuthUser) {

    const exists = await this.environmentsRepo.findOne({

      where: { name: dto.name },

    });

    if (exists) {

      throw new ConflictException('El ambiente ya existe');

    }



    const entry = this.environmentsRepo.create(dto);

    const environment = await this.environmentsRepo.save(entry);



    await this.audit.log({

      actorId: actor.id,

      action: 'CREATE',

      entity: 'Environment',

      entityId: environment.id,

      payload: dto,

    });



    return environment;

  }



  async findAll(activeOnly = false) {

    const qb = this.environmentsRepo

      .createQueryBuilder('environment')

      .orderBy('environment.name', 'ASC');



    if (activeOnly) {

      qb.andWhere('environment.status = :status', {

        status: EnvironmentStatus.ACTIVE,

      });

    }



    return qb.getMany();

  }



  async findOne(id: string) {

    const environment = await this.environmentsRepo.findOne({ where: { id } });

    if (!environment) throw new NotFoundException('Ambiente no encontrado');

    return environment;

  }



  async update(id: string, dto: UpdateEnvironmentDto, actor: AuthUser) {

    await this.findOne(id);



    if (dto.name) {

      const exists = await this.environmentsRepo.findOne({

        where: { name: dto.name },

      });

      if (exists && exists.id !== id) {

        throw new ConflictException('El ambiente ya existe');

      }

    }



    await this.environmentsRepo.update(id, dto);

    const environment = await this.findOne(id);



    await this.audit.log({

      actorId: actor.id,

      action: 'UPDATE',

      entity: 'Environment',

      entityId: id,

      payload: dto,

    });



    return environment;

  }

}


