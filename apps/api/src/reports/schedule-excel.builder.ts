import ExcelJS from 'exceljs';
import { Schedule } from '../database/entities';
import { TIME_BLOCKS, WeekDay } from '../database/enums';

/** Paleta institucional SENA (alineada al PDF) */
const COLORS = {
  brand: 'FF39A900',
  primary: 'FF007832',
  navy: 'FF00304D',
  softGray: 'FFF4F7F5',
  border: 'FFD0DAD5',
  muted: 'FF5A6B62',
  ink: 'FF101A16',
  white: 'FFFFFFFF',
} as const;

/** Colores pastel suaves para diferenciar instructores / fichas */
const SOFT_ENTITY_COLORS = [
  'FFE2F3E6', // verde SENA suave
  'FFE1EAF0', // azul navy suave
  'FFFFF3D6', // amarillo suave
  'FFF3E8F7', // lila suave
  'FFFFE8DC', // melocotón suave
  'FFE5F6F4', // menta suave
  'FFFCE4EC', // rosa suave
  'FFE8EEF9', // índigo suave
  'FFF5F0E6', // arena suave
  'FFE6F4EA', // verde hoja suave
  'FFFFF0E8', // coral suave
  'FFEDE7F6', // violeta suave
] as const;

const WEEK_DAYS: WeekDay[] = [
  WeekDay.MONDAY,
  WeekDay.TUESDAY,
  WeekDay.WEDNESDAY,
  WeekDay.THURSDAY,
  WeekDay.FRIDAY,
  WeekDay.SATURDAY,
];

const DAY_SHORT: Record<WeekDay, string> = {
  [WeekDay.MONDAY]: 'Lun',
  [WeekDay.TUESDAY]: 'Mar',
  [WeekDay.WEDNESDAY]: 'Mié',
  [WeekDay.THURSDAY]: 'Jue',
  [WeekDay.FRIDAY]: 'Vie',
  [WeekDay.SATURDAY]: 'Sáb',
};

export type ScheduleExcelMode = 'group' | 'instructor' | 'environment';

export interface ScheduleExcelSheet {
  /** Nombre de hoja (ficha / instructor / ambiente) */
  sheetName: string;
  title: string;
  trimesterName: string;
  meta: Array<{ label: string; value: string }>;
  schedules: Schedule[];
  mode: ScheduleExcelMode;
}

function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 2) return fullName;
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

