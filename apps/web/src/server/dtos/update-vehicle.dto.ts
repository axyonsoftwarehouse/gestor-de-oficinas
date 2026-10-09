import { CreateVehicleDto } from './create-vehicle.dto';
import { PartialType } from './partial-type';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}
