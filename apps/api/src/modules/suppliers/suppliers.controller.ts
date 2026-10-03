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
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { QuerySupplierDto } from './dto/query-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @RequirePermissions('supplier.create')
  create(@Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(dto);
  }

  @Get()
  @RequirePermissions('supplier.view')
  list(@Query() query: QuerySupplierDto) {
    return this.suppliersService.list(query);
  }

  @Get(':id')
  @RequirePermissions('supplier.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('supplier.edit')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('supplier.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.suppliersService.remove(id);
  }
}
