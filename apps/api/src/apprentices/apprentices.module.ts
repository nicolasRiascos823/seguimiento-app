import { Module } from '@nestjs/common';
import { ApprenticesService } from './apprentices.service';
import { ApprenticesController } from './apprentices.controller';
import { GroupsModule } from '../groups/groups.module';
import { ImportsService } from '../imports/imports.service';
import { ImportsController } from '../imports/imports.controller';

@Module({
  imports: [GroupsModule],
  controllers: [ApprenticesController, ImportsController],
  providers: [ApprenticesService, ImportsService],
  exports: [ApprenticesService],
})
export class ApprenticesModule {}
