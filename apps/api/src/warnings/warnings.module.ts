import { Module } from '@nestjs/common';
import { WarningsService } from './warnings.service';
import { WarningsController } from './warnings.controller';
import { ApprenticesModule } from '../apprentices/apprentices.module';

@Module({
  imports: [ApprenticesModule],
  controllers: [WarningsController],
  providers: [WarningsService],
  exports: [WarningsService],
})
export class WarningsModule {}
