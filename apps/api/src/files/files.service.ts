import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createReadStream, existsSync, mkdirSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { FileObject } from '../database/entities';
import { AuthUser } from '../common/decorators/current-user.decorator';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const MAX_SIZE = 5 * 1024 * 1024;

@Injectable()
export class FilesService {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(FileObject)
    private readonly filesRepo: Repository<FileObject>,
    private readonly config: ConfigService,
  ) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR', './uploads');
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(file: Express.Multer.File, user: AuthUser) {
    if (!file) throw new BadRequestException('Archivo requerido');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }
    if (file.size > MAX_SIZE) {
      throw new BadRequestException('El archivo supera 5MB');
    }

    const filename = `${randomUUID()}${extname(file.originalname)}`;
    const storagePath = join(this.uploadDir, filename);
    const { writeFileSync } = await import('fs');
    writeFileSync(storagePath, file.buffer);

    const entry = this.filesRepo.create({
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      storagePath,
      uploadedById: user.id,
    });
    return this.filesRepo.save(entry);
  }

  async getFile(id: string) {
    const file = await this.filesRepo.findOne({ where: { id } });
    if (!file || !existsSync(file.storagePath)) {
      throw new NotFoundException('Archivo no encontrado');
    }
    return {
      file,
      stream: createReadStream(file.storagePath),
    };
  }
}
