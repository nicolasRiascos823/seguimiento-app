import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';

@ApiTags('Timeline')
@ApiBearerAuth()
@Controller('timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get('apprentices/:id')
  getApprenticeTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.timelineService.getApprenticeTimeline(id, user);
  }
}
