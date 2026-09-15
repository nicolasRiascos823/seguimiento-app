import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleStatus, WeekDay } from '../../database/enums';

export class CreateScheduleDto {
  @ApiProperty()
  @IsUUID()
  trimesterId: string;

  @ApiProperty()
  @IsUUID()
  groupId: string;

  @ApiProperty()
  @IsUUID()
  instructorId: string;

  @ApiProperty()
  @IsUUID()
  environmentId: string;

  @ApiProperty({ enum: WeekDay })
  @IsEnum(WeekDay)
  weekDay: WeekDay;

  @ApiProperty({
    example: '08:00',
    description: 'Hora de inicio del primer bloque (ej. 08:00)',
  })
  @IsString()
  @MinLength(5)
  blockStart: string;

  @ApiProperty({
    example: '12:00',
    description:
      'Hora de fin del rango (ej. 12:00). Crea todos los bloques de 1h entre inicio y fin.',
  })
  @IsString()
  @MinLength(5)
  blockEnd: string;
}

export class UpdateScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  trimesterId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  instructorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  environmentId?: string;

  @ApiPropertyOptional({ enum: WeekDay })
  @IsOptional()
  @IsEnum(WeekDay)
  weekDay?: WeekDay;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  blockStart?: string;

  @ApiPropertyOptional({ enum: ScheduleStatus })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;
}

export class ListSchedulesQueryDto {
  @ApiProperty()
  @IsUUID()
  trimesterId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  instructorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  environmentId?: string;
}

export class CalendarSchedulesQueryDto {
  @ApiProperty()
  @IsUUID()
  trimesterId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  instructorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  environmentId?: string;
}
