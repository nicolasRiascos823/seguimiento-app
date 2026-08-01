import {

  Column,

  CreateDateColumn,

  DeleteDateColumn,

  Entity,

  Index,

  JoinColumn,

  ManyToOne,

  OneToMany,

  OneToOne,

  PrimaryGeneratedColumn,

  Unique,

  UpdateDateColumn,

} from 'typeorm';

import {

  ApprenticeStatus,

  CommitteeStatus,

  DocumentType,

  EnvironmentStatus,

  FollowUpStatus,

  GroupStatus,

  ImportBatchStatus,

  Role,

  ScheduleStatus,

  TrimesterStatus,

  UserStatus,

  WarningCallNumber,

  WarningStatus,

  WarningType,

  WeekDay,

} from './enums';



@Entity('users')

export class User {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Column()

  fullName: string;



  @Index({ unique: true })

  @Column()

  email: string;



  @Column()

  passwordHash: string;



  @Column({ type: 'enum', enum: Role })

  role: Role;



  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })

  status: UserStatus;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;



  @OneToMany(() => Group, (group) => group.leader)

  ledGroups: Group[];



  @OneToMany(() => FollowUp, (followUp) => followUp.instructor)

  followUps: FollowUp[];



  @OneToMany(() => Warning, (warning) => warning.instructor)

  warnings: Warning[];



  @OneToMany(() => Schedule, (schedule) => schedule.instructor)

  schedules: Schedule[];



  @OneToMany(() => Evaluation, (evaluation) => evaluation.instructor)

  evaluations: Evaluation[];



  @OneToMany(() => RefreshToken, (token) => token.user)

  refreshTokens: RefreshToken[];



  @OneToMany(() => AuditLog, (log) => log.actor)

  auditLogs: AuditLog[];



  @OneToMany(() => ImportBatch, (batch) => batch.importedBy)

  importBatches: ImportBatch[];



  @OneToMany(() => FileObject, (file) => file.uploadedBy)

  uploadedFiles: FileObject[];

}



@Entity('groups')

export class Group {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Index({ unique: true })

  @Column()

  number: string;



  @Column()

  leaderId: string;



  @ManyToOne(() => User, (user) => user.ledGroups)

  @JoinColumn({ name: 'leaderId' })

  leader: User;



  @Column({ type: 'enum', enum: GroupStatus, default: GroupStatus.ACTIVE })

  status: GroupStatus;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;



  @OneToMany(() => Apprentice, (apprentice) => apprentice.group)

  apprentices: Apprentice[];



  @OneToMany(() => Schedule, (schedule) => schedule.group)

  schedules: Schedule[];



  @OneToMany(() => Evaluation, (evaluation) => evaluation.group)

  evaluations: Evaluation[];

}



@Entity('apprentices')

@Unique(['documentType', 'document'])

export class Apprentice {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Column({ type: 'enum', enum: DocumentType })

  documentType: DocumentType;



  @Index()

  @Column()

  document: string;



  @Column()

  firstName: string;



  @Column()

  lastName: string;



  @Column({ type: 'varchar', nullable: true })

  email: string | null;



  @Column({ type: 'varchar', nullable: true })

  phone: string | null;



  @Column()

  groupId: string;



  @ManyToOne(() => Group, (group) => group.apprentices)

  @JoinColumn({ name: 'groupId' })

  group: Group;



  @Column({

    type: 'enum',

    enum: ApprenticeStatus,

    default: ApprenticeStatus.ACTIVE,

  })

  status: ApprenticeStatus;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;



  @OneToMany(() => FollowUp, (followUp) => followUp.apprentice)

  followUps: FollowUp[];



  @OneToMany(() => Warning, (warning) => warning.apprentice)

  warnings: Warning[];



  @OneToMany(() => Evaluation, (evaluation) => evaluation.apprentice)

  evaluations: Evaluation[];

}



@Entity('trimesters')

export class Trimester {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Column()

  name: string;



  @Column({ type: 'date' })

  startDate: string;



  @Column({ type: 'date' })

  endDate: string;



  @Column({

    type: 'enum',

    enum: TrimesterStatus,

    default: TrimesterStatus.ACTIVE,

  })

  status: TrimesterStatus;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;



  @OneToMany(() => Schedule, (schedule) => schedule.trimester)

  schedules: Schedule[];



  @OneToMany(() => Evaluation, (evaluation) => evaluation.trimester)

  evaluations: Evaluation[];

}



@Entity('environments')

export class Environment {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Index({ unique: true })

  @Column()

  name: string;



  @Column({

    type: 'enum',

    enum: EnvironmentStatus,

    default: EnvironmentStatus.ACTIVE,

  })

  status: EnvironmentStatus;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;



  @OneToMany(() => Schedule, (schedule) => schedule.environment)

  schedules: Schedule[];

}



@Entity('schedules')

@Index(['trimesterId', 'groupId', 'weekDay', 'blockStart'])

@Index(['trimesterId', 'instructorId', 'weekDay', 'blockStart'])

@Index(['trimesterId', 'environmentId', 'weekDay', 'blockStart'])

