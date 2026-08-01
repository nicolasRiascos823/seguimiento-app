import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FollowUpsService } from './follow-ups.service';
import { CreateFollowUpDto } from './dto/follow-up.dto';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('FollowUps')
@ApiBearerAuth()
@Controller('follow-ups')
export class FollowUpsController {
  constructor(private readonly followUpsService: FollowUpsService) {}

  @Post()
  create(@Body() dto: CreateFollowUpDto, @CurrentUser() user: AuthUser) {
    return this.followUpsService.create(dto, user);
  }

  @Get()
  findAll(
    @Query()
    query: PaginationQueryDto & { apprenticeId?: string; instructorId?: string },
    @CurrentUser() user: AuthUser,
  ) {
    return this.followUpsService.findAll(query, user);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.followUpsService.findOne(id, user);
  }
}
