
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';
import { IUser } from './User';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export interface IPatientProfile extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser | string;
  dob?: Date;
  gender?: Gender;

  createdAt: Date;
  updatedAt: Date;
}

const PatientProfileSchema = new Schema<IPatientProfile>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    dob: {
      type: Date,
      required: false,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const PatientProfile: Model<IPatientProfile> =
  mongoose.models.PatientProfile || model<IPatientProfile>('PatientProfile', PatientProfileSchema);

export default PatientProfile;