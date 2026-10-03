import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { IssueToJobDto } from './dto/issue-to-job.dto';
import { QueryBalanceDto } from './dto/query-balance.dto';
import { QueryMovementDto } from './dto/query-movement.dto';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get('locations')
  @RequirePermissions('stock.view')
  listLocations(@Query('branchId') branchId?: string) {
    return this.stockService.listLocations(branchId);
  }

  @Post('locations')
  @RequirePermissions('stock.create')
  createLocation(@Body() dto: CreateLocationDto) {
    return this.stockService.createLocation(dto);
  }

  @Get('balances')
  @RequirePermissions('stock.view')
  listBalances(@Query() query: QueryBalanceDto) {
    return this.stockService.listBalances(query);
  }

  @Get('movements')
  @RequirePermissions('stock.view')
  listMovements(@Query() query: QueryMovementDto) {
    return this.stockService.listMovements(query);
  }

  @Post('movements')
  @RequirePermissions('stock.create')
  createMovement(@Body() dto: CreateMovementDto, @CurrentUser() user: AuthUser) {
    return this.stockService.createMovement(dto, user.userId);
  }

  @Post('issues')
  @RequirePermissions('stock.create')
  issueToJob(@Body() dto: IssueToJobDto, @CurrentUser() user: AuthUser) {
    return this.stockService.issueToJob(dto, user.userId);
  }
}
