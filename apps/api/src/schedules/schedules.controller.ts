import {

  Controller,

  Get,

  Post,

  Patch,

  Delete,

  Body,

  Param,

  Query,

  ParseUUIDPipe,

} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { Role } from '../database/enums';

import { SchedulesService } from './schedules.service';

import {

  CalendarSchedulesQueryDto,

  CreateScheduleDto,

  ListSchedulesQueryDto,

  UpdateScheduleDto,

} from './dto/schedule.dto';

import { Roles } from '../common/decorators/roles.decorator';

import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';



@ApiTags('Schedules')

@ApiBearerAuth()

@Controller('schedules')

export class SchedulesController {

  constructor(private readonly schedulesService: SchedulesService) {}



  @Get('time-blocks')

  getTimeBlocks() {

    return this.schedulesService.getTimeBlocks();

  }



  @Get('calendar')

  getCalendar(@Query() query: CalendarSchedulesQueryDto) {

    return this.schedulesService.getCalendar(query);

  }



  @Get()

  findAll(@Query() query: ListSchedulesQueryDto) {

    return this.schedulesService.findAll(query);

  }



  @Post()

  @Roles(Role.ADMIN)

  create(@Body() dto: CreateScheduleDto, @CurrentUser() user: AuthUser) {

    return this.schedulesService.create(dto, user);

  }



  @Patch(':id/deactivate')

  @Roles(Role.ADMIN)

  deactivate(

    @Param('id', ParseUUIDPipe) id: string,

    @CurrentUser() user: AuthUser,

  ) {

    return this.schedulesService.deactivate(id, user);

  }



  @Patch(':id')

  @Roles(Role.ADMIN)

  update(

    @Param('id', ParseUUIDPipe) id: string,

    @Body() dto: UpdateScheduleDto,

    @CurrentUser() user: AuthUser,

  ) {

    return this.schedulesService.update(id, dto, user);

  }



  @Delete(':id')

  @Roles(Role.ADMIN)

  remove(

    @Param('id', ParseUUIDPipe) id: string,

    @CurrentUser() user: AuthUser,

  ) {

    return this.schedulesService.remove(id, user);

  }

}


