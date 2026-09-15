export type Role = "ADMIN" | "INSTRUCTOR";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type GroupStatus = "ACTIVE" | "INACTIVE";
export type ApprenticeStatus = "ACTIVE" | "INACTIVE" | "WITHDRAWN" | "GRADUATED";
export type DocumentType = "CC" | "TI" | "CE" | "PASSPORT" | "OTHER";
export type TrimesterStatus = "ACTIVE" | "FINISHED";
export type EnvironmentStatus = "ACTIVE" | "INACTIVE";
export type WeekDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY";
export type ScheduleStatus = "ACTIVE" | "INACTIVE";
export type WarningCallNumber = "FIRST" | "SECOND";
export type CommitteeStatus = "NONE" | "PENDING" | "IN_COMMITTEE" | "DONE";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  status: UserStatus;
  createdAt?: string;
}

export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginatedMeta;
}

export interface Group {
  id: string;
  number: string;
  status: GroupStatus;
  leaderId: string;
  leader?: Pick<User, "id" | "fullName" | "email">;
  _count?: { apprentices: number };
  createdAt?: string;
}

export interface Apprentice {
  id: string;
  documentType: DocumentType;
  document: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  status: ApprenticeStatus;
  groupId: string;
  group?: Pick<Group, "id" | "number"> & { leader?: Pick<User, "id" | "fullName"> };
  createdAt?: string;
}

export interface Competency {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
  learningOutcomes?: LearningOutcome[];
}

export interface LearningOutcome {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
  competencyId: string;
  competency?: Pick<Competency, "id" | "code" | "name">;
}

export interface Trimester {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: TrimesterStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Environment {
  id: string;
  name: string;
  status: EnvironmentStatus;
  isVirtual: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TimeBlock {
  start: string;
  end: string;
  label: string;
}

export interface Schedule {
  id: string;
  trimesterId: string;
  groupId: string;
  instructorId: string;
  environmentId: string;
  weekDay: WeekDay;
  blockStart: string;
  status: ScheduleStatus;
  createdAt?: string;
  updatedAt?: string;
  trimester?: Trimester;
  group?: Pick<Group, "id" | "number">;
  instructor?: Pick<User, "id" | "fullName">;
  environment?: Environment;
}

export interface CalendarBlock {
  blockStart: string;
  blockEnd: string;
  label: string;
  schedules: Schedule[];
}

export interface CalendarDay {
  weekDay: WeekDay;
  blocks: CalendarBlock[];
}

export interface CalendarResponse {
  timeBlocks: TimeBlock[];
  days: CalendarDay[];
  schedules: Schedule[];
}

export interface PerformanceStatus {
  id: string;
  code: string;
  name: string;
  sortOrder: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Evaluation {
  id: string;
  trimesterId: string;
  groupId: string;
  apprenticeId: string;
  instructorId: string;
  performanceStatusId: string;
  observations: string;
  commitments: string | null;
  createdAt?: string;
  updatedAt?: string;
  apprentice?: Apprentice;
  instructor?: Pick<User, "id" | "fullName">;
  performanceStatus?: PerformanceStatus;
  trimester?: Trimester;
  group?: Pick<Group, "id" | "number">;
}

export interface EvaluationMatrixResponse {
  apprentices: Apprentice[];
  instructors: Pick<User, "id" | "fullName">[];
  evaluations: Evaluation[];
}

export interface Warning {
  id: string;
  date: string;
  apprenticeId: string;
  instructorId: string;
  reason: string;
  observation: string | null;
  callNumber: WarningCallNumber | null;
  committeeStatus: CommitteeStatus;
  createdAt?: string;
  updatedAt?: string;
  apprentice?: Pick<Apprentice, "id" | "firstName" | "lastName" | "document"> & {
    group?: Pick<Group, "id" | "number">;
  };
  instructor?: Pick<User, "id" | "fullName">;
}

export interface TimelineEvent {
  id: string;
  type: "FOLLOW_UP" | "WARNING" | "STATUS_CHANGE" | "EVALUATION";
  date: string;
  title: string;
  description: string;
  commitments?: string | null;
  status?: string | null;
  meta?: unknown;
}

export interface DashboardIndicators {
  criticalApprentices: number;
  secondCallApprentices: number;
  pendingCommittees: number;
  groupsPendingFollowUp: number;
}

export interface DashboardAlerts {
  secondCall: Warning[];
  critical: Evaluation[];
  pendingCommittees: Warning[];
  groupsWithoutFollowUp: Group[];
}

export interface DashboardResponse {
  activeTrimester: Trimester | null;
  indicators: DashboardIndicators;
  alerts: DashboardAlerts;
}

export interface ImportBatch {
  id: string;
  fileName: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  totalRows: number;
  successRows: number;
  errorRows: number;
  createdAt: string;
}

export interface FileObject {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
