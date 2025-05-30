
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';

export interface IRole extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  name: string;
}

const RoleSchema = new Schema<IRole>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const Role: Model<IRole> = mongoose.models.Role || model<IRole>('Role', RoleSchema);
export default Role;