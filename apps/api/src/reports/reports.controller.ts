import {
  Controller,
  Get,
  Query,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { IsOptional, IsUUID } from 'class-validator';

class ReportQueryDto {
  @IsUUID()
  trimesterId: string;

  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsUUID()
  instructorId?: string;
}

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('evaluations/group')
  async evaluationsByGroup(@Query() query: ReportQueryDto) {
    if (!query.groupId) {
      throw new BadRequestException('groupId es requerido');
    }
    const pdf = await this.reportsService.evaluationsByGroup(
      query.trimesterId,
      query.groupId,
    );
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: 'inline; filename="seguimiento-ficha.pdf"',
    });
  }

  @Get('schedules/group')
  async schedulesByGroup(@Query() query: ReportQueryDto) {
    if (!query.groupId) {
      throw new BadRequestException('groupId es requerido');
    }
    const pdf = await this.reportsService.schedulesByGroup(
      query.trimesterId,
      query.groupId,
    );
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: 'inline; filename="horario-ficha.pdf"',
    });
  }

  @Get('schedules/groups')
  async schedulesByAllGroups(@Query() query: ReportQueryDto) {
    const pdf = await this.reportsService.schedulesByAllGroups(
      query.trimesterId,
    );
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: 'inline; filename="horarios-fichas.pdf"',
    });
  }

  @Get('schedules/instructor')
  async schedulesByInstructor(@Query() query: ReportQueryDto) {
    if (!query.instructorId) {
      throw new BadRequestException('instructorId es requerido');
    }
    const pdf = await this.reportsService.schedulesByInstructor(
      query.trimesterId,
      query.instructorId,
    );
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: 'inline; filename="horario-instructor.pdf"',
    });
  }

  @Get('schedules/instructors')
  async schedulesByAllInstructors(@Query() query: ReportQueryDto) {
    const pdf = await this.reportsService.schedulesByAllInstructors(
      query.trimesterId,
    );
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: 'inline; filename="horarios-instructores.pdf"',
    });
  }
}