/** Excel sheet names: max 31 chars, no \ / ? * [ ] */
export function sanitizeSheetName(raw: string, used: Set<string>): string {
  let base = raw
    .replace(/[\\/?*[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 31);
  if (!base) base = 'Hoja';

  let name = base;
  let n = 2;
  while (used.has(name.toLowerCase())) {
    const suffix = ` (${n})`;
    name = `${base.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`;
    n += 1;
  }
  used.add(name.toLowerCase());
  return name;
}

function cellLines(schedule: Schedule, mode: ScheduleExcelMode): string {
  const line1 =
    mode === 'group'
      ? shortName(schedule.instructor?.fullName ?? '—')
      : `F. ${schedule.group?.number ?? '—'}`;
  const line2 =
    mode === 'environment'
      ? shortName(schedule.instructor?.fullName ?? '—')
      : (schedule.environment?.name ?? '');
  return line2 ? `${line1}\n${line2}` : line1;
}

/** Clave de color: instructor en vista ficha; ficha en vista instructor/ambiente */
function colorKey(schedule: Schedule, mode: ScheduleExcelMode): string {
  if (mode === 'group') {
    return schedule.instructorId || schedule.instructor?.id || 'unknown';
  }
  return schedule.groupId || schedule.group?.id || 'unknown';
}

function buildColorMap(
  schedules: Schedule[],
  mode: ScheduleExcelMode,
): Map<string, string> {
  const keys = [
    ...new Set(schedules.map((s) => colorKey(s, mode))),
  ].sort((a, b) => a.localeCompare(b));

  const map = new Map<string, string>();
  keys.forEach((key, index) => {
    map.set(key, SOFT_ENTITY_COLORS[index % SOFT_ENTITY_COLORS.length]!);
  });
  return map;
}

function fillSolid(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function thinBorder(): Partial<ExcelJS.Borders> {
  return {
    top: { style: 'thin', color: { argb: COLORS.border } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    bottom: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  };
}

function writeSheet(workbook: ExcelJS.Workbook, sheet: ScheduleExcelSheet) {
  const ws = workbook.addWorksheet(sheet.sheetName, {
    views: [{ showGridLines: false }],
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
    },
  });

  const blocks = TIME_BLOCKS.filter((b) => b >= '06:00' && b <= '21:00');
  const colCount = 1 + WEEK_DAYS.length;
  const entityColors = buildColorMap(sheet.schedules, sheet.mode);

  ws.getColumn(1).width = 12;
  for (let i = 2; i <= colCount; i += 1) {
    ws.getColumn(i).width = 26;
  }

  // Brand bar
  ws.mergeCells(1, 1, 1, colCount);
  const brandRow = ws.getRow(1);
  brandRow.height = 10;
  for (let c = 1; c <= colCount; c += 1) {
    ws.getCell(1, c).fill = fillSolid(COLORS.brand);
  }

  // Title band
  ws.mergeCells(2, 1, 2, colCount);
  const titleCell = ws.getCell(2, 1);
  titleCell.value = sheet.title;
  titleCell.font = {
    bold: true,
    size: 15,
    color: { argb: COLORS.white },
    name: 'Calibri',
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  titleCell.fill = fillSolid(COLORS.navy);
  ws.getRow(2).height = 30;

  ws.mergeCells(3, 1, 3, colCount);
  const subCell = ws.getCell(3, 1);
  subCell.value = `Trimestre: ${sheet.trimesterName}`;
  subCell.font = {
    size: 11,
    color: { argb: COLORS.white },
    name: 'Calibri',
  };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  subCell.fill = fillSolid(COLORS.navy);
  ws.getRow(3).height = 20;

  // Meta
  let row = 5;
  for (const m of sheet.meta) {
    ws.getCell(row, 1).value = m.label;
    ws.getCell(row, 1).font = {
      bold: true,
      size: 10,
      color: { argb: COLORS.muted },
      name: 'Calibri',
    };
    ws.mergeCells(row, 2, row, colCount);
    ws.getCell(row, 2).value = m.value;
    ws.getCell(row, 2).font = {
      size: 11,
      color: { argb: COLORS.ink },
      name: 'Calibri',
    };
    row += 1;
  }

  row += 1;
  const headerRow = row;

  // Table header
  const header = ws.getRow(headerRow);
  header.height = 26;
  const hourHeader = ws.getCell(headerRow, 1);
  hourHeader.value = 'Hora';
  hourHeader.font = {
    bold: true,
    size: 11,
    color: { argb: COLORS.white },
    name: 'Calibri',
  };
  hourHeader.alignment = { vertical: 'middle', horizontal: 'center' };
  hourHeader.fill = fillSolid(COLORS.navy);
  hourHeader.border = thinBorder();

  WEEK_DAYS.forEach((day, i) => {
    const cell = ws.getCell(headerRow, i + 2);
    cell.value = DAY_SHORT[day];
    cell.font = {
      bold: true,
      size: 11,
      color: { argb: COLORS.white },
      name: 'Calibri',
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = fillSolid(COLORS.navy);
    cell.border = thinBorder();
  });

  const map = new Map<string, Schedule[]>();
  for (const s of sheet.schedules) {
    const key = `${s.weekDay}|${s.blockStart}`;
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }

  blocks.forEach((blockStart, rowIndex) => {
    const r = headerRow + 1 + rowIndex;
    const alt = rowIndex % 2 === 0;
    const emptyFill = fillSolid(alt ? COLORS.softGray : COLORS.white);
    const dataRow = ws.getRow(r);
    dataRow.height = 44;

    const timeCell = ws.getCell(r, 1);
    timeCell.value = blockStart;
    timeCell.font = {
      size: 10,
      color: { argb: COLORS.muted },
      name: 'Calibri',
    };
    timeCell.alignment = { vertical: 'middle', horizontal: 'center' };
    timeCell.fill = emptyFill;
    timeCell.border = thinBorder();

    WEEK_DAYS.forEach((day, i) => {
      const cell = ws.getCell(r, i + 2);
      const items = map.get(`${day}|${blockStart}`) ?? [];
      cell.border = thinBorder();
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true,
        indent: 1,
      };

      if (items.length === 0) {
        cell.fill = emptyFill;
        return;
      }

      const primary = items[0]!;
      const fillColor =
        entityColors.get(colorKey(primary, sheet.mode)) ?? SOFT_ENTITY_COLORS[0]!;

      cell.value = items.map((s) => cellLines(s, sheet.mode)).join('\n---\n');
      cell.font = {
        bold: true,
        size: 10,
        color: { argb: COLORS.ink },
        name: 'Calibri',
      };
      cell.fill = fillSolid(fillColor);
    });
  });
}

export async function buildScheduleExcel(
  sheets: ScheduleExcelSheet[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Seguimiento SENA';
  workbook.created = new Date();

  const usedNames = new Set<string>();

  if (sheets.length === 0) {
    const ws = workbook.addWorksheet('Sin datos');
    ws.getCell(1, 1).value = 'No hay horarios activos para este reporte.';
    ws.getColumn(1).width = 50;
  } else {
    for (const sheet of sheets) {
      writeSheet(workbook, {
        ...sheet,
        sheetName: sanitizeSheetName(sheet.sheetName, usedNames),
      });
    }
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
