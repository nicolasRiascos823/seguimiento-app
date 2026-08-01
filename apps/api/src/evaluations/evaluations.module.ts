import { Module } from '@nestjs/common';

import { EvaluationsService } from './evaluations.service';

import { EvaluationsController } from './evaluations.controller';

import { GroupsModule } from '../groups/groups.module';



@Module({

  imports: [GroupsModule],

  controllers: [EvaluationsController],

  providers: [EvaluationsService],

  exports: [EvaluationsService],

})

export class EvaluationsModule {}


