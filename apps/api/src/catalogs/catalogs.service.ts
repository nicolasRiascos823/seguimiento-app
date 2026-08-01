import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Competency, LearningOutcome } from '../database/entities';
import { AuditService } from '../audit/audit.service';
import {
  CreateCompetencyDto,
  CreateLearningOutcomeDto,
  UpdateCompetencyDto,
  UpdateLearningOutcomeDto,
} from './dto/catalog.dto';

@Injectable()
export class CatalogsService {
  constructor(
    @InjectRepository(Competency)
    private readonly competenciesRepo: Repository<Competency>,
    @InjectRepository(LearningOutcome)
    private readonly learningOutcomesRepo: Repository<LearningOutcome>,
    private readonly audit: AuditService,
  ) {}

  async createCompetency(dto: CreateCompetencyDto, actorId: string) {
    const exists = await this.competenciesRepo.findOne({
      where: { code: dto.code },
    });
    if (exists) throw new ConflictException('Código de competencia ya existe');

    const entry = this.competenciesRepo.create(dto);
    const item = await this.competenciesRepo.save(entry);
    await this.audit.log({
      actorId,
      action: 'CREATE',
      entity: 'Competency',
      entityId: item.id,
    });
    return item;
  }

  async listCompetencies(activeOnly = false) {
    const qb = this.competenciesRepo
      .createQueryBuilder('competency')
      .leftJoinAndSelect(
        'competency.learningOutcomes',
        'ra',
        activeOnly
          ? 'ra.deletedAt IS NULL AND ra.active = true'
          : 'ra.deletedAt IS NULL',
      )
      .orderBy('competency.code', 'ASC')
      .addOrderBy('ra.code', 'ASC');

    if (activeOnly) {
      qb.andWhere('competency.active = true');
    }

    return qb.getMany();
  }

  async updateCompetency(id: string, dto: UpdateCompetencyDto, actorId: string) {
    await this.getCompetency(id);
    await this.competenciesRepo.update(id, dto);
    const item = await this.getCompetency(id);
    await this.audit.log({
      actorId,
      action: 'UPDATE',
      entity: 'Competency',
      entityId: id,
      payload: dto,
    });
    return item;
  }

  async createLearningOutcome(dto: CreateLearningOutcomeDto, actorId: string) {
    await this.getCompetency(dto.competencyId);
    const exists = await this.learningOutcomesRepo.findOne({
      where: { competencyId: dto.competencyId, code: dto.code },
    });
    if (exists) throw new ConflictException('Código de RA ya existe en la competencia');

    const entry = this.learningOutcomesRepo.create(dto);
    const item = await this.learningOutcomesRepo.save(entry);
    await this.audit.log({
      actorId,
      action: 'CREATE',
      entity: 'LearningOutcome',
      entityId: item.id,
    });
    return item;
  }

  async updateLearningOutcome(
    id: string,
    dto: UpdateLearningOutcomeDto,
    actorId: string,
  ) {
    const existing = await this.learningOutcomesRepo.findOne({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Resultado de aprendizaje no encontrado');

    await this.learningOutcomesRepo.update(id, dto);
    const item = await this.learningOutcomesRepo.findOneOrFail({ where: { id } });
    await this.audit.log({
      actorId,
      action: 'UPDATE',
      entity: 'LearningOutcome',
      entityId: id,
      payload: dto,
    });
    return item;
  }

  async getCompetency(id: string) {
    const item = await this.competenciesRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Competencia no encontrada');
    return item;
  }
}
