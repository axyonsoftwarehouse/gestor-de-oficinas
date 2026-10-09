import { CreateCustomerDto } from './create-customer.dto';
import { PartialType } from './partial-type';

export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
