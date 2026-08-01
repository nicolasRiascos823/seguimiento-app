import { Module } from '@nestjs/common';

import { PerformanceStatusesService } from './performance-statuses.service';

import { PerformanceStatusesController } from './performance-statuses.controller';



@Module({

  controllers: [PerformanceStatusesController],

  providers: [PerformanceStatusesService],

  exports: [PerformanceStatusesService],

})

export class PerformanceStatusesModule {}


