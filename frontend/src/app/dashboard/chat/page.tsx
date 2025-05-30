'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useChatSocket } from '@/hooks/useChatSocket';
import {
  ConversationData,
  ChatMessageData,
  ChatParticipant,
  NewMessagePayload,
  ErrorPayload,
  ChatHistoryResponse,
  UserLeftPayload
} from '@/types/chat';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import { getTokenFromStorage, getDecodedToken } from '@/lib/authUtils';
import { MessageSquare, Users, XCircle, AlertTriangle, CircleUser, UserCircle } from 'lucide-react';

const glassCard = "bg-white/5 backdrop-blur-md border border-white/10 rounded-xl shadow-xl";
const mainChatContainer = `flex flex-col md:flex-row h-[calc(100vh-8rem)] ${glassCard} overflow-hidden`;
const conversationListContainer = "w-full md:w-1/3 lg:w-1/4 border-r border-white/10 flex flex-col";
const listScrollableContainer = "flex-1 overflow-y-auto";
const chatWindowContainer = "flex-1 flex flex-col bg-white/5";
const loadingErrorStyles = "flex items-center justify-center h-full text-gray-400 p-4";

export default function ChatPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<ChatParticipant | null>(null);
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const [activeChatUsers, setActiveChatUsers] = useState<ChatParticipant[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationData | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const messagesPerPage = 20;
  
  const initialConversationsFetchedRef = useRef(false);
  const isFetchingConversationsRef = useRef(false);
  const initialSocketConnectionDoneRef = useRef(false);
  const isFetchingMessagesRef = useRef(false);

  useEffect(() => {
    const token = getTokenFromStorage();
    if (!token) {
      router.push('/public/login');
      return;
    }
    const decoded = getDecodedToken(token);
    if (decoded && decoded.userId && decoded.username) {
      setCurrentUser(prevUser => {
        if (!prevUser || prevUser.id !== decoded.userId) {
          initialConversationsFetchedRef.current = false;
          initialSocketConnectionDoneRef.current = false;
          return { _id: decoded.userId, id: decoded.userId, username: decoded.username };
        }
        return prevUser;
      });
    } else {
      router.push('/public/login');
    }
  }, [router]);

  const fetchConversations = useCallback(async (forceRefresh = false) => {
    if (!currentUser) return;
    if (isFetchingConversationsRef.current && !forceRefresh) return;
    if (!forceRefresh && initialConversationsFetchedRef.current) return;

    isFetchingConversationsRef.current = true;
    setIsLoadingConversations(true);
    setApiError(null);
    try {
      const convos = await apiFetch<ConversationData[]>('/chat/conversations');
      setConversations(convos || []);
      initialConversationsFetchedRef.current = true;
    } catch (err: any) {
      setApiError(err.message || "Не удалось загрузить диалоги.");
    } finally {
      setIsLoadingConversations(false);
      isFetchingConversationsRef.current = false;
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && !initialConversationsFetchedRef.current && !isFetchingConversationsRef.current) {
      fetchConversations();
    }
  }, [currentUser, fetchConversations]);

  const handleNewMessage = useCallback((newMessage: NewMessagePayload) => {
    if (activeConversation?.conversationId === newMessage.conversationId || 
        (activeConversation?.otherParticipant._id === newMessage.sender.id && currentUser?.id === newMessage.receiver.id) ||
        (activeConversation?.otherParticipant._id === newMessage.receiver.id && currentUser?.id === newMessage.sender.id)
    ) {
        setMessages(prevMessages => {
          if (prevMessages.find(msg => msg._id === newMessage._id)) return prevMessages;
          return [...prevMessages, newMessage];
        });
    }
    setConversations(prevConvos => {
        let conversationExists = false;
        const updatedConvos = prevConvos.map(convo => {
          if (convo.conversationId === newMessage.conversationId) {
            conversationExists = true;
            return {
              ...convo,
              lastMessage: {
                _id: newMessage._id, text: newMessage.message || newMessage.text || '',
                timestamp: newMessage.timestamp, senderId: newMessage.sender.id,
                receiverId: newMessage.receiver.id, read: newMessage.sender.id === currentUser?.id ? true : newMessage.read
              },
              unreadCount: (activeConversation?.conversationId !== newMessage.conversationId && newMessage.sender.id !== currentUser?.id)
                           ? (convo.unreadCount || 0) + 1
                           : (activeConversation?.conversationId === newMessage.conversationId ? 0 : convo.unreadCount)
            };
          }
          return convo;
        });
        if (!conversationExists && currentUser) {
            const otherParticipantIsSender = newMessage.sender.id !== currentUser.id;
            const newConvo: ConversationData = {
                conversationId: newMessage.conversationId,
                lastMessage: {
                  _id: newMessage._id, text: newMessage.message || newMessage.text || '',
                  timestamp: newMessage.timestamp, senderId: newMessage.sender.id,
                  receiverId: newMessage.receiver.id, read: newMessage.sender.id === currentUser?.id ? true : newMessage.read
                },
                otherParticipant: otherParticipantIsSender ? newMessage.sender : newMessage.receiver,
                unreadCount: otherParticipantIsSender ? 1 : 0,
            };
            return [newConvo, ...updatedConvos.filter(c => c.conversationId !== newMessage.conversationId)];
        }
        const convoIndex = updatedConvos.findIndex(c => c.conversationId === newMessage.conversationId);
        if (convoIndex > -1) {
          const movedConvo = updatedConvos.splice(convoIndex, 1)[0];
          return [movedConvo, ...updatedConvos];
        }
        return updatedConvos;
    });
  }, [activeConversation, currentUser]);

  const handleSocketChatError = useCallback((error: ErrorPayload) => setChatError(`Ошибка WebSocket: ${error.message}`), []);
  const handleInfoMessage = useCallback((payload: any) => console.log("[ChatPage] Info from server:", payload), []);
  const handleActiveUserList = useCallback((users: ChatParticipant[]) => {
    if (currentUser) setActiveChatUsers(users.filter(u => u.id !== currentUser.id));
    else setActiveChatUsers(users);
  }, [currentUser]);
  const handleUserJoined = useCallback((user: ChatParticipant) => {
    if (currentUser && user.id === currentUser.id) return;
    setActiveChatUsers(prevUsers => prevUsers.find(u => u.id === user.id) ? prevUsers : [...prevUsers, user]);
  }, [currentUser]);
  const handleUserLeft = useCallback((payload: UserLeftPayload) => {
    setActiveChatUsers(prevUsers => prevUsers.filter(u => u.id !== payload.userId));
  }, []);

  const handleSocketOpen = useCallback(() => {
    setChatError(null);
    if (currentUser && !initialSocketConnectionDoneRef.current) {
      fetchConversations(true);
      initialSocketConnectionDoneRef.current = true;
    } else if (currentUser) {
      fetchConversations(true); 
    }
  }, [currentUser, fetchConversations]);

  const handleSocketClose = useCallback((event: CloseEvent) => console.log(`[ChatPage] WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`), []);

  const { isConnected, sendMessage } = useChatSocket({
    onNewMessage: handleNewMessage, onChatError: handleSocketChatError,
    onInfoMessage: handleInfoMessage, onOpen: handleSocketOpen,
    onClose: handleSocketClose, onActiveUserList: handleActiveUserList,
    onUserJoined: handleUserJoined, onUserLeft: handleUserLeft,
  });

  const fetchMessages = useCallback(async (otherParticipantId: string, pageToLoad: number = 1, loadMore = false) => {
    if (!otherParticipantId) return;
    if (isFetchingMessagesRef.current && !loadMore) {
        console.log("[ChatPage] fetchMessages: Skipping, already fetching initial messages for this participant.");
        return;
    }
    if (isFetchingMessagesRef.current && loadMore) {
        console.log("[ChatPage] fetchMessages: Skipping loadMore, a message load is already in progress.");
        return;
    }

    isFetchingMessagesRef.current = true;
    if (!loadMore) {
      setIsLoadingMessages(true);
      setMessages([]); 
    }
    setApiError(null);
    try {
      const response = await apiFetch<ChatHistoryResponse>(`/chat/history/${otherParticipantId}?page=${pageToLoad}&limit=${messagesPerPage}`);
      const newMessages = response.messages || [];
      
      setMessages(prev => {
        const existingMessages = loadMore ? prev : [];
        const combined = [...newMessages, ...existingMessages];
        const uniqueMessages = Array.from(new Map(combined.map(msg => [msg._id, msg])).values());
        return uniqueMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      });

      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages || 1);

      setConversations(prevConvos => 
        prevConvos.map(c => 
          c.otherParticipant._id === otherParticipantId ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch (err: any) {
      setApiError(err.message || "Не удалось загрузить сообщения.");
      if (!loadMore) setMessages([]);
    } finally {
      isFetchingMessagesRef.current = false;
      setIsLoadingMessages(false);
    }
  }, [messagesPerPage]);

  useEffect(() => {
    const currentOtherParticipantId = activeConversation?.otherParticipant._id;
    if (currentOtherParticipantId) {
      console.log(`[ChatPage] useEffect [activeConversation.otherParticipant._id]: Active conversation changed to user ID ${currentOtherParticipantId}. Fetching messages.`);
      setCurrentPage(1); 
      setTotalPages(1);
      fetchMessages(currentOtherParticipantId, 1, false);
    } else {
      setMessages([]);
    }
  }, [activeConversation?.otherParticipant._id, fetchMessages]); 

  const handleSelectConversation = useCallback((conversationOrUser: ConversationData | ChatParticipant) => {
    if (!currentUser) return;
    let targetConversation: ConversationData | null = null;

    if ('conversationId' in conversationOrUser) {
        targetConversation = conversationOrUser as ConversationData;
    } else {
        const user = conversationOrUser as ChatParticipant;
        const existingConvo = conversations.find(c => c.otherParticipant._id === user._id);
        if (existingConvo) {
            targetConversation = existingConvo;
        } else {
            targetConversation = {
                conversationId: [currentUser.id, user._id].sort().join('_'),
                otherParticipant: user,
                lastMessage: { _id: `temp_${Date.now()}`, text: `Начните диалог с ${user.username}`, timestamp: new Date(), senderId: '', receiverId: '' },
                unreadCount: 0,
            };
        }
    }
    
    if (targetConversation) {
        if (activeConversation?.conversationId === targetConversation.conversationId && 
            (!targetConversation.unreadCount || targetConversation.unreadCount === 0) &&
            messages.length > 0 
        ) {
             if (targetConversation.unreadCount > 0) {
                setConversations(prevConvos =>
                    prevConvos.map(c =>
                        c.conversationId === targetConversation?.conversationId ? { ...c, unreadCount: 0 } : c
                    )
                );
            }
            return;
        }
        setActiveConversation(targetConversation);
        if (targetConversation.unreadCount > 0) {
            setConversations(prevConvos =>
                prevConvos.map(c =>
                    c.conversationId === targetConversation?.conversationId ? { ...c, unreadCount: 0 } : c
                )
            );
        }
    }
  }, [activeConversation, currentUser, conversations, messages.length]);

  const handleSendMessage = (text: string) => {
    if (!activeConversation || !currentUser) {
      setApiError("Не выбран диалог или пользователь не определен."); return;
    }
    if (!text.trim()) return;
    sendMessage(activeConversation.otherParticipant._id, text.trim());
  };
  
  const handleLoadMoreMessages = () => {
    if (activeConversation && currentPage < totalPages && !isFetchingMessagesRef.current) {
        fetchMessages(activeConversation.otherParticipant._id, currentPage + 1, true);
    }
  };

  if (!currentUser) {
    return <div className={loadingErrorStyles}>Аутентификация...</div>;
  }

  return (
    <div className="p-4 md:p-6 min-h-screen !mt-16 md:!mt-[4.5rem]">
      <div className={mainChatContainer}>
        <div className={conversationListContainer}>
          <div className="p-3 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <Users className="w-5 h-5 mr-2 text-indigo-300" />
              Диалоги
            </h2>
          </div>
          <div className={listScrollableContainer}>
            {isLoadingConversations && conversations.length === 0 ? (
              <div className={loadingErrorStyles}>Загрузка диалогов...</div>
            ) : apiError && conversations.length === 0 ? (
              <div className={`${loadingErrorStyles} text-red-300`}>{apiError}</div>
            ) : conversations.length === 0 && activeChatUsers.length === 0 ? (
              <div className={loadingErrorStyles}>Нет диалогов.</div>
            ) : (
              <ConversationList
                conversations={conversations}
                currentUserId={currentUser.id}
                onSelectConversation={handleSelectConversation}
                activeConversationId={activeConversation?.conversationId}
                activeChatUsers={activeChatUsers}
              />
            )}
          </div>
          <div className="p-3 border-t border-white/10 mt-auto">
            <h3 className="text-md font-semibold text-white flex items-center mb-2">
                <CircleUser className="w-5 h-5 mr-2 text-green-400" />
                Сейчас в сети ({activeChatUsers.length})
            </h3>
          </div>
          <div className={`${listScrollableContainer} max-h-48`}>
             {activeChatUsers.length === 0 && !isLoadingConversations && (
                <p className="p-3 text-xs text-gray-400">Никого нет в сети.</p>
             )}
            {activeChatUsers.map(user => (
                <button
                    key={user.id}
                    onClick={() => handleSelectConversation(user)}
                    className={`w-full text-left p-2 hover:bg-white/10 transition-colors duration-150 focus:outline-none flex items-center space-x-2 ${
                        activeConversation?.otherParticipant._id === user.id ? 'bg-indigo-600/20' : ''
                    }`}
                >
                    <UserCircle className="w-6 h-6 text-green-300 flex-shrink-0" />
                    <span className="text-xs text-gray-200 truncate">{user.username}</span>
                </button>
            ))}
          </div>
           {!isConnected && (
                <p className="p-3 text-xs text-yellow-400 flex items-center border-t border-white/10">
                    <AlertTriangle size={14} className="mr-1"/> WebSocket отключен.
                </p>
            )}
            {chatError && <p className="p-3 text-xs text-red-400 flex items-center border-t border-white/10"><XCircle size={14} className="mr-1"/>{chatError}</p>}
        </div>

        <div className={chatWindowContainer}>
          {activeConversation ? (
            <ChatWindow
              messages={messages}
              currentUser={currentUser}
              otherParticipant={activeConversation.otherParticipant}
              onSendMessage={handleSendMessage}
              isLoading={isLoadingMessages}
              chatError={apiError}
              onLoadMoreMessages={handleLoadMoreMessages}
              hasMoreMessages={currentPage < totalPages}
            />
          ) : (
            <div className={`${loadingErrorStyles} flex-col text-center`}>
              <MessageSquare className="w-16 h-16 mb-4 text-gray-500" />
              <p className="text-lg text-gray-300">Выберите диалог или пользователя в сети.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
