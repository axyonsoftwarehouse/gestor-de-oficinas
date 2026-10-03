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
import { CreateExpenseDto } from './dto/create-expense.dto';
import { QueryExpenseDto } from './dto/query-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesService } from './expenses.service';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @RequirePermissions('expense.create')
  create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto);
  }

  @Get()
  @RequirePermissions('expense.view')
  list(@Query() query: QueryExpenseDto) {
    return this.expensesService.list(query);
  }

  @Get(':id')
  @RequirePermissions('expense.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('expense.edit')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('expense.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.remove(id);
  }
}
