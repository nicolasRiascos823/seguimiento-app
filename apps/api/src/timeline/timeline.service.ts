import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AuditLog, FollowUp, Warning } from '../database/entities';
import { ApprenticesService } from '../apprentices/apprentices.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class TimelineService {
  constructor(
    @InjectRepository(FollowUp)
    private readonly followUpsRepo: Repository<FollowUp>,
    @InjectRepository(Warning)
    private readonly warningsRepo: Repository<Warning>,
    @InjectRepository(AuditLog)
    private readonly auditLogsRepo: Repository<AuditLog>,
    private readonly apprenticesService: ApprenticesService,
  ) {}

  async getApprenticeTimeline(apprenticeId: string, user: AuthUser) {
    await this.apprenticesService.ensureAccessByApprenticeId(apprenticeId, user);

    const [followUps, warnings, audits] = await Promise.all([
      this.followUpsRepo.find({
        where: { apprenticeId },
        relations: {
          instructor: true,
          competency: true,
          learningOutcome: true,
        },
      }),
      this.warningsRepo.find({
        where: { apprenticeId },
        relations: { instructor: true },
      }),
      this.auditLogsRepo.find({
        where: {
          entity: 'Apprentice',
          entityId: apprenticeId,
          action: In(['STATUS_CHANGE', 'CREATE', 'UPDATE']),
        },
        relations: { actor: true },
        order: { createdAt: 'DESC' },
      }),
    ]);

    const events = [
      ...followUps.map((item) => ({
        id: item.id,
        type: 'FOLLOW_UP' as const,
        date: item.date,
        title: `Seguimiento — ${item.competency.code}`,
        description: item.observations,
        commitments: item.commitments,
        status: item.status,
        meta: item,
      })),
      ...warnings.map((item) => ({
        id: item.id,
        type: 'WARNING' as const,
        date: item.date,
        title: `Llamado de atención${item.callNumber ? ` (${item.callNumber === 'FIRST' ? '1°' : '2°'})` : ''}`,
        description: item.observation ?? item.description ?? item.reason,
        commitments: item.commitments,
        status: item.committeeStatus,
        meta: item,
      })),
      ...audits.map((item) => ({
        id: item.id,
        type: 'STATUS_CHANGE' as const,
        date: item.createdAt,
        title: `Cambio registrado: ${item.action}`,
        description: JSON.stringify(item.payload ?? {}),
        commitments: null,
        status: null,
        meta: item,
      })),
    ];

    events.sort((a, b) => b.date.getTime() - a.date.getTime());
    return events;
  }
}
