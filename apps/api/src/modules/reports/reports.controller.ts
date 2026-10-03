import { Controller, Get, Query } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { QueryReportDto } from './dto/query-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('financial')
  @RequirePermissions('report.view')
  financial(@Query() query: QueryReportDto) {
    return this.reportsService.financial(query);
  }

  @Get('stock')
  @RequirePermissions('report.view')
  stock() {
    return this.reportsService.stock();
  }

  @Get('job-cards')
  @RequirePermissions('report.view')
  jobCards() {
    return this.reportsService.jobCards();
  }
}
