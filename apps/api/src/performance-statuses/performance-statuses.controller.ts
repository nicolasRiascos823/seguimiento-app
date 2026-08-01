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

import { PerformanceStatusesService } from './performance-statuses.service';

import {

  CreatePerformanceStatusDto,

  UpdatePerformanceStatusDto,

} from './dto/performance-status.dto';

import { Roles } from '../common/decorators/roles.decorator';

import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';



@ApiTags('Performance Statuses')

@ApiBearerAuth()

@Controller('performance-statuses')

export class PerformanceStatusesController {

  constructor(

    private readonly performanceStatusesService: PerformanceStatusesService,

  ) {}



  @Get()

  findAll(@Query('activeOnly') activeOnly?: string) {

    return this.performanceStatusesService.findAll(activeOnly === 'true');

  }



  @Post()

  @Roles(Role.ADMIN)

  create(

    @Body() dto: CreatePerformanceStatusDto,

    @CurrentUser() user: AuthUser,

  ) {

    return this.performanceStatusesService.create(dto, user);

  }



  @Get(':id')

  findOne(@Param('id', ParseUUIDPipe) id: string) {

    return this.performanceStatusesService.findOne(id);

  }



  @Patch(':id')

  @Roles(Role.ADMIN)

  update(

    @Param('id', ParseUUIDPipe) id: string,

    @Body() dto: UpdatePerformanceStatusDto,

    @CurrentUser() user: AuthUser,

  ) {

    return this.performanceStatusesService.update(id, dto, user);

  }

}


