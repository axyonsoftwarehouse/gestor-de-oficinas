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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequirePermissions('customer.create')
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Get()
  @RequirePermissions('customer.view')
  list(@Query() query: QueryCustomerDto) {
    return this.customersService.list(query);
  }

  @Get(':id')
  @RequirePermissions('customer.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('customer.edit')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('customer.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.remove(id);
  }
}