export class Schedule {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Column()

  trimesterId: string;



  @ManyToOne(() => Trimester, (trimester) => trimester.schedules)

  @JoinColumn({ name: 'trimesterId' })

  trimester: Trimester;



  @Column()

  groupId: string;



  @ManyToOne(() => Group, (group) => group.schedules)

  @JoinColumn({ name: 'groupId' })

  group: Group;



  @Column()

  instructorId: string;



  @ManyToOne(() => User, (user) => user.schedules)

  @JoinColumn({ name: 'instructorId' })

  instructor: User;



  @Column()

  environmentId: string;



  @ManyToOne(() => Environment, (environment) => environment.schedules)

  @JoinColumn({ name: 'environmentId' })

  environment: Environment;



  @Column({ type: 'enum', enum: WeekDay })

  weekDay: WeekDay;



  @Column({ type: 'varchar', length: 5 })

  blockStart: string;



  @Column({

    type: 'enum',

    enum: ScheduleStatus,

    default: ScheduleStatus.ACTIVE,

  })

  status: ScheduleStatus;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;

}



@Entity('performance_statuses')

export class PerformanceStatus {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Index({ unique: true })

  @Column()

  code: string;



  @Column()

  name: string;



  @Column({ type: 'int' })

  sortOrder: number;



  @Column({ default: true })

  active: boolean;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;



  @OneToMany(() => Evaluation, (evaluation) => evaluation.performanceStatus)

  evaluations: Evaluation[];

}



@Entity('evaluations')

@Unique(['trimesterId', 'groupId', 'apprenticeId', 'instructorId'])

export class Evaluation {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Column()

  trimesterId: string;



  @ManyToOne(() => Trimester, (trimester) => trimester.evaluations)

  @JoinColumn({ name: 'trimesterId' })

  trimester: Trimester;



  @Column()

  groupId: string;



  @ManyToOne(() => Group, (group) => group.evaluations)

  @JoinColumn({ name: 'groupId' })

  group: Group;



  @Column()

  apprenticeId: string;



  @ManyToOne(() => Apprentice, (apprentice) => apprentice.evaluations)

  @JoinColumn({ name: 'apprenticeId' })

  apprentice: Apprentice;



  @Column()

  instructorId: string;



  @ManyToOne(() => User, (user) => user.evaluations)

  @JoinColumn({ name: 'instructorId' })

  instructor: User;



  @Column()

  performanceStatusId: string;



  @ManyToOne(

    () => PerformanceStatus,

    (performanceStatus) => performanceStatus.evaluations,

  )

  @JoinColumn({ name: 'performanceStatusId' })

  performanceStatus: PerformanceStatus;



  @Column({ type: 'text' })

  observations: string;



  @Column({ type: 'text', nullable: true })

  commitments: string | null;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;

}



@Entity('competencies')

export class Competency {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Index({ unique: true })

  @Column()

  code: string;



  @Column()

  name: string;



  @Column({ type: 'text', nullable: true })

  description: string | null;



  @Column({ default: true })

  active: boolean;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;



  @OneToMany(() => LearningOutcome, (ra) => ra.competency)

  learningOutcomes: LearningOutcome[];



  @OneToMany(() => FollowUp, (followUp) => followUp.competency)

  followUps: FollowUp[];

}



@Entity('learning_outcomes')

@Unique(['competencyId', 'code'])

export class LearningOutcome {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Column()

  code: string;



  @Column()

  name: string;



  @Column({ type: 'text', nullable: true })

  description: string | null;



  @Column()

  competencyId: string;



  @ManyToOne(() => Competency, (competency) => competency.learningOutcomes)

  @JoinColumn({ name: 'competencyId' })

  competency: Competency;



  @Column({ default: true })

  active: boolean;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;



  @OneToMany(() => FollowUp, (followUp) => followUp.learningOutcome)

  followUps: FollowUp[];

}



@Entity('follow_ups')

export class FollowUp {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Index()

  @Column({ type: 'timestamptz' })

  date: Date;



  @Column()

  apprenticeId: string;



  @ManyToOne(() => Apprentice, (apprentice) => apprentice.followUps)

  @JoinColumn({ name: 'apprenticeId' })

  apprentice: Apprentice;



  @Column()

  instructorId: string;



  @ManyToOne(() => User, (user) => user.followUps)

  @JoinColumn({ name: 'instructorId' })

  instructor: User;



  @Column()

  competencyId: string;



  @ManyToOne(() => Competency, (competency) => competency.followUps)

  @JoinColumn({ name: 'competencyId' })

  competency: Competency;



  @Column()

  learningOutcomeId: string;



  @ManyToOne(() => LearningOutcome, (ra) => ra.followUps)

  @JoinColumn({ name: 'learningOutcomeId' })

  learningOutcome: LearningOutcome;



  @Column({ type: 'text' })

  observations: string;



  @Column({ type: 'text', nullable: true })

  commitments: string | null;



  @Column({ type: 'enum', enum: FollowUpStatus, default: FollowUpStatus.OPEN })

