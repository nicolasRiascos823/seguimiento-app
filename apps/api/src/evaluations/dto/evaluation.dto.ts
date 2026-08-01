import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';



export class UpsertEvaluationDto {

  @ApiProperty()

  @IsUUID()

  trimesterId: string;



  @ApiProperty()

  @IsUUID()

  groupId: string;



  @ApiProperty()

  @IsUUID()

  apprenticeId: string;



  @ApiProperty()

  @IsUUID()

  instructorId: string;



  @ApiProperty()

  @IsUUID()

  performanceStatusId: string;



  @ApiProperty()

  @IsString()

  @MinLength(1)

  observations: string;



  @ApiPropertyOptional()

  @IsOptional()

  @IsString()

  commitments?: string;

}



export class EvaluationMatrixQueryDto {

  @ApiProperty()

  @IsUUID()

  trimesterId: string;



  @ApiProperty()

  @IsUUID()

  groupId: string;

}


