import { CreateQuotationDto } from './create-quotation.dto';
import { PartialType } from './partial-type';

export class UpdateQuotationDto extends PartialType(CreateQuotationDto) {}
