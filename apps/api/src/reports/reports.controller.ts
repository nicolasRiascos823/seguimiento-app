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

  @IsOptional()
  @IsUUID()
  environmentId?: string;
}

const XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function excelFile(buffer: Buffer, filename: string) {
  return new StreamableFile(buffer, {
    type: XLSX,
    disposition: `attachment; filename="${filename}"`,
  });
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

  @Get('schedules/group/excel')
  async schedulesByGroupExcel(@Query() query: ReportQueryDto) {
    if (!query.groupId) {
      throw new BadRequestException('groupId es requerido');
    }
    const xlsx = await this.reportsService.schedulesByGroupExcel(
      query.trimesterId,
      query.groupId,
    );
    return excelFile(xlsx, 'horario-ficha.xlsx');
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

  @Get('schedules/groups/excel')
  async schedulesByAllGroupsExcel(@Query() query: ReportQueryDto) {
    const xlsx = await this.reportsService.schedulesByAllGroupsExcel(
      query.trimesterId,
    );
    return excelFile(xlsx, 'horarios-fichas.xlsx');
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

  @Get('schedules/instructor/excel')
  async schedulesByInstructorExcel(@Query() query: ReportQueryDto) {
    if (!query.instructorId) {
      throw new BadRequestException('instructorId es requerido');
    }
    const xlsx = await this.reportsService.schedulesByInstructorExcel(
      query.trimesterId,
      query.instructorId,
    );
    return excelFile(xlsx, 'horario-instructor.xlsx');
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

  @Get('schedules/instructors/excel')
  async schedulesByAllInstructorsExcel(@Query() query: ReportQueryDto) {
    const xlsx = await this.reportsService.schedulesByAllInstructorsExcel(
      query.trimesterId,
    );
    return excelFile(xlsx, 'horarios-instructores.xlsx');
  }

  @Get('schedules/environment')
  async schedulesByEnvironment(@Query() query: ReportQueryDto) {
    if (!query.environmentId) {
      throw new BadRequestException('environmentId es requerido');
    }
    const pdf = await this.reportsService.schedulesByEnvironment(
      query.trimesterId,
      query.environmentId,
    );
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: 'inline; filename="horario-ambiente.pdf"',
    });
  }

  @Get('schedules/environment/excel')
  async schedulesByEnvironmentExcel(@Query() query: ReportQueryDto) {
    if (!query.environmentId) {
      throw new BadRequestException('environmentId es requerido');
    }
    const xlsx = await this.reportsService.schedulesByEnvironmentExcel(
      query.trimesterId,
      query.environmentId,
    );
    return excelFile(xlsx, 'horario-ambiente.xlsx');
  }

  @Get('schedules/environments')
  async schedulesByAllEnvironments(@Query() query: ReportQueryDto) {
    const pdf = await this.reportsService.schedulesByAllEnvironments(
      query.trimesterId,
    );
    return new StreamableFile(pdf, {
      type: 'application/pdf',
      disposition: 'inline; filename="horarios-ambientes.pdf"',
    });
  }

  @Get('schedules/environments/excel')
  async schedulesByAllEnvironmentsExcel(@Query() query: ReportQueryDto) {
    const xlsx = await this.reportsService.schedulesByAllEnvironmentsExcel(
      query.trimesterId,
    );
    return excelFile(xlsx, 'horarios-ambientes.xlsx');
  }
}
