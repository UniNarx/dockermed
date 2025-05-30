
import mongoose, { Schema, model, Document, Model, Types } from 'mongoose';
import { IPatient } from './Patient';
import { IDoctor } from './Doctor';

export interface IMedicalRecord extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  patient: Types.ObjectId | IPatient;
  doctor: Types.ObjectId | IDoctor;
  visitDate: Date;
  notes?: string;
  attachments?: string[];

  createdAt: Date;
  updatedAt: Date;
}

const MedicalRecordSchema = new Schema<IMedicalRecord>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    patient: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctor: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    visitDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);


MedicalRecordSchema.index({ patient: 1, visitDate: -1 });
MedicalRecordSchema.index({ doctor: 1, visitDate: -1 });

const MedicalRecord: Model<IMedicalRecord> =
  mongoose.models.MedicalRecord || model<IMedicalRecord>('MedicalRecord', MedicalRecordSchema);

export default MedicalRecord;