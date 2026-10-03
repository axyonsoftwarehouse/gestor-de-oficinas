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
import { JobCardsService } from './job-cards.service';
import { AssignMechanicDto } from './dto/assign-mechanic.dto';
import { CreateJobCardDto } from './dto/create-job-card.dto';
import { CreateJobLineDto } from './dto/create-job-line.dto';
import { QueryJobCardDto } from './dto/query-job-card.dto';
import { TransitionJobCardDto } from './dto/transition-job-card.dto';
import { UpdateJobCardDto } from './dto/update-job-card.dto';
import { UpdateJobLineDto } from './dto/update-job-line.dto';

@Controller('job-cards')
export class JobCardsController {
  constructor(private readonly jobCardsService: JobCardsService) {}

  @Post()
  @RequirePermissions('job_card.create')
  create(@Body() dto: CreateJobCardDto, @CurrentUser() user: AuthUser) {
    return this.jobCardsService.create(dto, user.userId);
  }

  @Get()
  @RequirePermissions('job_card.view')
  list(@Query() query: QueryJobCardDto) {
    return this.jobCardsService.list(query);
  }

  @Get(':id')
  @RequirePermissions('job_card.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobCardsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('job_card.edit')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateJobCardDto) {
    return this.jobCardsService.update(id, dto);
  }

  @Post(':id/transition')
  @RequirePermissions('job_card.edit')
  transition(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionJobCardDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.jobCardsService.transition(id, dto, user.userId);
  }

  @Post(':id/lines')
  @RequirePermissions('job_card.edit')
  addLine(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateJobLineDto) {
    return this.jobCardsService.addLine(id, dto);
  }

  @Patch(':id/lines/:lineId')
  @RequirePermissions('job_card.edit')
  updateLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @Body() dto: UpdateJobLineDto,
  ) {
    return this.jobCardsService.updateLine(id, lineId, dto);
  }

  @Delete(':id/lines/:lineId')
  @RequirePermissions('job_card.edit')
  removeLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
  ) {
    return this.jobCardsService.removeLine(id, lineId);
  }

  @Post(':id/mechanics')
  @RequirePermissions('job_card.edit')
  assignMechanic(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignMechanicDto,
  ) {
    return this.jobCardsService.assignMechanic(id, dto);
  }

  @Delete(':id/mechanics/:userId')
  @RequirePermissions('job_card.edit')
  removeMechanic(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.jobCardsService.removeMechanic(id, userId);
  }
}
