import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Apprentice,
  Evaluation,
  Group,
  PerformanceStatus,
  Trimester,
  Warning,
} from '../database/entities';
import {
  CommitteeStatus,
  Role,
  TrimesterStatus,
  WarningCallNumber,
} from '../database/enums';
import { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Apprentice)
    private readonly apprenticesRepo: Repository<Apprentice>,
    @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
    @InjectRepository(Evaluation)
    private readonly evaluationsRepo: Repository<Evaluation>,
    @InjectRepository(Warning)
    private readonly warningsRepo: Repository<Warning>,
    @InjectRepository(Trimester)
    private readonly trimestersRepo: Repository<Trimester>,
    @InjectRepository(PerformanceStatus)
    private readonly performanceRepo: Repository<PerformanceStatus>,
  ) {}

  async getMetrics(user: AuthUser) {
    const isInstructor = user.role === Role.INSTRUCTOR;
    const activeTrimester = await this.trimestersRepo.findOne({
      where: { status: TrimesterStatus.ACTIVE },
      order: { startDate: 'DESC' },
    });

    const criticalStatus = await this.performanceRepo.findOne({
      where: { code: 'CRITICAL' },
    });

    const [
      secondCallApprentices,
      criticalApprentices,
      pendingCommittees,
      groupsPendingFollowUp,
      alertsSecondCall,
      alertsCritical,
      alertsCommittees,
    ] = await Promise.all([
      this.countDistinctApprenticesWithCall(
        WarningCallNumber.SECOND,
        isInstructor,
        user.id,
      ),
      criticalStatus
        ? this.countCritical(criticalStatus.id, isInstructor, user.id, activeTrimester?.id)
        : Promise.resolve(0),
      this.countCommittees(CommitteeStatus.PENDING, isInstructor, user.id),
      activeTrimester
        ? this.countGroupsWithoutEvaluation(activeTrimester.id, isInstructor, user.id)
        : Promise.resolve(0),
      this.listSecondCallAlerts(isInstructor, user.id),
      criticalStatus && activeTrimester
        ? this.listCriticalAlerts(criticalStatus.id, activeTrimester.id, isInstructor, user.id)
        : Promise.resolve([]),
      this.listCommitteeAlerts(isInstructor, user.id),
    ]);

    const alertsGroupsPending = activeTrimester
      ? await this.listGroupsPendingFollowUp(
          activeTrimester.id,
          isInstructor,
          user.id,
        )
      : [];

    return {
      activeTrimester,
      indicators: {
        criticalApprentices,
        secondCallApprentices,
        pendingCommittees,
        groupsPendingFollowUp,
      },
      alerts: {
        secondCall: alertsSecondCall,
        critical: alertsCritical,
        pendingCommittees: alertsCommittees,
        groupsWithoutFollowUp: alertsGroupsPending,
      },
    };
  }

  private instructorScope(
    qb: ReturnType<Repository<Warning>['createQueryBuilder']>,
    alias: string,
    isInstructor: boolean,
    userId: string,
  ) {
    if (isInstructor) {
      qb.innerJoin(`${alias}.apprentice`, 'apprentice')
        .innerJoin('apprentice.group', 'group')
        .andWhere('group.leaderId = :leaderId', { leaderId: userId });
    }
  }

  private countDistinctApprenticesWithCall(
    callNumber: WarningCallNumber,
    isInstructor: boolean,
    userId: string,
  ) {
    const qb = this.warningsRepo
      .createQueryBuilder('warning')
      .select('COUNT(DISTINCT warning.apprenticeId)', 'count')
      .where('warning.callNumber = :callNumber', { callNumber });
    this.instructorScope(qb, 'warning', isInstructor, userId);
    return qb.getRawOne<{ count: string }>().then((r) => Number(r?.count ?? 0));
  }

  private countCritical(
    statusId: string,
    isInstructor: boolean,
    userId: string,
    trimesterId?: string,
  ) {
    const qb = this.evaluationsRepo
      .createQueryBuilder('evaluation')
      .select('COUNT(DISTINCT evaluation.apprenticeId)', 'count')
      .where('evaluation.performanceStatusId = :statusId', { statusId });
    if (trimesterId) {
      qb.andWhere('evaluation.trimesterId = :trimesterId', { trimesterId });
    }
    if (isInstructor) {
      qb.innerJoin('evaluation.group', 'group').andWhere(
        'group.leaderId = :leaderId',
        { leaderId: userId },
      );
    }
    return qb.getRawOne<{ count: string }>().then((r) => Number(r?.count ?? 0));
  }

  private countCommittees(
    status: CommitteeStatus,
    isInstructor: boolean,
    userId: string,
  ) {
    const qb = this.warningsRepo
      .createQueryBuilder('warning')
      .where('warning.committeeStatus = :status', { status });
    this.instructorScope(qb, 'warning', isInstructor, userId);
    return qb.getCount();
  }

  private async countGroupsWithoutEvaluation(
    trimesterId: string,
    isInstructor: boolean,
    userId: string,
  ) {
    const groupsQb = this.groupsRepo.createQueryBuilder('group');
    if (isInstructor) {
      groupsQb.where('group.leaderId = :leaderId', { leaderId: userId });
    }
    const groups = await groupsQb.getMany();
    if (!groups.length) return 0;

    const evaluated = await this.evaluationsRepo
      .createQueryBuilder('evaluation')
      .select('DISTINCT evaluation.groupId', 'groupId')
      .where('evaluation.trimesterId = :trimesterId', { trimesterId })
      .getRawMany<{ groupId: string }>();
    const evaluatedSet = new Set(evaluated.map((e) => e.groupId));
    return groups.filter((g) => !evaluatedSet.has(g.id)).length;
  }

  private listSecondCallAlerts(isInstructor: boolean, userId: string) {
    const qb = this.warningsRepo
      .createQueryBuilder('warning')
      .leftJoinAndSelect('warning.apprentice', 'apprentice')
      .leftJoinAndSelect('apprentice.group', 'group')
      .where('warning.callNumber = :callNumber', {
        callNumber: WarningCallNumber.SECOND,
      })
      .orderBy('warning.date', 'DESC')
      .take(20);
    if (isInstructor) {
      qb.andWhere('group.leaderId = :leaderId', { leaderId: userId });
    }
    return qb.getMany();
  }

  private listCriticalAlerts(
    statusId: string,
    trimesterId: string,
    isInstructor: boolean,
    userId: string,
  ) {
    const qb = this.evaluationsRepo
      .createQueryBuilder('evaluation')
      .leftJoinAndSelect('evaluation.apprentice', 'apprentice')
      .leftJoinAndSelect('evaluation.group', 'group')
      .leftJoinAndSelect('evaluation.instructor', 'instructor')
      .leftJoinAndSelect('evaluation.performanceStatus', 'performanceStatus')
      .where('evaluation.performanceStatusId = :statusId', { statusId })
      .andWhere('evaluation.trimesterId = :trimesterId', { trimesterId })
      .orderBy('evaluation.updatedAt', 'DESC')
      .take(20);
    if (isInstructor) {
      qb.andWhere('group.leaderId = :leaderId', { leaderId: userId });
    }
    return qb.getMany();
  }

  private listCommitteeAlerts(isInstructor: boolean, userId: string) {
    const qb = this.warningsRepo
      .createQueryBuilder('warning')
      .leftJoinAndSelect('warning.apprentice', 'apprentice')
      .leftJoinAndSelect('apprentice.group', 'group')
      .where('warning.committeeStatus IN (:...statuses)', {
        statuses: [CommitteeStatus.PENDING, CommitteeStatus.IN_COMMITTEE],
      })
      .orderBy('warning.date', 'DESC')
      .take(20);
    if (isInstructor) {
      qb.andWhere('group.leaderId = :leaderId', { leaderId: userId });
    }
    return qb.getMany();
  }

  private async listGroupsPendingFollowUp(
    trimesterId: string,
    isInstructor: boolean,
    userId: string,
  ) {
    const groupsQb = this.groupsRepo
      .createQueryBuilder('group')
      .leftJoinAndSelect('group.leader', 'leader');
    if (isInstructor) {
      groupsQb.where('group.leaderId = :leaderId', { leaderId: userId });
    }
    const groups = await groupsQb.getMany();
    const evaluated = await this.evaluationsRepo
      .createQueryBuilder('evaluation')
      .select('DISTINCT evaluation.groupId', 'groupId')
      .where('evaluation.trimesterId = :trimesterId', { trimesterId })
      .getRawMany<{ groupId: string }>();
    const evaluatedSet = new Set(evaluated.map((e) => e.groupId));
    return groups.filter((g) => !evaluatedSet.has(g.id)).slice(0, 20);
  }
}
