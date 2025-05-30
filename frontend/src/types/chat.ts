export interface ChatParticipant {
  _id: string; 
  id: string; 
  username: string;
  avatarUrl?: string;
  isOnline?: boolean; 
}

export interface ChatMessageData {
  _id: string;
  id: string;
  sender: ChatParticipant;
  receiver: ChatParticipant;
  message: string;
  text?: string;
  timestamp: string | Date;
  read?: boolean;
  conversationId: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ConversationData {
  conversationId: string;
  lastMessage: {
    _id: string;
    text: string;
    timestamp: string | Date;
    senderId: string;
    receiverId: string;
    read?: boolean;
  };
  otherParticipant: ChatParticipant;
  unreadCount: number;
}
export interface WebSocketOutgoingMessage {
  receiverId: string;
  text: string;
}

export interface WebSocketIncomingMessage {
  type:
    | 'newMessage'
    | 'error'
    | 'messageSentConfirmation'
    | 'historyLoaded'
    | 'conversationsLoaded'
    | 'userStatus' 
    | 'info'
    | 'activeUserList' 
    | 'userJoined'      
    | 'userLeft';       
  payload: any;
}

export interface NewMessagePayload extends ChatMessageData {}

export interface ErrorPayload {
  message: string;
  details?: any;
}

export interface ActiveUserListPayload {
  users: ChatParticipant[]; 
}

export interface UserJoinedPayload extends ChatParticipant {} 

export interface UserLeftPayload {
  userId: string;
}


export interface ChatHistoryResponse {
  messages: ChatMessageData[];
  currentPage: number;
  totalPages: number;
  totalMessages: number;
}
