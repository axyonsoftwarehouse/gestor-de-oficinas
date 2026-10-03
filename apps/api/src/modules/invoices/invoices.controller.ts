import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { QueryInvoiceDto } from './dto/query-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @RequirePermissions('invoice.view')
  list(@Query() query: QueryInvoiceDto) {
    return this.invoicesService.list(query);
  }

  @Post('from-job/:jobCardId')
  @RequirePermissions('invoice.create')
  createFromJob(
    @Param('jobCardId', ParseUUIDPipe) jobCardId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invoicesService.createFromJobCard(jobCardId, user.userId);
  }

  @Get(':id/document')
  @RequirePermissions('invoice.view')
  @Header('Content-Type', 'text/html; charset=utf-8')
  renderDocument(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.renderDocument(id);
  }

  @Get(':id')
  @RequirePermissions('invoice.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('invoice.edit')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoicesService.update(id, dto);
  }

  @Post(':id/issue')
  @RequirePermissions('invoice.edit')
  issue(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.issue(id);
  }

  @Post(':id/cancel')
  @RequirePermissions('invoice.edit')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoicesService.cancel(id);
  }

  @Post(':id/payments')
  @RequirePermissions('payment.create')
  addPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.invoicesService.addPayment(id, dto, user.userId);
  }

  @Delete(':id/payments/:paymentId')
  @RequirePermissions('payment.delete')
  removePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('paymentId', ParseUUIDPipe) paymentId: string,
  ) {
    return this.invoicesService.removePayment(id, paymentId);
  }
}
