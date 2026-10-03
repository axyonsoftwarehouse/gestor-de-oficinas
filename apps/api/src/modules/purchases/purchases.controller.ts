import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { QueryPurchaseDto } from './dto/query-purchase.dto';
import { PurchasesService } from './purchases.service';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @RequirePermissions('purchase.create')
  create(@Body() dto: CreatePurchaseDto, @CurrentUser() user: AuthUser) {
    return this.purchasesService.create(dto, user.userId);
  }

  @Get()
  @RequirePermissions('purchase.view')
  list(@Query() query: QueryPurchaseDto) {
    return this.purchasesService.list(query);
  }

  @Get(':id')
  @RequirePermissions('purchase.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.findOne(id);
  }

  @Post(':id/cancel')
  @RequirePermissions('purchase.edit')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.purchasesService.cancel(id);
  }
}
