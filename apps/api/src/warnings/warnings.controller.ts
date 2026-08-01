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

import { CommitteeStatus, WarningCallNumber } from '../database/enums';

import { WarningsService } from './warnings.service';

import {

  CreateWarningDto,

  UpdateWarningCommitteeStatusDto,

} from './dto/warning.dto';

import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

import { PaginationQueryDto } from '../common/dto/pagination.dto';



@ApiTags('Warnings')

@ApiBearerAuth()

@Controller('warnings')

export class WarningsController {

  constructor(private readonly warningsService: WarningsService) {}



  @Post()

  create(@Body() dto: CreateWarningDto, @CurrentUser() user: AuthUser) {

    return this.warningsService.create(dto, user);

  }



  @Get()

  findAll(

    @Query()

    query: PaginationQueryDto & {

      apprenticeId?: string;

      callNumber?: WarningCallNumber;

      committeeStatus?: CommitteeStatus;

    },

    @CurrentUser() user: AuthUser,

  ) {

    return this.warningsService.findAll(query, user);

  }



  @Get(':id')

  findOne(

    @Param('id', ParseUUIDPipe) id: string,

    @CurrentUser() user: AuthUser,

  ) {

    return this.warningsService.findOne(id, user);

  }



  @Patch(':id/committee-status')

  updateCommitteeStatus(

    @Param('id', ParseUUIDPipe) id: string,

    @Body() dto: UpdateWarningCommitteeStatusDto,

    @CurrentUser() user: AuthUser,

  ) {

    return this.warningsService.updateCommitteeStatus(id, dto, user);

  }

}


