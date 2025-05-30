
import { Router, Response } from 'express';
import { protect } from '../middleware/authMiddleware';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import ChatMessage from '../models/ChatMessage';
import User, { IUser } from '../models/User';
import mongoose, { Types } from 'mongoose';

const router = Router();


const generateConversationId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};


router.get('/conversations', protect, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUserId = req.user?.id;
  if (!currentUserId) {
    res.status(401).json({ message: 'Пользователь не аутентифицирован' });
    return;
  }

  try {
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(currentUserId) },
            { receiver: new mongoose.Types.ObjectId(currentUserId) }
          ]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: "$conversationId",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$read", false] },
                    { $eq: ["$receiver", new mongoose.Types.ObjectId(currentUserId)] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: User.collection.name,
          localField: 'lastMessage.sender',
          foreignField: '_id',
          as: 'senderInfo'
        }
      },
      {
        $unwind: { path: "$senderInfo", preserveNullAndEmptyArrays: true }
      },
       {
        $lookup: {
          from: User.collection.name,
          localField: 'lastMessage.receiver',
          foreignField: '_id',
          as: 'receiverInfo'
        }
      },
      {
        $unwind: { path: "$receiverInfo", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          conversationId: "$_id",
          lastMessage: {
            _id: "$lastMessage._id",
            text: "$lastMessage.message",
            timestamp: "$lastMessage.timestamp",
            senderId: "$lastMessage.sender",
            receiverId: "$lastMessage.receiver",
            read: "$lastMessage.read",
          },
          unreadCount: "$unreadCount",
          otherParticipant: {
            $cond: {
              if: { $eq: ["$lastMessage.sender", new mongoose.Types.ObjectId(currentUserId)] },
              then: { _id: "$receiverInfo._id", id: "$receiverInfo._id", username: "$receiverInfo.username" },
              else: { _id: "$senderInfo._id", id: "$senderInfo._id", username: "$senderInfo.username" }
            }
          }
        }
      },
      {
        $sort: { "lastMessage.timestamp": -1 }
      }
    ]);
    
    res.status(200).json(conversations);

  } catch (error: any) {
    console.error('[ChatRoutes] Ошибка в GET /conversations:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка диалогов' });

  }
});



router.get('/history/:otherUserId', protect, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const currentUserId = req.user?.id;
  const otherUserId = req.params.otherUserId;

  if (!currentUserId) {
    res.status(401).json({ message: 'Пользователь не аутентифицирован' });
    return;
  }
  if (!otherUserId || !mongoose.isValidObjectId(otherUserId)) {
    res.status(400).json({ message: 'Некорректный ID собеседника' });
    return;
  }

  const conversationId = generateConversationId(currentUserId, otherUserId);
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  try {
    const messages = await ChatMessage.find({ conversationId })
      .populate<{ sender: Pick<IUser, '_id' | 'username'> }>('sender', 'username _id')
      .populate<{ receiver: Pick<IUser, '_id' | 'username'> }>('receiver', 'username _id')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedMessages = messages.map(msg => ({
        ...msg,
        _id: msg._id.toString(),
        id: msg._id.toString(),
        sender: { id: (msg.sender as any)._id.toString(), username: (msg.sender as any).username },
        receiver: { id: (msg.receiver as any)._id.toString(), username: (msg.receiver as any).username },
    })).reverse();

    await ChatMessage.updateMany(
      { conversationId: conversationId, receiver: new mongoose.Types.ObjectId(currentUserId), read: false },
      { $set: { read: true } }
    );

    const totalMessages = await ChatMessage.countDocuments({ conversationId });

    res.status(200).json({
        messages: formattedMessages,
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages
    });
  } catch (error: any) {
    console.error(`[ChatRoutes] Ошибка в GET /history/${otherUserId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении истории сообщений' });
  }
});


router.post('/messages/:messageId/read', protect, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const currentUserId = req.user?.id;
    const messageId = req.params.messageId;

    if (!currentUserId) {
        res.status(401).json({ message: 'Пользователь не аутентифицирован' });
        return;
    }
    if (!messageId || !mongoose.isValidObjectId(messageId)) {
        res.status(400).json({ message: 'Некорректный ID сообщения' });
        return;
    }

    try {
        const message = await ChatMessage.findById(messageId);
        if (!message) {
            res.status(404).json({ message: 'Сообщение не найдено' });
            return;
        }

        if (message.receiver.toString() !== currentUserId) {
            res.status(403).json({ message: 'Вы не можете пометить это сообщение как прочитанное' });
            return;
        }

        if (!message.read) {
            message.read = true;
            await message.save();
        }
        
        res.status(200).json({ message: 'Сообщение помечено как прочитанное', updatedMessage: message });
    } catch (error: any) {
        console.error(`[ChatRoutes] Ошибка в POST /messages/${messageId}/read:`, error);
        res.status(500).json({ message: 'Ошибка сервера при обновлении статуса сообщения' });
    }
});

export default router;
