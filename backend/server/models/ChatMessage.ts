
import mongoose, { Schema, model, Document, Types } from 'mongoose';
import { IUser } from './User';

export interface IChatMessage extends Document<Types.ObjectId> {
  _id: Types.ObjectId;
  sender: Types.ObjectId | IUser;
  receiver: Types.ObjectId | IUser;
  message: string;
  timestamp: Date;
  read: boolean;
  conversationId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    _id: { type: Schema.Types.ObjectId, auto: true },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    },
    conversationId: {
      type: String,
      required: true,
      index: true,
    }
  },
  {
    timestamps: true,
  }
);


ChatMessageSchema.index({ conversationId: 1, timestamp: -1 });

const ChatMessage: mongoose.Model<IChatMessage> =
  mongoose.models.ChatMessage || model<IChatMessage>('ChatMessage', ChatMessageSchema);

export default ChatMessage;
