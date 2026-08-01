import {

  IsDateString,

  IsEnum,

  IsOptional,

  IsString,

  IsUUID,

  MinLength,

} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CommitteeStatus, WarningCallNumber } from '../../database/enums';



export class CreateWarningDto {

  @ApiProperty()

  @IsDateString()

  date: string;



  @ApiProperty()

  @IsUUID()

  apprenticeId: string;



  @ApiProperty({ enum: WarningCallNumber })

  @IsEnum(WarningCallNumber)

  callNumber: WarningCallNumber;



  @ApiProperty()

  @IsString()

  @MinLength(3)

  reason: string;



  @ApiPropertyOptional()

  @IsOptional()

  @IsString()

  observation?: string;

}



export class UpdateWarningCommitteeStatusDto {

  @ApiProperty({ enum: CommitteeStatus })

  @IsEnum(CommitteeStatus)

  committeeStatus: CommitteeStatus;

}


