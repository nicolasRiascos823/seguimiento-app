import {

  IsDateString,

  IsEnum,

  IsOptional,

  IsString,

  MinLength,

} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { TrimesterStatus } from '../../database/enums';



export class CreateTrimesterDto {

  @ApiProperty()

  @IsString()

  @MinLength(2)

  name: string;



  @ApiProperty({ example: '2026-01-15' })

  @IsDateString()

  startDate: string;



  @ApiProperty({ example: '2026-04-15' })

  @IsDateString()

  endDate: string;

}



export class UpdateTrimesterDto {

  @ApiPropertyOptional()

  @IsOptional()

  @IsString()

  @MinLength(2)

  name?: string;



  @ApiPropertyOptional()

  @IsOptional()

  @IsDateString()

  startDate?: string;



  @ApiPropertyOptional()

  @IsOptional()

  @IsDateString()

  endDate?: string;



  @ApiPropertyOptional({ enum: TrimesterStatus })

  @IsOptional()

  @IsEnum(TrimesterStatus)

  status?: TrimesterStatus;

}


