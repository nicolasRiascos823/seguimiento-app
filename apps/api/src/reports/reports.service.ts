import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import PDFDocument from 'pdfkit';
import {
  Evaluation,
  Group,
  Schedule,
  Trimester,
  User,
  Warning,
} from '../database/entities';
import {
  ScheduleStatus,
  TIME_BLOCKS,
  WeekDay,
} from '../database/enums';

/** Paleta institucional SENA (Manual de Identidad Visual 2024) */
const COLORS = {
  brand: '#39A900',
  primary: '#007832',
  navy: '#00304D',
  softGreen: '#E2F3E6',
  softNavy: '#E1EAF0',
  softGray: '#F4F7F5',
  border: '#D0DAD5',
  muted: '#5A6B62',
  ink: '#101A16',
  white: '#FFFFFF',
} as const;

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

@Injectable()
export class ReportsService {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(Trimester)
    private readonly trimestersRepo: Repository<Trimester>,
    @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Evaluation)
    private readonly evaluationsRepo: Repository<Evaluation>,
    @InjectRepository(Schedule)
    private readonly schedulesRepo: Repository<Schedule>,
    @InjectRepository(Warning)
    private readonly warningsRepo: Repository<Warning>,
  ) {}

  async evaluationsByGroup(trimesterId: string, groupId: string) {
    const { trimester, group } = await this.loadTrimesterGroup(
      trimesterId,
      groupId,
    );
    const evaluations = await this.evaluationsRepo.find({
      where: { trimesterId, groupId },
      relations: {
        apprentice: true,
        instructor: true,
        performanceStatus: true,
      },
      order: { apprentice: { lastName: 'ASC' } },
    });
    const warnings = await this.warningsRepo.find({
      where: { apprentice: { groupId } },
      relations: { apprentice: true, instructor: true },
      order: { date: 'DESC' },
    });

    return this.buildPdf({
      title: 'Seguimiento por ficha',
      subtitle: `Ficha ${group.number}`,
      trimester,
      meta: [
        { label: 'Ficha', value: group.number },
        {
          label: 'Instructor líder',
          value: group.leader?.fullName ?? '—',
        },
        { label: 'Evaluaciones', value: String(evaluations.length) },
        { label: 'Llamados', value: String(warnings.length) },
      ],
      landscape: false,
      body: (doc, page) => {
        this.drawSectionTitle(doc, page, 'Evaluaciones');

        if (evaluations.length === 0) {
          this.drawEmpty(doc, 'No hay evaluaciones registradas en este trimestre.');
        } else {
          const colWidths = [130, 120, 80, page.contentWidth - 330];
          const headers = ['Aprendiz', 'Instructor', 'Estado', 'Observaciones'];
          this.drawDataTable(doc, page, headers, colWidths, evaluations.map((ev) => [
            `${ev.apprentice.lastName} ${ev.apprentice.firstName}`,
            ev.instructor.fullName,
            ev.performanceStatus?.name ?? '—',
            ev.commitments
              ? `${ev.observations}\nCompromisos: ${ev.commitments}`
              : ev.observations || '—',
          ]));
        }

        doc.moveDown(1.2);
        this.ensureSpace(doc, page, 80);
        this.drawSectionTitle(doc, page, 'Llamados de atención');

        if (warnings.length === 0) {
          this.drawEmpty(doc, 'No hay llamados de atención registrados.');
        } else {
          const colWidths = [70, 130, 90, page.contentWidth - 290];
          const headers = ['Fecha', 'Aprendiz', 'Llamado', 'Motivo'];
          this.drawDataTable(
            doc,
            page,
            headers,
            colWidths,
            warnings.map((w) => [
              w.date.toISOString().slice(0, 10),
              `${w.apprentice.firstName} ${w.apprentice.lastName}`,
              w.callNumber === 'SECOND' ? '2.º llamado' : '1.er llamado',
              w.reason,
            ]),
          );
        }
      },
    });
  }

  async schedulesByGroup(trimesterId: string, groupId: string) {
    const { trimester, group } = await this.loadTrimesterGroup(
      trimesterId,
      groupId,
    );
    const schedules = await this.schedulesRepo.find({
      where: { trimesterId, groupId, status: ScheduleStatus.ACTIVE },
      relations: { instructor: true, environment: true },
      order: { weekDay: 'ASC', blockStart: 'ASC' },
    });

    return this.buildPdf({
      title: 'Horario por ficha',
      subtitle: `Ficha ${group.number}`,
      trimester,
      meta: [
        { label: 'Ficha', value: group.number },
        {
          label: 'Instructor líder',
          value: group.leader?.fullName ?? '—',
        },
        { label: 'Horas / semana', value: String(schedules.length) },
      ],
      landscape: true,
      compact: true,
      body: (doc, page) => {
        this.drawScheduleTable(doc, page, schedules, 'group');
      },
    });
  }

  async schedulesByInstructor(trimesterId: string, instructorId: string) {
    const trimester = await this.trimestersRepo.findOne({
      where: { id: trimesterId },
    });
    if (!trimester) throw new NotFoundException('Trimestre no encontrado');
    const instructor = await this.usersRepo.findOne({
      where: { id: instructorId },
    });
    if (!instructor) throw new NotFoundException('Instructor no encontrado');

    const schedules = await this.schedulesRepo.find({
      where: { trimesterId, instructorId, status: ScheduleStatus.ACTIVE },
      relations: { group: true, environment: true },
      order: { weekDay: 'ASC', blockStart: 'ASC' },
    });

    return this.buildPdf({
      title: 'Horario por instructor',
      subtitle: instructor.fullName,
      trimester,
      meta: [
        { label: 'Instructor', value: instructor.fullName },
        { label: 'Horas / semana', value: String(schedules.length) },
        {
          label: 'Fichas',
          value: String(new Set(schedules.map((s) => s.groupId)).size),
        },
      ],
      landscape: true,
      compact: true,
      body: (doc, page) => {
        this.drawScheduleTable(doc, page, schedules, 'instructor');
      },
    });
  }

  private async loadTrimesterGroup(trimesterId: string, groupId: string) {
    const trimester = await this.trimestersRepo.findOne({
      where: { id: trimesterId },
    });
    if (!trimester) throw new NotFoundException('Trimestre no encontrado');
    const group = await this.groupsRepo.findOne({
      where: { id: groupId },
      relations: { leader: true },
    });
    if (!group) throw new NotFoundException('Ficha no encontrada');
    return { trimester, group };
  }

  // ─── PDF shell ────────────────────────────────────────────────────────────

  private buildPdf(opts: {
    title: string;
    subtitle: string;
    trimester: Trimester;
    meta: Array<{ label: string; value: string }>;
    landscape: boolean;
    compact?: boolean;
    body: (doc: PDFKit.PDFDocument, page: PageMetrics) => void;
  }): Promise<Buffer> {
    const logoPath = this.config.get<string>('REPORT_LOGO_PATH');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        layout: opts.landscape ? 'landscape' : 'portrait',
        margins: { top: 28, bottom: 36, left: 28, right: 28 },
        bufferPages: true,
        autoFirstPage: true,
        info: {
          Title: opts.title,
          Author: 'Seguimiento SENA',
          Subject: opts.subtitle,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const page = this.pageMetrics(doc);

      this.drawHeader(
        doc,
        page,
        opts.title,
        opts.subtitle,
        opts.trimester,
        logoPath,
        opts.compact,
      );
      if (opts.meta.length > 0) {
        this.drawMetaBar(doc, page, opts.meta, opts.compact);
      }
      opts.body(doc, page);
      this.drawFooter(doc, page);

      doc.end();
    });
  }

  private pageMetrics(doc: PDFKit.PDFDocument): PageMetrics {
    const left = doc.page.margins.left;
    const right = doc.page.margins.right;
    const top = doc.page.margins.top;
    const bottom = doc.page.margins.bottom;
    const width = doc.page.width;
    const height = doc.page.height;
    return {
      left,
      right,
      top,
      bottom,
      width,
      height,
      contentWidth: width - left - right,
      contentBottom: height - bottom,
    };
  }

  private drawHeader(
    doc: PDFKit.PDFDocument,
    page: PageMetrics,
    title: string,
    subtitle: string,
    trimester: Trimester,
    logoPath?: string,
    compact = false,
  ) {
    const bandH = compact ? 44 : 58;
    const brandBar = 4;

    doc.save();
    doc.rect(0, 0, page.width, brandBar).fill(COLORS.brand);
    doc.restore();

    doc.save();
    doc.rect(0, brandBar, page.width, bandH).fill(COLORS.navy);
    doc.restore();

    let textX = page.left;
    const markSize = compact ? 22 : 28;
    const markY = brandBar + (bandH - markSize) / 2;

    if (logoPath) {
      try {
        doc.image(logoPath, page.left, markY, { height: markSize });
        textX = page.left + markSize + 10;
      } catch {
        /* logo opcional */
      }
    }

    if (textX === page.left) {
      doc.save();
      doc.roundedRect(page.left, markY, markSize, markSize, 3).fill(COLORS.brand);
      doc
        .fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .fontSize(compact ? 11 : 14)
        .text('S', page.left, markY + (compact ? 5 : 6), {
          width: markSize,
          align: 'center',
          lineBreak: false,
        });
      doc.restore();
      textX = page.left + markSize + 10;
    }

    const titleY = brandBar + (compact ? 10 : 14);
    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(compact ? 12 : 14)
      .text(title, textX, titleY, {
        width: page.width - textX - page.right - 150,
        lineBreak: false,
      });

    doc
      .fillColor('#B8D0DC')
      .font('Helvetica')
      .fontSize(compact ? 8 : 9)
      .text(subtitle, textX, titleY + (compact ? 14 : 18), {
        width: page.width - textX - page.right - 150,
        lineBreak: false,
      });

    const generated = new Date().toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    doc.fillColor('#B8D0DC').font('Helvetica').fontSize(7);
    doc.text('SENA', page.width - page.right - 150, titleY, {
      width: 150,
      align: 'right',
      lineBreak: false,
    });
    doc.text(`Trimestre: ${trimester.name}`, page.width - page.right - 150, titleY + 11, {
      width: 150,
      align: 'right',
      lineBreak: false,
    });
    doc.text(`Generado: ${generated}`, page.width - page.right - 150, titleY + 22, {
      width: 150,
      align: 'right',
      lineBreak: false,
    });

    doc.y = brandBar + bandH + (compact ? 6 : 10);
    doc.x = page.left;
    doc.fillColor(COLORS.ink);
  }

  private drawMetaBar(
    doc: PDFKit.PDFDocument,
    page: PageMetrics,
    meta: Array<{ label: string; value: string }>,
    compact = false,
  ) {
    if (!meta.length) return;

    const y = doc.y;
    const gap = 6;
    const cellW =
      (page.contentWidth - gap * (meta.length - 1)) / Math.max(meta.length, 1);
    const cellH = compact ? 28 : 36;

    meta.forEach((item, i) => {
      const x = page.left + i * (cellW + gap);
      doc.save();
      doc.roundedRect(x, y, cellW, cellH, 3).fill(COLORS.softGray);
      doc
        .fillColor(COLORS.muted)
        .font('Helvetica')
        .fontSize(6.5)
        .text(item.label.toUpperCase(), x + 6, y + 5, {
          width: cellW - 12,
          lineBreak: false,
        });
      doc
        .fillColor(COLORS.ink)
        .font('Helvetica-Bold')
        .fontSize(compact ? 9 : 10)
        .text(item.value, x + 6, y + (compact ? 14 : 17), {
          width: cellW - 12,
          ellipsis: true,
          lineBreak: false,
        });
      doc.restore();
      doc.x = page.left;
      doc.y = y;
    });

    doc.y = y + cellH + (compact ? 8 : 12);
    doc.x = page.left;
  }

  private drawFooter(doc: PDFKit.PDFDocument, page: PageMetrics) {
    // Capture count BEFORE drawing — footer text must not create new pages
    const range = doc.bufferedPageRange();
    const pageCount = range.count;
    const prevBottom = doc.page.margins.bottom;

    for (let i = 0; i < pageCount; i += 1) {
      doc.switchToPage(range.start + i);
      doc.page.margins.bottom = 0;
      const y = page.height - 28;

      doc.save();
      doc.rect(0, y - 4, page.width, 0.6).fill(COLORS.border);
      doc
        .fillColor(COLORS.muted)
        .font('Helvetica')
        .fontSize(7)
        .text('Seguimiento SENA · Documento institucional', page.left, y, {
          width: page.contentWidth / 2,
          align: 'left',
          lineBreak: false,
        });
      doc.text(`Página ${i + 1} de ${pageCount}`, page.left + page.contentWidth / 2, y, {
        width: page.contentWidth / 2,
        align: 'right',
        lineBreak: false,
      });
      doc.restore();
      doc.x = page.left;
      doc.y = Math.min(doc.y, y);
    }

    doc.page.margins.bottom = prevBottom;
  }

  private drawSectionTitle(
    doc: PDFKit.PDFDocument,
    page: PageMetrics,
    title: string,
  ) {
    this.ensureSpace(doc, page, 40);
    const y = doc.y;
    doc.save();
    doc.rect(page.left, y, 3, 14).fill(COLORS.brand);
    doc
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(title, page.left + 10, y);
    doc.restore();
    doc.y = y + 20;
    doc.x = page.left;
  }

  private drawEmpty(doc: PDFKit.PDFDocument, message: string) {
    doc
      .fillColor(COLORS.muted)
      .font('Helvetica-Oblique')
      .fontSize(9)
      .text(message);
    doc.moveDown(0.5);
    doc.fillColor(COLORS.ink);
  }

  // ─── Data table (seguimiento) ─────────────────────────────────────────────

  private drawDataTable(
    doc: PDFKit.PDFDocument,
    page: PageMetrics,
    headers: string[],
    colWidths: number[],
    rows: string[][],
  ) {
    const rowMinH = 22;
    const pad = 4;

    const drawHeader = () => {
      const y = doc.y;
      doc.save();
      doc.rect(page.left, y, page.contentWidth, 20).fill(COLORS.navy);
      let x = page.left;
      headers.forEach((h, i) => {
        doc
          .fillColor(COLORS.white)
          .font('Helvetica-Bold')
          .fontSize(8)
          .text(h, x + pad, y + 6, {
            width: colWidths[i]! - pad * 2,
            ellipsis: true,
          });
        x += colWidths[i]!;
      });
      doc.restore();
      doc.y = y + 20;
    };

    drawHeader();

    rows.forEach((row, rowIndex) => {
      // Measure row height
      let maxH = rowMinH;
      doc.font('Helvetica').fontSize(8);
      row.forEach((cell, i) => {
        const h = doc.heightOfString(String(cell), {
          width: colWidths[i]! - pad * 2,
        });
        maxH = Math.max(maxH, h + pad * 2);
      });

      if (doc.y + maxH > page.contentBottom - 20) {
        doc.addPage();
        doc.y = page.top + 10;
        drawHeader();
      }

      const y = doc.y;
      if (rowIndex % 2 === 0) {
        doc.save();
        doc.rect(page.left, y, page.contentWidth, maxH).fill(COLORS.softGray);
        doc.restore();
      }

      // Bottom border
      doc.save();
      doc
        .moveTo(page.left, y + maxH)
        .lineTo(page.left + page.contentWidth, y + maxH)
        .strokeColor(COLORS.border)
        .lineWidth(0.5)
        .stroke();
      doc.restore();

      let x = page.left;
      row.forEach((cell, i) => {
        doc
          .fillColor(COLORS.ink)
          .font('Helvetica')
          .fontSize(8)
          .text(String(cell), x + pad, y + pad, {
            width: colWidths[i]! - pad * 2,
            height: maxH - pad,
            ellipsis: true,
          });
        x += colWidths[i]!;
      });

      doc.y = y + maxH;
      doc.x = page.left;
    });
  }

  // ─── Schedule weekly table (always fits on one landscape page) ────────────

  private drawScheduleTable(
    doc: PDFKit.PDFDocument,
    page: PageMetrics,
    schedules: Schedule[],
    mode: 'group' | 'instructor',
  ) {
    const usedStarts = [
      ...new Set(schedules.map((s) => s.blockStart)),
    ].sort();
    let blocks: string[];
    if (usedStarts.length === 0) {
      blocks = TIME_BLOCKS.filter((b) => b >= '07:00' && b <= '18:00');
    } else {
      const firstIdx = TIME_BLOCKS.findIndex((b) => b === usedStarts[0]);
      const lastIdx = TIME_BLOCKS.findIndex(
        (b) => b === usedStarts[usedStarts.length - 1],
      );
      blocks = [...TIME_BLOCKS.slice(Math.max(0, firstIdx), lastIdx + 1)];
    }

    const map = new Map<string, Schedule>();
    for (const s of schedules) {
      map.set(`${s.weekDay}|${s.blockStart}`, s);
    }

    const timeColW = 42;
    const dayColW = (page.contentWidth - timeColW) / WEEK_DAYS.length;
    const headerH = 16;
    const startY = doc.y;
    const available = page.contentBottom - startY - 4;
    const rowH = Math.max(
      11,
      Math.min(22, (available - headerH) / Math.max(blocks.length, 1)),
    );
    const tableH = headerH + blocks.length * rowH;
    const twoLines = rowH >= 17;

    // Disable auto page-break for the whole table draw
    const prevBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    const write = (
      text: string,
      x: number,
      y: number,
      opts: PDFKit.Mixins.TextOptions,
    ) => {
      doc.text(text, x, y, { ...opts, lineBreak: false });
      // PDFKit advances cursor after text(); pin it so it never trips a new page
      doc.x = page.left;
      doc.y = startY;
    };

    // Header
    doc.save();
    doc.rect(page.left, startY, page.contentWidth, headerH).fill(COLORS.navy);
    doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(7);
    write('Hora', page.left + 2, startY + 4.5, {
      width: timeColW - 4,
      align: 'center',
    });
    WEEK_DAYS.forEach((day, i) => {
      const x = page.left + timeColW + i * dayColW;
      write(DAY_SHORT[day], x, startY + 4.5, {
        width: dayColW,
        align: 'center',
      });
    });
    doc.restore();

    blocks.forEach((blockStart, rowIndex) => {
      const y = startY + headerH + rowIndex * rowH;
      const alt = rowIndex % 2 === 0;

      doc.save();
      doc
        .rect(page.left, y, timeColW, rowH)
        .fill(alt ? COLORS.softGray : COLORS.white);
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(6.5);
      write(blockStart, page.left + 1, y + rowH / 2 - 3.5, {
        width: timeColW - 2,
        align: 'center',
      });
      doc.restore();

      WEEK_DAYS.forEach((day, i) => {
        const x = page.left + timeColW + i * dayColW;
        const schedule = map.get(`${day}|${blockStart}`);

        doc.save();
        if (schedule) {
          doc.rect(x, y, dayColW, rowH).fill(COLORS.softGreen);
          doc.rect(x, y, 2, rowH).fill(COLORS.primary);

          const line1 =
            mode === 'group'
              ? this.shortName(schedule.instructor?.fullName ?? '—')
              : `F. ${schedule.group?.number ?? '—'}`;
          const line2 = schedule.environment?.name ?? '';

          if (twoLines && line2) {
            doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(6);
            write(line1, x + 4, y + 2.5, {
              width: dayColW - 7,
              height: 8,
              ellipsis: true,
            });
            doc.fillColor(COLORS.muted).font('Helvetica').fontSize(5.5);
            write(line2, x + 4, y + rowH / 2 + 0.5, {
              width: dayColW - 7,
              height: 7,
              ellipsis: true,
            });
          } else {
            const label = line2 ? `${line1} · ${line2}` : line1;
            doc.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(6);
            write(label, x + 4, y + rowH / 2 - 3.5, {
              width: dayColW - 7,
              height: 8,
              ellipsis: true,
            });
          }
        } else {
          doc
            .rect(x, y, dayColW, rowH)
            .fill(alt ? COLORS.softGray : COLORS.white);
        }
        doc.restore();
      });
    });

    // Grid
    doc.save();
    doc
      .rect(page.left, startY, page.contentWidth, tableH)
      .strokeColor(COLORS.navy)
      .lineWidth(0.7)
      .stroke();

    for (let r = 1; r <= blocks.length; r += 1) {
      const y = startY + headerH + r * rowH;
      doc
        .moveTo(page.left, y)
        .lineTo(page.left + page.contentWidth, y)
        .strokeColor(COLORS.border)
        .lineWidth(0.35)
        .stroke();
    }
    for (let i = 0; i <= WEEK_DAYS.length; i += 1) {
      const x = page.left + timeColW + i * dayColW;
      doc
        .moveTo(x, startY)
        .lineTo(x, startY + tableH)
        .strokeColor(i === 0 ? COLORS.navy : COLORS.border)
        .lineWidth(i === 0 ? 0.6 : 0.35)
        .stroke();
    }
    doc.restore();

    doc.page.margins.bottom = prevBottom;
    doc.x = page.left;
    doc.y = Math.min(startY + tableH + 4, page.contentBottom - 20);
    doc.fillColor(COLORS.ink);
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private shortName(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 2) return fullName;
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }

  private ensureSpace(
    doc: PDFKit.PDFDocument,
    page: PageMetrics,
    needed: number,
  ) {
    if (doc.y + needed > page.contentBottom) {
      doc.addPage();
      doc.y = page.top + 8;
      doc.x = page.left;
    }
  }
}

interface PageMetrics {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  contentWidth: number;
  contentBottom: number;
}
