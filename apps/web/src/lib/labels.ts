import type {
  ApprenticeStatus,
  CommitteeStatus,
  DocumentType,
  EnvironmentStatus,
  GroupStatus,
  Role,
  ScheduleStatus,
  TrimesterStatus,
  UserStatus,
  WarningCallNumber,
  WeekDay,
} from "./types";

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrador",
  INSTRUCTOR: "Instructor",
};

export const userStatusLabels: Record<UserStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

export const groupStatusLabels: Record<GroupStatus, string> = {
  ACTIVE: "Activa",
  INACTIVE: "Inactiva",
};

export const apprenticeStatusLabels: Record<ApprenticeStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
  WITHDRAWN: "Retirado",
  GRADUATED: "Graduado",
};

export const documentTypeLabels: Record<DocumentType, string> = {
  CC: "Cédula de ciudadanía",
  TI: "Tarjeta de identidad",
  CE: "Cédula de extranjería",
  PASSPORT: "Pasaporte",
  OTHER: "Otro",
};

export const trimesterStatusLabels: Record<TrimesterStatus, string> = {
  ACTIVE: "Activo",
  FINISHED: "Finalizado",
};

export const environmentStatusLabels: Record<EnvironmentStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

export const scheduleStatusLabels: Record<ScheduleStatus, string> = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

export const weekDayLabels: Record<WeekDay, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miércoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sábado",
};

export const weekDays: WeekDay[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

export const callNumberLabels: Record<WarningCallNumber, string> = {
  FIRST: "Primer llamado",
  SECOND: "Segundo llamado",
};

export const committeeStatusLabels: Record<CommitteeStatus, string> = {
  NONE: "Sin comité",
  PENDING: "Pendiente",
  IN_COMMITTEE: "En comité",
  DONE: "Finalizado",
};

export function performanceStatusVariant(
  code: string,
): "success" | "warning" | "destructive" | "outline" | "default" {
  switch (code) {
    case "EXCELLENT":
    case "GOOD":
      return "success";
    case "ACCEPTABLE":
      return "default";
    case "NEEDS_FOLLOW_UP":
      return "warning";
    case "CRITICAL":
      return "destructive";
    default:
      return "outline";
  }
}
