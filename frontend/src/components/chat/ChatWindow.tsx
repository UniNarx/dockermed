import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { ChatMessageData, ChatParticipant } from '@/types/chat';
import { Send, CornerDownLeft, ArrowUpCircle, UserCircle, AlertTriangle } from 'lucide-react'; 
import Image from 'next/image';

interface ChatWindowProps {
  messages: ChatMessageData[];
  currentUser: ChatParticipant;
  otherParticipant: ChatParticipant;
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  chatError?: string | null;
  onLoadMoreMessages?: () => void;
  hasMoreMessages?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  currentUser,
  otherParticipant,
  onSendMessage,
  isLoading,
  chatError,
  onLoadMoreMessages,
  hasMoreMessages,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null); 

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const lastMessage = messages[messages.length - 1];
        const isScrolledToBottom = scrollHeight - scrollTop <= clientHeight + 150; 

        if (messages.length > 0 && (!lastMessage || lastMessage.sender.id !== currentUser.id || isScrolledToBottom)) {
            if (messages.length <= 20 || isScrolledToBottom || (lastMessage && lastMessage.sender.id !== currentUser.id)) {
                 setTimeout(() => scrollToBottom("auto"), 100); 
            }
        }
    }
  }, [messages, currentUser.id]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };
  
  const handleScroll = () => {
    if (chatContainerRef.current && chatContainerRef.current.scrollTop === 0 && hasMoreMessages && onLoadMoreMessages && !isLoading) {
        onLoadMoreMessages();
    }
  };

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMoreMessages, onLoadMoreMessages, isLoading]);


  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-3 border-b border-white/10 bg-white/10 shadow-sm">
        {otherParticipant.avatarUrl ? (
            <Image src={otherParticipant.avatarUrl} alt={otherParticipant.username} width={36} height={36} className="rounded-full mr-3 object-cover"/>
        ) : (
            <UserCircle className="w-9 h-9 text-indigo-300 mr-3" />
        )}
        <h2 className="text-lg font-semibold text-white">{otherParticipant.username}</h2>
      </div>

      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-br from-gray-700/10 via-gray-800/20 to-gray-900/30">
        {isLoading && messages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-400">Загрузка сообщений...</p>
          </div>
        )}
        {chatError && (
            <div className="p-3 bg-red-500/20 text-red-300 rounded-md flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2"/>
                {chatError}
            </div>
        )}
        {hasMoreMessages && onLoadMoreMessages && (
             <div className="text-center">
                <button
                    onClick={onLoadMoreMessages}
                    disabled={isLoading}
                    className="text-indigo-300 hover:text-indigo-200 text-sm py-1 px-3 rounded-full hover:bg-white/10 transition"
                >
                    {isLoading ? 'Загрузка...' : 'Загрузить еще'}
                </button>
            </div>
        )}
        {messages.map((msg, index) => {
          const isCurrentUserSender = msg.sender.id === currentUser.id;
          const messageDate = new Date(msg.timestamp);
          const displayTime = messageDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

          let showDateSeparator = false;
          if (index === 0) {
            showDateSeparator = true;
          } else {
            const prevMessageDate = new Date(messages[index - 1].timestamp);
            if (messageDate.toDateString() !== prevMessageDate.toDateString()) {
              showDateSeparator = true;
            }
          }

          return (
            <React.Fragment key={msg._id || `msg-${index}`}>
              {showDateSeparator && (
                <div className="text-center my-3">
                  <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-full">
                    {messageDate.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              )}
              <div className={`flex ${isCurrentUserSender ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs lg:max-w-md px-3 py-2 rounded-xl shadow ${
                    isCurrentUserSender
                      ? 'bg-indigo-500 text-white rounded-br-none'
                      : 'bg-gray-600 text-gray-100 rounded-bl-none'
                  }`}
                >
                  {!isCurrentUserSender && (
                    <p className="text-xs font-semibold text-indigo-300 mb-0.5">
                      {msg.sender.username}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.message || msg.text}</p>
                  <p className={`text-xs mt-1 ${isCurrentUserSender ? 'text-indigo-200 text-right' : 'text-gray-400 text-left'}`}>
                    {displayTime}
                    {isCurrentUserSender && msg.read && ( 
                        <span className="ml-1">✓✓</span>
                    )}
                     {isCurrentUserSender && !msg.read && msg._id && !msg._id.startsWith('temp-') && ( 
                        <span className="ml-1">✓</span>
                    )}
                  </p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-white/10 bg-white/10">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Введите сообщение..."
            className="flex-1 bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:outline-none transition"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
