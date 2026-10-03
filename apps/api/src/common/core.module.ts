import { Global, Module } from '@nestjs/common';
import { LineCalculatorService } from './services/line-calculator.service';
import { NumberSequenceService } from './services/number-sequence.service';

@Global()
@Module({
  providers: [NumberSequenceService, LineCalculatorService],
  exports: [NumberSequenceService, LineCalculatorService],
})
export class CoreModule {}
