import { Module } from '@nestjs/common';
import { JobCardsModule } from '../job-cards/job-cards.module';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [JobCardsModule],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
