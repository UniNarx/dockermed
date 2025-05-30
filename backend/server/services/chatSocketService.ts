
import WebSocket, { WebSocketServer, RawData } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import url from 'url';
import ChatMessage, { IChatMessage } from '../models/ChatMessage';
import User, { IUser } from '../models/User';
import appConfig from '../config/index';
import { JwtPayloadWithIds } from '../types/jwt';
import { Types } from 'mongoose';


const clients = new Map<string, WebSocket>();

const wsClientData = new Map<WebSocket, { userId: string, username: string }>();

const generateConversationId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};


const getActiveUserList = async (): Promise<Array<{ id: string; _id: string; username: string }>> => {
  const activeUsers: Array<{ id: string; _id: string; username: string }> = [];
  for (const userId of clients.keys()) {




    const clientInfo = Array.from(wsClientData.values()).find(data => data.userId === userId);
    if (clientInfo) {
        activeUsers.push({ id: userId, _id: userId, username: clientInfo.username });
    } else {





        console.warn(`[ChatSocketService] Не найден username для активного userId: ${userId} в wsClientData`);
    }
  }
  return activeUsers;
};


const broadcastActiveUserList = async (wss: WebSocketServer) => {
  const activeUsers = await getActiveUserList();
  const message = JSON.stringify({ type: 'activeUserList', payload: activeUsers });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  console.log('[ChatSocketService] Разослан обновленный список активных пользователей:', activeUsers.map(u => u.username));
};


const broadcastUserJoined = async (wss: WebSocketServer, joinedUserData: { id: string; _id: string; username: string }) => {
  const message = JSON.stringify({ type: 'userJoined', payload: joinedUserData });
  wss.clients.forEach(client => {

    const clientData = wsClientData.get(client);
    if (client.readyState === WebSocket.OPEN && clientData?.userId !== joinedUserData.id) {
      client.send(message);
    }
  });
   console.log(`[ChatSocketService] Разослано уведомление о подключении пользователя: ${joinedUserData.username}`);
};


const broadcastUserLeft = (wss: WebSocketServer, leftUserId: string) => {
  const message = JSON.stringify({ type: 'userLeft', payload: { userId: leftUserId } });
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  console.log(`[ChatSocketService] Разослано уведомление об отключении пользователя ID: ${leftUserId}`);
};


