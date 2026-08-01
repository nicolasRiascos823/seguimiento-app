import { Module } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { TimelineController } from './timeline.controller';
import { ApprenticesModule } from '../apprentices/apprentices.module';

@Module({
  imports: [ApprenticesModule],
  controllers: [TimelineController],
  providers: [TimelineService],
})
export class TimelineModule {}
