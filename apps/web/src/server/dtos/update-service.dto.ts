import { CreateServiceDto } from './create-service.dto';
import { PartialType } from './partial-type';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
