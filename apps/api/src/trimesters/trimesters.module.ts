import { Module } from '@nestjs/common';

import { TrimestersService } from './trimesters.service';

import { TrimestersController } from './trimesters.controller';



@Module({

  controllers: [TrimestersController],

  providers: [TrimestersService],

  exports: [TrimestersService],

})

export class TrimestersModule {}


