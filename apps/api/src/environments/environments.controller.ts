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

import { EnvironmentsService } from './environments.service';

import { CreateEnvironmentDto, UpdateEnvironmentDto } from './dto/environment.dto';

import { Roles } from '../common/decorators/roles.decorator';

import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';



@ApiTags('Environments')

@ApiBearerAuth()

@Controller('environments')

export class EnvironmentsController {

  constructor(private readonly environmentsService: EnvironmentsService) {}



  @Post()

  @Roles(Role.ADMIN)

  create(@Body() dto: CreateEnvironmentDto, @CurrentUser() user: AuthUser) {

    return this.environmentsService.create(dto, user);

  }



  @Get()

  findAll(@Query('activeOnly') activeOnly?: string) {

    return this.environmentsService.findAll(activeOnly === 'true');

  }



  @Get(':id')

  findOne(@Param('id', ParseUUIDPipe) id: string) {

    return this.environmentsService.findOne(id);

  }



  @Patch(':id')

  @Roles(Role.ADMIN)

  update(

    @Param('id', ParseUUIDPipe) id: string,

    @Body() dto: UpdateEnvironmentDto,

    @CurrentUser() user: AuthUser,

  ) {

    return this.environmentsService.update(id, dto, user);

  }

}


