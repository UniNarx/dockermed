
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';
import { IUser } from './User';

export interface IDoctorProfile extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;



  createdAt: Date;
  updatedAt: Date;
}

const DoctorProfileSchema = new Schema<IDoctorProfile>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },



  },
  {
    timestamps: true,
  }
);

const DoctorProfile: Model<IDoctorProfile> =
  mongoose.models.DoctorProfile || model<IDoctorProfile>('DoctorProfile', DoctorProfileSchema);

export default DoctorProfile;