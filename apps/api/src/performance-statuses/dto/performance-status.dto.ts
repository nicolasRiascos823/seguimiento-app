import {

  IsBoolean,

  IsInt,

  IsOptional,

  IsString,

  Min,

  MinLength,

} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';



export class CreatePerformanceStatusDto {

  @ApiProperty()

  @IsString()

  @MinLength(2)

  code: string;



  @ApiProperty()

  @IsString()

  @MinLength(2)

  name: string;



  @ApiProperty()

  @IsInt()

  @Min(0)

  sortOrder: number;



  @ApiPropertyOptional()

  @IsOptional()

  @IsBoolean()

  active?: boolean;

}



export class UpdatePerformanceStatusDto {

  @ApiPropertyOptional()

  @IsOptional()

  @IsString()

  @MinLength(2)

  code?: string;



  @ApiPropertyOptional()

  @IsOptional()

  @IsString()

  @MinLength(2)

  name?: string;



  @ApiPropertyOptional()

  @IsOptional()

  @IsInt()

  @Min(0)

  sortOrder?: number;



  @ApiPropertyOptional()

  @IsOptional()

  @IsBoolean()

  active?: boolean;

}


