import { PartialType } from '@nestjs/mapped-types';
import { CreateJobLineDto } from './create-job-line.dto';

export class UpdateJobLineDto extends PartialType(CreateJobLineDto) {}
