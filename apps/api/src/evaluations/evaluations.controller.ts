import { Controller, Get, Post, Body, Query } from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { EvaluationsService } from './evaluations.service';

import {

  EvaluationMatrixQueryDto,

  UpsertEvaluationDto,

} from './dto/evaluation.dto';

import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';



@ApiTags('Evaluations')

@ApiBearerAuth()

@Controller('evaluations')

export class EvaluationsController {

  constructor(private readonly evaluationsService: EvaluationsService) {}



  @Get('matrix')

  getMatrix(

    @Query() query: EvaluationMatrixQueryDto,

    @CurrentUser() user: AuthUser,

  ) {

    return this.evaluationsService.getMatrix(query, user);

  }



  @Post()

  upsert(@Body() dto: UpsertEvaluationDto, @CurrentUser() user: AuthUser) {

    return this.evaluationsService.upsert(dto, user);

  }

}


