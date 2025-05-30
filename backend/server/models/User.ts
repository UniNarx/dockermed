
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';
import { IRole } from './Role';

export interface IUser extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  username: string;
  passwordHash: string;
  role: Types.ObjectId | IRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> = mongoose.models.User || model<IUser>('User', UserSchema);
export default User;