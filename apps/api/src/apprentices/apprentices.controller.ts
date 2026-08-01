import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '../database/enums';
import { ApprenticesService } from './apprentices.service';
import { CreateApprenticeDto, UpdateApprenticeDto } from './dto/apprentice.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('Apprentices')
@ApiBearerAuth()
@Controller('apprentices')
export class ApprenticesController {
  constructor(private readonly apprenticesService: ApprenticesService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateApprenticeDto, @CurrentUser() user: AuthUser) {
    return this.apprenticesService.create(dto, user);
  }

  @Get()
  findAll(
    @Query()
    query: PaginationQueryDto & {
      groupId?: string;
      status?: string;
      document?: string;
      leaderId?: string;
    },
    @CurrentUser() user: AuthUser,
  ) {
    return this.apprenticesService.findAll(query, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.apprenticesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApprenticeDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.apprenticesService.update(id, dto, user);
  }
}
