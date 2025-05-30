
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';
import { IUser } from './User';


export interface IDoctor extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  user: Types.ObjectId | IUser;
  firstName: string;
  lastName: string;
  specialty: string;
  avatarUrl?: string;
  description?: string;
  assignedPatients?: (Types.ObjectId)[];
  createdAt: Date;
  updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
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
      required: [true, "Имя врача обязательно"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Фамилия врача обязательна"],
      trim: true,
    },
    specialty: {
      type: String,
      required: [true, "Специализация врача обязательна"],
      trim: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
      default: '',
    },
     description: {
      type: String,
      trim: true,
      default: '',
    },
    assignedPatients: [{
      type: Schema.Types.ObjectId,
      ref: 'Patient',
    }],
  },
  {
    timestamps: true,
  }
);

const Doctor: Model<IDoctor> = mongoose.models.Doctor || model<IDoctor>('Doctor', DoctorSchema);
export default Doctor;