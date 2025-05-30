
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';
import { IUser } from './User';



export interface IPatient extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  assignedDoctors?: (Types.ObjectId)[];
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      required: false,
    },
    assignedDoctors: [{
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
    }],
  },
  {
    timestamps: true,
  }
);

const Patient: Model<IPatient> = mongoose.models.Patient || model<IPatient>('Patient', PatientSchema);
export default Patient;