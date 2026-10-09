import { CreateExpenseDto } from './create-expense.dto';
import { PartialType } from './partial-type';

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}
