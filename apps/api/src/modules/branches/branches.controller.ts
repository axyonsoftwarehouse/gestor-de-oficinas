import { Body, Controller, Get, Post } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @RequirePermissions('branch.view')
  list() {
    return this.branchesService.list();
  }

  @Post()
  @RequirePermissions('branch.create')
  create(@Body() dto: CreateBranchDto) {
    return this.branchesService.create(dto);
  }
}
