import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CreateInspectionTemplateDto } from './dto/create-inspection-template.dto';
import { QueryInspectionTemplateDto } from './dto/query-inspection-template.dto';
import { InspectionTemplatesService } from './inspection-templates.service';

@Controller('inspection-templates')
export class InspectionTemplatesController {
  constructor(private readonly templatesService: InspectionTemplatesService) {}

  @Post()
  @RequirePermissions('inspection.create')
  create(@Body() dto: CreateInspectionTemplateDto) {
    return this.templatesService.create(dto);
  }

  @Get()
  @RequirePermissions('inspection.view')
  list(@Query() query: QueryInspectionTemplateDto) {
    return this.templatesService.list(query);
  }

  @Get(':id')
  @RequirePermissions('inspection.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.findOne(id);
  }

  @Post(':id/publish')
  @RequirePermissions('inspection.edit')
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.templatesService.publish(id);
  }
}
