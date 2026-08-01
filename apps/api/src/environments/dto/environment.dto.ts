import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { EnvironmentStatus } from '../../database/enums';



export class CreateEnvironmentDto {

  @ApiProperty()

  @IsString()

  @MinLength(2)

  name: string;

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

}


