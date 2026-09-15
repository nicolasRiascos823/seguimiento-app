import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import readXlsxFile from 'read-excel-file/node';
import {
  Apprentice,
  Group,
  ImportBatch,
  ImportRowError,
} from '../database/entities';
import { DocumentType, ImportBatchStatus } from '../database/enums';
import { AuditService } from '../audit/audit.service';
import { AuthUser } from '../common/decorators/current-user.decorator';

const MAX_ROWS = 2000;

const DOC_MAP: Record<string, DocumentType> = {
  CC: DocumentType.CC,
  TI: DocumentType.TI,
  CE: DocumentType.CE,
  PASAPORTE: DocumentType.PASSPORT,
  PASSPORT: DocumentType.PASSPORT,
  OTRO: DocumentType.OTHER,
  OTHER: DocumentType.OTHER,
};

type Row = {
  tipoDocumento?: string;
  documento?: string;
  nombres?: string;
  apellidos?: string;
  correo?: string;
  telefono?: string;
  ficha?: string;
};

@Injectable()
export class ImportsService {
  constructor(
    @InjectRepository(ImportBatch)
    private readonly importBatchesRepo: Repository<ImportBatch>,
    @InjectRepository(ImportRowError)
    private readonly importRowErrorsRepo: Repository<ImportRowError>,
    @InjectRepository(Group) private readonly groupsRepo: Repository<Group>,
    @InjectRepository(Apprentice)
    private readonly apprenticesRepo: Repository<Apprentice>,
    private readonly audit: AuditService,
  ) {}

  async importApprentices(file: Express.Multer.File, actor: AuthUser) {
    if (!file) throw new BadRequestException('Archivo requerido');

    const rows = await this.readSpreadsheetRows(file);

    if (rows.length === 0) {
      throw new BadRequestException('El archivo no contiene filas');
    }
    if (rows.length > MAX_ROWS) {
      throw new BadRequestException(
        `El archivo supera el límite de ${MAX_ROWS} filas`,
      );
    }

    const batchEntry = this.importBatchesRepo.create({
      fileName: file.originalname,
      status: ImportBatchStatus.PENDING,
      totalRows: rows.length,
      importedById: actor.id,
    });
    const batch = await this.importBatchesRepo.save(batchEntry);

    let createdCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;
      try {
        const mapped = this.mapRow(rows[i]);
        const result = await this.upsertRow(mapped);
        if (result === 'created') createdCount += 1;
        else updatedCount += 1;
      } catch (error) {
        errorCount += 1;
        const rowError = this.importRowErrorsRepo.create({
          batchId: batch.id,
          rowNumber,
          message: error instanceof Error ? error.message : 'Error desconocido',
          rawData: rows[i] as Record<string, unknown>,
        });
        await this.importRowErrorsRepo.save(rowError);
      }
    }

    const summary = { createdCount, updatedCount, errorCount };
    await this.importBatchesRepo.update(batch.id, {
      status: ImportBatchStatus.COMPLETED,
      createdCount,
      updatedCount,
      errorCount,
      summary,
    });

    const updated = await this.getBatchWithRelations(batch.id, 100);

    await this.audit.log({
      actorId: actor.id,
      action: 'IMPORT',
      entity: 'Apprentice',
      entityId: batch.id,
      payload: summary,
    });

