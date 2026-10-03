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
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { QueryVehicleDto } from './dto/query-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @RequirePermissions('vehicle.create')
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Get()
  @RequirePermissions('vehicle.view')
  list(@Query() query: QueryVehicleDto) {
    return this.vehiclesService.list(query);
  }

  @Get(':id')
  @RequirePermissions('vehicle.view')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('vehicle.edit')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('vehicle.delete')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.remove(id);
  }
}
