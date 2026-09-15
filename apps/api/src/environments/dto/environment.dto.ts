import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnvironmentStatus } from '../../database/enums';

export class CreateEnvironmentDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({
    description:
      'Si es true, permite varias fichas e instructores en el mismo bloque horario',
  })
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;
}

export class UpdateEnvironmentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ enum: EnvironmentStatus })
  @IsOptional()
  @IsEnum(EnvironmentStatus)
  status?: EnvironmentStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;
}