  status: FollowUpStatus;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;

}



@Entity('file_objects')

export class FileObject {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Column()

  originalName: string;



  @Column()

  mimeType: string;



  @Column({ type: 'int' })

  size: number;



  @Column()

  storagePath: string;



  @Column()

  uploadedById: string;



  @ManyToOne(() => User, (user) => user.uploadedFiles)

  @JoinColumn({ name: 'uploadedById' })

  uploadedBy: User;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;



  @OneToOne(() => Warning, (warning) => warning.attachment)

  warning: Warning | null;

}



@Entity('warnings')

export class Warning {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Index()

  @Column({ type: 'timestamptz' })

  date: Date;



  @Column()

  apprenticeId: string;



  @ManyToOne(() => Apprentice, (apprentice) => apprentice.warnings)

  @JoinColumn({ name: 'apprenticeId' })

  apprentice: Apprentice;



  @Column()

  instructorId: string;



  @ManyToOne(() => User, (user) => user.warnings)

  @JoinColumn({ name: 'instructorId' })

  instructor: User;



  @Column()

  reason: string;



  @Column({ type: 'text', nullable: true })

  observation: string | null;



  /** @deprecated legacy column kept for sync safety */

  @Column({ type: 'text', nullable: true })

  description: string | null;



  @Column({ type: 'enum', enum: WarningCallNumber, nullable: true })

  callNumber: WarningCallNumber | null;



  @Column({

    type: 'enum',

    enum: CommitteeStatus,

    default: CommitteeStatus.NONE,

  })

  committeeStatus: CommitteeStatus;



  /** @deprecated legacy column kept for sync safety */

  @Column({ type: 'enum', enum: WarningType, nullable: true })

  type: WarningType | null;



  /** @deprecated legacy column kept for sync safety */

  @Column({ type: 'text', nullable: true })

  commitments: string | null;



  /** @deprecated legacy column kept for sync safety */

  @Column({ type: 'enum', enum: WarningStatus, nullable: true })

  status: WarningStatus | null;



  /** @deprecated legacy column kept for sync safety */

  @Column({ type: 'uuid', nullable: true, unique: true })

  attachmentId: string | null;



  @OneToOne(() => FileObject, (file) => file.warning, { nullable: true })

  @JoinColumn({ name: 'attachmentId' })

  attachment: FileObject | null;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;

}



@Entity('import_batches')

export class ImportBatch {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Column()

  fileName: string;



  @Column({

    type: 'enum',

    enum: ImportBatchStatus,

    default: ImportBatchStatus.PENDING,

  })

  status: ImportBatchStatus;



  @Column({ type: 'int', default: 0 })

  totalRows: number;



  @Column({ type: 'int', default: 0 })

  createdCount: number;



  @Column({ type: 'int', default: 0 })

  updatedCount: number;



  @Column({ type: 'int', default: 0 })

  errorCount: number;



  @Column({ type: 'jsonb', nullable: true })

  summary: Record<string, unknown> | null;



  @Column()

  importedById: string;



  @ManyToOne(() => User, (user) => user.importBatches)

  @JoinColumn({ name: 'importedById' })

  importedBy: User;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;



  @DeleteDateColumn({ nullable: true })

  deletedAt: Date | null;



  @OneToMany(() => ImportRowError, (error) => error.batch)

  errors: ImportRowError[];

}



@Entity('import_row_errors')

export class ImportRowError {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Column()

  batchId: string;



  @ManyToOne(() => ImportBatch, (batch) => batch.errors, {

    onDelete: 'CASCADE',

  })

  @JoinColumn({ name: 'batchId' })

  batch: ImportBatch;



  @Column({ type: 'int' })

  rowNumber: number;



  @Column()

  message: string;



  @Column({ type: 'jsonb', nullable: true })

  rawData: Record<string, unknown> | null;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;

}



@Entity('audit_logs')

export class AuditLog {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Column({ type: 'uuid', nullable: true })

  actorId: string | null;



  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true })

  @JoinColumn({ name: 'actorId' })

  actor: User | null;



  @Column()

  action: string;



  @Column()

  entity: string;



  @Column({ type: 'varchar', nullable: true })

  entityId: string | null;



  @Column({ type: 'jsonb', nullable: true })

  payload: Record<string, unknown> | null;



  @Column({ type: 'varchar', nullable: true })

  ipAddress: string | null;



  @Column({ type: 'varchar', nullable: true })

  userAgent: string | null;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;

}



@Entity('refresh_tokens')

export class RefreshToken {

  @PrimaryGeneratedColumn('uuid')

  id: string;



  @Column()

  userId: string;



  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE' })

  @JoinColumn({ name: 'userId' })

  user: User;



  @Index({ unique: true })

  @Column()

  tokenHash: string;



  @Column({ type: 'timestamptz' })

  expiresAt: Date;



  @Column({ type: 'timestamptz', nullable: true })

  revokedAt: Date | null;



  @CreateDateColumn()

  createdAt: Date;



  @UpdateDateColumn()

  updatedAt: Date;

}


