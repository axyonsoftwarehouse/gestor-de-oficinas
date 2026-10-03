import { Module } from '@nestjs/common';
import { InspectionTemplatesController } from './inspection-templates.controller';
import { InspectionTemplatesService } from './inspection-templates.service';
import { InspectionsController } from './inspections.controller';
import { InspectionsService } from './inspections.service';

@Module({
  controllers: [InspectionTemplatesController, InspectionsController],
  providers: [InspectionTemplatesService, InspectionsService],
})
export class InspectionsModule {}