    return updated;
  }

  async listBatches(limit = 20) {
    const batches = await this.importBatchesRepo.find({
      take: limit,
      order: { createdAt: 'DESC' },
      relations: { importedBy: true },
    });

    return Promise.all(
      batches.map(async (batch) => ({
        ...batch,
        _count: {
          errors: await this.importRowErrorsRepo.count({
            where: { batchId: batch.id },
          }),
        },
      })),
    );
  }

  async getBatch(id: string) {
    return this.getBatchWithRelations(id);
  }

  private async getBatchWithRelations(id: string, errorLimit?: number) {
    const qb = this.importBatchesRepo
      .createQueryBuilder('batch')
      .leftJoinAndSelect('batch.importedBy', 'importedBy')
      .leftJoinAndSelect('batch.errors', 'errors')
      .where('batch.id = :id', { id })
      .orderBy('errors.rowNumber', 'ASC');

    if (errorLimit) {
      qb.take(errorLimit);
    }

    return qb.getOne();
  }

  private async readSpreadsheetRows(
    file: Express.Multer.File,
  ): Promise<Record<string, unknown>[]> {
    let matrix: unknown[][];
    try {
      const parsed = await readXlsxFile(file.buffer);
      matrix = parsed as unknown as unknown[][];
    } catch {
      throw new BadRequestException(
        'No se pudo leer el archivo. Use un Excel .xlsx válido',
      );
    }

    if (!matrix.length) {
      throw new BadRequestException('El archivo no contiene hojas');
    }

    const [headerCells, ...dataRows] = matrix;
    const headers = (headerCells ?? []).map((cell) =>
      this.cellToString(cell),
    );

    if (!headers.some((h) => h.trim())) {
      throw new BadRequestException('La primera fila debe contener encabezados');
    }

    const rows: Record<string, unknown>[] = [];
    for (const dataRow of dataRows) {
      const raw: Record<string, unknown> = {};
      let hasValue = false;
      headers.forEach((header, index) => {
        if (!header) return;
        const value = this.cellToString(dataRow?.[index]);
        raw[header] = value;
        if (value) hasValue = true;
      });
      if (hasValue) rows.push(raw);
    }

    return rows;
  }

  private cellToString(value: unknown): string {
    if (value == null) return '';
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).trim();
  }

  private mapRow(raw: Record<string, unknown>): Row {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      const k = key
        .toString()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '');
      normalized[k] = String(value ?? '').trim();
    }

    return {
      tipoDocumento:
        normalized.tipodocumento ||
        normalized.tipodedocumento ||
        normalized.tipo_doc ||
        normalized.td,
      documento: normalized.documento || normalized.doc || normalized.cedula,
      nombres: normalized.nombres || normalized.nombre,
      apellidos: normalized.apellidos || normalized.apellido,
      correo: normalized.correo || normalized.email || normalized.mail,
      telefono: normalized.telefono || normalized.celular || normalized.tel,
      ficha: normalized.ficha || normalized.grupoficha || normalized.numeroficha,
    };
  }

  private async upsertRow(row: Row) {
    if (!row.tipoDocumento || !row.documento || !row.nombres || !row.apellidos || !row.ficha) {
      throw new Error(
        'Faltan campos obligatorios (Tipo documento, Documento, Nombres, Apellidos, Ficha)',
      );
    }

    const documentType =
      DOC_MAP[row.tipoDocumento.toUpperCase().replace(/\s+/g, '')];
    if (!documentType) {
      throw new Error(`Tipo documento inválido: ${row.tipoDocumento}`);
    }

    const group = await this.groupsRepo.findOne({
      where: { number: row.ficha },
    });
    if (!group) throw new Error(`Ficha no encontrada: ${row.ficha}`);

    const existing = await this.apprenticesRepo.findOne({
      where: { documentType, document: row.documento },
    });

    if (existing) {
      await this.apprenticesRepo.update(existing.id, {
        firstName: row.nombres,
        lastName: row.apellidos,
        email: row.correo?.toLowerCase() || null,
        phone: row.telefono || null,
        groupId: group.id,
      });
      return 'updated' as const;
    }

    const entry = this.apprenticesRepo.create({
      documentType,
      document: row.documento,
      firstName: row.nombres,
      lastName: row.apellidos,
      email: row.correo?.toLowerCase() || null,
      phone: row.telefono || null,
      groupId: group.id,
    });
    await this.apprenticesRepo.save(entry);
    return 'created' as const;
  }
}
