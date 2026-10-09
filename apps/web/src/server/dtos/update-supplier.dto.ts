import { CreateSupplierDto } from './create-supplier.dto';
import { PartialType } from './partial-type';

export class UpdateSupplierDto extends PartialType(CreateSupplierDto) {}
