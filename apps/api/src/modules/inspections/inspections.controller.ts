import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { QueryInspectionDto } from './dto/query-inspection.dto';
import { StartInspectionDto } from './dto/start-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { UpsertAnswerDto } from './dto/upsert-answer.dto';
import { InspectionsService } from './inspections.service';

@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post()
  @RequirePermissions('inspection.create')
  start(@Body() dto: StartInspectionDto, @CurrentUser() user: AuthUser) {
    return this.inspectionsService.start(dto, user.userId);
  }

  @Get()
  @RequirePermissions('inspection.view')
  list(@Query() query: QueryInspectionDto) {
    return this.inspectionsService.list(query);
  }

  @Get(':id')
  @RequirePermissions('inspection.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.inspectionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('inspection.edit')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInspectionDto) {
    return this.inspectionsService.update(id, dto);
  }

  @Post(':id/complete')
  @RequirePermissions('inspection.edit')
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.inspectionsService.complete(id);
  }

  @Put(':id/answers/:questionId')
  @RequirePermissions('inspection.edit')
  upsertAnswer(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: UpsertAnswerDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.inspectionsService.upsertAnswer(id, questionId, dto, user.userId);
  }
}
