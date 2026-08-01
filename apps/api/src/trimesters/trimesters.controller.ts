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

import { Role, TrimesterStatus } from '../database/enums';

import { TrimestersService } from './trimesters.service';

import { CreateTrimesterDto, UpdateTrimesterDto } from './dto/trimester.dto';

import { Roles } from '../common/decorators/roles.decorator';

import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';



@ApiTags('Trimesters')

@ApiBearerAuth()

@Controller('trimesters')

export class TrimestersController {

  constructor(private readonly trimestersService: TrimestersService) {}



  @Post()

  @Roles(Role.ADMIN)

  create(@Body() dto: CreateTrimesterDto, @CurrentUser() user: AuthUser) {

    return this.trimestersService.create(dto, user);

  }



  @Get()

  findAll(@Query('status') status?: TrimesterStatus) {

    return this.trimestersService.findAll(status);

  }



  @Get(':id')

  findOne(@Param('id', ParseUUIDPipe) id: string) {

    return this.trimestersService.findOne(id);

  }



  @Patch(':id')

  @Roles(Role.ADMIN)

  update(

    @Param('id', ParseUUIDPipe) id: string,

    @Body() dto: UpdateTrimesterDto,

    @CurrentUser() user: AuthUser,

  ) {

    return this.trimestersService.update(id, dto, user);

  }

}


