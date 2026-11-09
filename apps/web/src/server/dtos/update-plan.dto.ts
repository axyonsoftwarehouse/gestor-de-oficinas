import { IsIn } from 'class-validator';

export class UpdatePlanDto {
  @IsIn(['essencial', 'completo'])
  plan!: 'essencial' | 'completo';
}
