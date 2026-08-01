import {

  BadRequestException,

  Injectable,

  NotFoundException,

} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Trimester } from '../database/entities';

import { TrimesterStatus } from '../database/enums';

import { AuditService } from '../audit/audit.service';

import { CreateTrimesterDto, UpdateTrimesterDto } from './dto/trimester.dto';

import { AuthUser } from '../common/decorators/current-user.decorator';



@Injectable()

export class TrimestersService {

  constructor(

    @InjectRepository(Trimester)

    private readonly trimestersRepo: Repository<Trimester>,

    private readonly audit: AuditService,

  ) {}



  async create(dto: CreateTrimesterDto, actor: AuthUser) {

    this.assertDateRange(dto.startDate, dto.endDate);



    const entry = this.trimestersRepo.create({

      name: dto.name,

      startDate: dto.startDate,

      endDate: dto.endDate,

    });

    const trimester = await this.trimestersRepo.save(entry);



    await this.audit.log({

      actorId: actor.id,

      action: 'CREATE',

      entity: 'Trimester',

      entityId: trimester.id,

      payload: dto,

    });



    return trimester;

  }



  async findAll(status?: TrimesterStatus) {

    const qb = this.trimestersRepo

      .createQueryBuilder('trimester')

      .orderBy('trimester.startDate', 'DESC');



    if (status) {

      qb.andWhere('trimester.status = :status', { status });

    }



    return qb.getMany();

  }



  async findOne(id: string) {

    const trimester = await this.trimestersRepo.findOne({ where: { id } });

    if (!trimester) throw new NotFoundException('Trimestre no encontrado');

    return trimester;

  }



  async update(id: string, dto: UpdateTrimesterDto, actor: AuthUser) {

    const existing = await this.findOne(id);



    const startDate = dto.startDate ?? existing.startDate;

    const endDate = dto.endDate ?? existing.endDate;

    this.assertDateRange(startDate, endDate);



    await this.trimestersRepo.update(id, dto);

    const trimester = await this.findOne(id);



    await this.audit.log({

      actorId: actor.id,

      action: 'UPDATE',

      entity: 'Trimester',

      entityId: id,

      payload: dto,

    });



    return trimester;

  }



  private assertDateRange(startDate: string, endDate: string) {

    if (startDate >= endDate) {

      throw new BadRequestException(

        'La fecha de inicio debe ser anterior a la fecha de fin',

      );

    }

  }

}


