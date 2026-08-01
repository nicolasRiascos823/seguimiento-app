export enum Role {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum GroupStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ApprenticeStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  WITHDRAWN = 'WITHDRAWN',
  GRADUATED = 'GRADUATED',
}

export enum DocumentType {
  CC = 'CC',
  TI = 'TI',
  CE = 'CE',
  PASSPORT = 'PASSPORT',
  OTHER = 'OTHER',
}

/** @deprecated Legacy follow-up status */
export enum FollowUpStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
}

/** @deprecated Legacy warning type */
export enum WarningType {
  ACADEMIC = 'ACADEMIC',
  DISCIPLINARY = 'DISCIPLINARY',
}

export enum WarningStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  CLOSED = 'CLOSED',
}

export enum ImportBatchStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum TrimesterStatus {
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

export enum EnvironmentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
}

export enum ScheduleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum WarningCallNumber {
  FIRST = 'FIRST',
  SECOND = 'SECOND',
}

export enum CommitteeStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  IN_COMMITTEE = 'IN_COMMITTEE',
  DONE = 'DONE',
}

/** Predefined 1-hour blocks from 06:00 to 22:00 */
export const TIME_BLOCKS = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
] as const;

export type TimeBlockStart = (typeof TIME_BLOCKS)[number];

export function timeBlockEnd(start: string): string {
  const [h, m] = start.split(':').map(Number);
  const endH = h + 1;
  return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function isValidTimeBlock(start: string): boolean {
  return (TIME_BLOCKS as readonly string[]).includes(start);
}

/** Inclusive start block, exclusive end clock time. E.g. 08:00–12:00 → 08,09,10,11 */
export function expandTimeBlocks(blockStart: string, blockEnd: string): string[] {
  if (!isValidTimeBlock(blockStart)) {
    throw new Error(`Hora de inicio inválida: ${blockStart}`);
  }
  const validEnds = TIME_BLOCKS.map((b) => timeBlockEnd(b));
  if (!validEnds.includes(blockEnd)) {
    throw new Error(`Hora de fin inválida: ${blockEnd}`);
  }
  if (blockEnd <= blockStart) {
    throw new Error('La hora de fin debe ser posterior a la de inicio');
  }
  return TIME_BLOCKS.filter((b) => b >= blockStart && timeBlockEnd(b) <= blockEnd);
}
