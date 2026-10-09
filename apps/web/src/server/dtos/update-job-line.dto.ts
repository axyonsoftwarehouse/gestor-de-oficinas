import { CreateJobLineDto } from './create-job-line.dto';
import { PartialType } from './partial-type';

export class UpdateJobLineDto extends PartialType(CreateJobLineDto) {}
