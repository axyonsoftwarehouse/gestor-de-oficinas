import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateLineItemDto, UpdateLineItemDto } from '../../common/dto/line-item.dto';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { QueryQuotationDto } from './dto/query-quotation.dto';
import { UpdateQuotationDto } from './dto/update-quotation.dto';
import { QuotationsService } from './quotations.service';

@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  @RequirePermissions('quotation.create')
  create(@Body() dto: CreateQuotationDto, @CurrentUser() user: AuthUser) {
    return this.quotationsService.create(dto, user.userId);
  }

  @Get()
  @RequirePermissions('quotation.view')
  list(@Query() query: QueryQuotationDto) {
    return this.quotationsService.list(query);
  }

  @Get(':id')
  @RequirePermissions('quotation.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotationsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('quotation.edit')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateQuotationDto) {
    return this.quotationsService.update(id, dto);
  }

  @Post(':id/lines')
  @RequirePermissions('quotation.edit')
  addLine(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateLineItemDto) {
    return this.quotationsService.addLine(id, dto);
  }

  @Patch(':id/lines/:lineId')
  @RequirePermissions('quotation.edit')
  updateLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Body() dto: UpdateLineItemDto,
  ) {
    return this.quotationsService.updateLine(id, lineId, dto);
  }

  @Delete(':id/lines/:lineId')
  @RequirePermissions('quotation.edit')
  removeLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
  ) {
    return this.quotationsService.removeLine(id, lineId);
  }

  @Post(':id/send')
  @RequirePermissions('quotation.edit')
  send(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotationsService.send(id);
  }

  @Post(':id/approve')
  @RequirePermissions('quotation.approve')
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.quotationsService.approve(id, user.userId);
  }

  @Post(':id/reject')
  @RequirePermissions('quotation.approve')
  reject(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotationsService.reject(id);
  }

  @Post(':id/convert-to-invoice')
  @RequirePermissions('invoice.create')
  convertToInvoice(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.quotationsService.convertToInvoice(id, user.userId);
  }

  @Delete(':id')
  @RequirePermissions('quotation.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotationsService.remove(id);
  }
}
