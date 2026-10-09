import { CreateJobCardDto } from './create-job-card.dto';
import { PartialType } from './partial-type';

export class UpdateJobCardDto extends PartialType(CreateJobCardDto) {}
