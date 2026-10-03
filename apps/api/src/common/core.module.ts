import { Global, Module } from '@nestjs/common';
import { NumberSequenceService } from './services/number-sequence.service';

@Global()
@Module({
  providers: [NumberSequenceService],
  exports: [NumberSequenceService],
})
export class CoreModule {}
