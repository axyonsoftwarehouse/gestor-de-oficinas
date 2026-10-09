import { CreateAppointmentDto } from './create-appointment.dto';
import { PartialType } from './partial-type';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}
