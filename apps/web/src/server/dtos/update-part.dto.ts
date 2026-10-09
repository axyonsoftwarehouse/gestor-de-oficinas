import { CreatePartDto } from './create-part.dto';
import { PartialType } from './partial-type';

export class UpdatePartDto extends PartialType(CreatePartDto) {}
