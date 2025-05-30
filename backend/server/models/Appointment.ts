
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';
import { IDoctor } from './Doctor';
import { IPatient } from './Patient';


export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',

}

export interface IAppointment extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  doctor: Types.ObjectId | IDoctor;
  patient: Types.ObjectId | IPatient;
  apptTime: Date;
  status: AppointmentStatus;

  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    apptTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      default: AppointmentStatus.SCHEDULED,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);


AppointmentSchema.index({ doctor: 1, apptTime: 1 });

AppointmentSchema.index({ patient: 1, apptTime: 1 });


const Appointment: Model<IAppointment> = 
  mongoose.models.Appointment || model<IAppointment>('Appointment', AppointmentSchema);

export default Appointment;