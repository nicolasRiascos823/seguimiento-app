import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FollowUpStatus } from '../../database/enums';

export class CreateFollowUpDto {
  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsUUID()
  apprenticeId: string;

  @ApiProperty()
  @IsUUID()
  competencyId: string;

  @ApiProperty()
  @IsUUID()
  learningOutcomeId: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  observations: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  commitments?: string;

  @ApiPropertyOptional({ enum: FollowUpStatus })
  @IsOptional()
  @IsEnum(FollowUpStatus)
  status?: FollowUpStatus;
}
