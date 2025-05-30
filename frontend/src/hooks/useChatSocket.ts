import { useState, useEffect, useCallback, useRef } from 'react';
import { getTokenFromStorage, getDecodedToken } from '@/lib/authUtils';
import {
  ChatMessageData,
  WebSocketIncomingMessage,
  NewMessagePayload,
  ErrorPayload,
  ActiveUserListPayload,
  UserJoinedPayload,
  UserLeftPayload,
  ChatParticipant
} from '@/types/chat';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws/chat';

interface UseChatSocketProps {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onNewMessage?: (message: NewMessagePayload) => void;
  onMessageSentConfirmation?: (message: NewMessagePayload) => void;
  onChatError?: (error: ErrorPayload) => void;
  onInfoMessage?: (payload: any) => void;
  onActiveUserList?: (users: ChatParticipant[]) => void; 
  onUserJoined?: (user: ChatParticipant) => void;     
  onUserLeft?: (payload: UserLeftPayload) => void;    
}

export const useChatSocket = (props: UseChatSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 5000;
  const connectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  }, [props]);


  useEffect(() => {
    const token = getTokenFromStorage();
    if (token) {
      const decoded = getDecodedToken(token);
      setCurrentUserId(decoded?.userId || null);
    } else {
        setCurrentUserId(null);
    }
  }, []);

  const connect = useCallback(() => {
    if (!currentUserId) {
      console.log('[useChatSocket] connect: Aborted, no currentUserId.');
      return;
    }
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log(`[useChatSocket] connect: WebSocket already in state ${wsRef.current.readyState}. No new connection initiated.`);
      return;
    }
    if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
    }

    const token = getTokenFromStorage();
    if (!token) {
      console.error('[useChatSocket] connect: Token missing, cannot connect.');
      return;
    }

    console.log(`[useChatSocket] connect: Attempting connection to ${WS_URL} for user ${currentUserId}`);
    const socket = new WebSocket(`${WS_URL}?token=${token}`);
    wsRef.current = socket;

    socket.onopen = () => {
      console.log('[useChatSocket] socket.onopen: WebSocket connected.');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      propsRef.current.onOpen?.();
    };

    socket.onmessage = (event) => {
      try {
        const parsedMessage = JSON.parse(event.data as string) as WebSocketIncomingMessage;
        console.log('[useChatSocket] socket.onmessage: Received message:', parsedMessage);
        switch (parsedMessage.type) {
          case 'newMessage':
            propsRef.current.onNewMessage?.(parsedMessage.payload as NewMessagePayload);
            break;
          case 'messageSentConfirmation':
            propsRef.current.onMessageSentConfirmation?.(parsedMessage.payload as NewMessagePayload);
            break;
          case 'error':
            console.error('[useChatSocket] socket.onmessage: Chat server error:', parsedMessage.payload);
            propsRef.current.onChatError?.(parsedMessage.payload as ErrorPayload);
            break;
          case 'info':
            console.log('[useChatSocket] socket.onmessage: Info message from server:', parsedMessage.payload);
            propsRef.current.onInfoMessage?.(parsedMessage.payload);
            break;
          case 'activeUserList': 
            propsRef.current.onActiveUserList?.(parsedMessage.payload as ChatParticipant[]);
            break;
          case 'userJoined':    
            propsRef.current.onUserJoined?.(parsedMessage.payload as ChatParticipant);
            break;
          case 'userLeft':   
            propsRef.current.onUserLeft?.(parsedMessage.payload as UserLeftPayload);
            break;
          default:
            console.warn('[useChatSocket] socket.onmessage: Unknown message type:', parsedMessage);
        }
      } catch (error) {
        console.error('[useChatSocket] socket.onmessage: Error parsing message:', error);
      }
    };

    socket.onerror = (event) => {
      console.error('[useChatSocket] socket.onerror: WebSocket error:', event);
      setIsConnected(false);
      propsRef.current.onError?.(event);
    };

    socket.onclose = (event) => {
      console.log(`[useChatSocket] socket.onclose: WebSocket disconnected. Code: ${event.code}, Reason: ${event.reason}`);
      setIsConnected(false);
      if (wsRef.current === socket) {
        wsRef.current = null;
      }
      propsRef.current.onClose?.(event);

      const noReconnectCodes = [1000, 1008, 4001];
      if (reconnectAttemptsRef.current < maxReconnectAttempts && !noReconnectCodes.includes(event.code)) {
        reconnectAttemptsRef.current++;
        console.log(`[useChatSocket] socket.onclose: Attempting reconnect #${reconnectAttemptsRef.current} in ${reconnectInterval / 1000}s...`);
        const capturedCurrentUserId = currentUserId;
        setTimeout(() => {
            if (capturedCurrentUserId) {
                console.log(`[useChatSocket] socket.onclose: Reconnect timer fired for user ${capturedCurrentUserId}. Calling connect.`);
                connect();
            } else {
                console.log('[useChatSocket] socket.onclose: Reconnect aborted, currentUserId is null.');
            }
        }, reconnectInterval);
      } else {
        console.log(`[useChatSocket] socket.onclose: Reconnect not attempted. Reason: Max attempts or code (${event.code}) in noReconnectCodes.`);
      }
    };
  }, [currentUserId]);

  const disconnect = useCallback(() => {
    if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
        connectTimeoutRef.current = null;
        console.log('[useChatSocket] disconnect: Cleared pending connect timeout.');
    }
    if (wsRef.current) {
      console.log('[useChatSocket] disconnect: Closing WebSocket...');
      reconnectAttemptsRef.current = maxReconnectAttempts;
      wsRef.current.close(1000, 'User initiated disconnect');
    } else {
        console.log('[useChatSocket] disconnect: No active WebSocket to close.');
    }
  }, []);

  useEffect(() => {
    if (currentUserId) {
      console.log(`[useChatSocket] useEffect [currentUserId]: User ID is ${currentUserId}. Scheduling initial connection.`);
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
      connectTimeoutRef.current = setTimeout(() => {
        console.log('[useChatSocket] useEffect [currentUserId]: Initial connect timer fired. Calling connect().');
        connect();
      }, 200);
    } else {
      console.log('[useChatSocket] useEffect [currentUserId]: currentUserId is null. Ensuring disconnection.');
      disconnect();
    }

    return () => {
      console.log(`[useChatSocket] useEffect [currentUserId] cleanup for UserID: ${currentUserId}. Calling disconnect.`);
      disconnect();
    };
  }, [currentUserId, connect, disconnect]);

  const sendMessage = useCallback((receiverId: string, text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = { receiverId, text };
      wsRef.current.send(JSON.stringify(message));
      console.log('[useChatSocket] sendMessage: Message sent:', message);
    } else {
      console.error('[useChatSocket] sendMessage: Cannot send message, WebSocket not OPEN. State:', wsRef.current?.readyState);
    }
  }, []);

  return {
    isConnected,
    sendMessage,
    currentUserId,
  };
};
