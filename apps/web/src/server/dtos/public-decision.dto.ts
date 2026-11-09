import { IsIn } from 'class-validator';

export class PublicDecisionDto {
  @IsIn(['approve', 'reject'])
  decision!: 'approve' | 'reject';
}