export const setupWebSocketServer = (httpServer: Server) => {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws/chat' });
  const port = (httpServer.address() as WebSocket.AddressInfo)?.port || appConfig.port;
  console.log(`[ChatSocketService] WebSocket сервер готов к подключениям на ws:

  wss.on('connection', async (ws, req) => {
    let currentUserId: string | null = null;
    let currentUsername: string | null = null;

    ws.on('error', (err) => {
      const clientData = wsClientData.get(ws);
      const userIdForLog = clientData?.userId || currentUserId || 'unknown (during connection)';
      const usernameForLog = clientData?.username || currentUsername || userIdForLog;
      console.error(`[ChatSocketService] Ошибка WebSocket для ${usernameForLog} (ID: ${userIdForLog}):`, err.message);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.terminate();
      }
    });

    ws.on('close', async (code, reason) => {
      const clientData = wsClientData.get(ws);
      const closedUserId = clientData?.userId;
      const usernameForLog = clientData?.username || closedUserId || "N/A";

      console.log(`[ChatSocketService] Соединение ws (для ${usernameForLog}, ID: ${closedUserId || 'N/A'}) закрывается. Code: ${code}, Reason: ${reason?.toString()}`);
      
      if (closedUserId) {
        if (clients.get(closedUserId) === ws) {
          clients.delete(closedUserId);
          console.log(`[ChatSocketService] Пользователь ${usernameForLog} (ID: ${closedUserId}) удален из 'clients'.`);
        }
      }
      wsClientData.delete(ws);
      console.log(`[ChatSocketService] Завершение 'close'. Активных клиентов (clients.size): ${clients.size}. Записей в wsClientData: ${wsClientData.size}`);
      
      if (closedUserId) {
        await broadcastActiveUserList(wss);
        broadcastUserLeft(wss, closedUserId);
      }
    });

    try {
      const parameters = url.parse(req.url || '', true).query;
      const token = parameters.token as string;

      if (!token) {
        console.log('[ChatSocketService] Попытка подключения без токена.');
        ws.close(1008, 'Token required');
        return;
      }

      let decoded: JwtPayloadWithIds;
      try {
        decoded = jwt.verify(token, appConfig.jwtSecret) as JwtPayloadWithIds;
      } catch (error: any) {
        console.log('[ChatSocketService] Невалидный токен:', error.message);
        ws.close(1008, 'Invalid token');
        return;
      }

      currentUserId = decoded.userId;
      currentUsername = decoded.username || 'UnknownUser';

      const user = await User.findById(currentUserId);
      if (!user) {
        console.log(`[ChatSocketService] Пользователь с ID ${currentUserId} (username: ${currentUsername}) из токена НЕ НАЙДЕН в БД.`);
        ws.close(1008, 'User not found');
        return;
      }
      console.log(`[ChatSocketService] Пользователь ${user.username} (ID: ${user._id}) НАЙДЕН в БД. Попытка установки соединения.`);

      const oldWs = clients.get(currentUserId);
      if (oldWs && oldWs !== ws) {
        console.log(`[ChatSocketService] Пользователь ${currentUsername} (${currentUserId}) переподключился. Закрываем старое соединение (oldWs).`);
        oldWs.close(4001, 'Superseded by new connection');
      }

      clients.set(currentUserId, ws);
      wsClientData.set(ws, { userId: currentUserId, username: currentUsername });
      console.log(`[ChatSocketService] Клиент ${currentUsername} (ID: ${currentUserId}) успешно подключен. Всего клиентов: ${clients.size}`);
      

      const activeUsersNow = await getActiveUserList();
      ws.send(JSON.stringify({ type: 'activeUserList', payload: activeUsersNow }));
      ws.send(JSON.stringify({ type: 'info', payload: 'Successfully connected and authenticated!' }));
      

      await broadcastUserJoined(wss, { id: currentUserId, _id: currentUserId, username: currentUsername });




      ws.on('message', async (messageBuffer: RawData) => {
        const senderData = wsClientData.get(ws);
        if (!senderData) {
            console.error("[ChatSocketService] Не удалось определить отправителя сообщения (нет данных в wsClientData).");
            ws.send(JSON.stringify({ type: 'error', payload: 'Internal server error: Sender identity crisis.' }));
            return;
        }
        const { userId: senderId, username: senderUsername } = senderData;

        try {
          const messageData = JSON.parse(messageBuffer.toString());
          console.log(`[ChatSocketService] Получено сообщение от ${senderUsername} (ID: ${senderId}):`, messageData);

          const { receiverId, text } = messageData;

          if (!receiverId || !text) {
            ws.send(JSON.stringify({ type: 'error', payload: 'receiverId and text are required' }));
            return;
          }
          
          const receiverUserDoc = await User.findById(receiverId);
          if (!receiverUserDoc) {
            ws.send(JSON.stringify({ type: 'error', payload: 'Receiver not found' }));
            console.warn(`[ChatSocketService] Получатель с ID ${receiverId} не найден.`);
            return;
          }

          const conversationId = generateConversationId(senderId, receiverId);

          const chatMessageDoc = new ChatMessage({
            sender: new Types.ObjectId(senderId),
            receiver: new Types.ObjectId(receiverId),
            message: text,
            timestamp: new Date(),
            conversationId: conversationId,
          });
          const savedMessage = await chatMessageDoc.save();
          

          const populatedMessage = {
              _id: savedMessage._id.toString(),
              id: savedMessage._id.toString(),
              sender: { id: senderId, _id: senderId, username: senderUsername },
              receiver: { id: receiverId, _id: receiverId, username: receiverUserDoc.username },
              message: savedMessage.message,
              timestamp: savedMessage.timestamp.toISOString(),
              conversationId: savedMessage.conversationId,
              read: savedMessage.read,
              createdAt: savedMessage.createdAt.toISOString(),
              updatedAt: savedMessage.updatedAt.toISOString(),
          };
          
          const messageToSendToClients = {
            type: 'newMessage',
            payload: populatedMessage
          };

          const receiverWs = clients.get(receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify(messageToSendToClients));
            console.log(`[ChatSocketService] Сообщение отправлено получателю ${receiverUserDoc.username} (${receiverId})`);
          } else {
             console.log(`[ChatSocketService] Получатель ${receiverUserDoc.username} (${receiverId}) не в сети.`);
          }
          ws.send(JSON.stringify(messageToSendToClients)); 
          console.log(`[ChatSocketService] Сообщение (или подтверждение) отправлено отправителю ${senderUsername} (${senderId})`);

        } catch (msgError: any) {
          console.error(`[ChatSocketService] Ошибка обработки сообщения от ${senderUsername}:`, msgError);
          ws.send(JSON.stringify({ type: 'error', payload: msgError.message || 'Failed to process message' }));
        }
      });

    } catch (connectionError: any) {
      const userIdForLog = currentUserId || 'unknown (pre-auth)';
      const usernameForLog = currentUsername || 'unknown (pre-auth)';
      console.error(`[ChatSocketService] Критическая ошибка при установлении соединения WebSocket для пользователя ${usernameForLog} (ID: ${userIdForLog}):`, connectionError.message, connectionError.stack);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close(1011, 'Server error during connection setup');
      }
    }
  });

  console.log('[ChatSocketService] Обработчики событий WebSocket сервера настроены.');
};
