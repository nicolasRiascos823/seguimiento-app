import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GroupStatus } from '../../database/enums';

export class CreateGroupDto {
  @ApiProperty({ example: '2557890' })
  @IsString()
  @MinLength(3)
  number: string;

  @ApiProperty()
  @IsUUID()
  leaderId: string;
}

export class UpdateGroupDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  leaderId?: string;

  @ApiPropertyOptional({ enum: GroupStatus })
  @IsOptional()
  @IsEnum(GroupStatus)
  status?: GroupStatus;
}
