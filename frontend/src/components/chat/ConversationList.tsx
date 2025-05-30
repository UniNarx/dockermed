import React from 'react';
import { ConversationData, ChatParticipant } from '@/types/chat'; 
import Image from 'next/image';
import { UserCircle } from 'lucide-react';

interface ConversationListProps {
  conversations: ConversationData[];
  currentUserId: string;
  onSelectConversation: (conversation: ConversationData) => void;
  activeConversationId?: string | null;
  activeChatUsers: ChatParticipant[]; 
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentUserId,
  onSelectConversation,
  activeConversationId,
  activeChatUsers,
}) => {
  if (!conversations || conversations.length === 0) {
    return null; 
  }

  const onlineUserIds = new Set(activeChatUsers.map(u => u.id));

  return (
    <ul className="divide-y divide-white/10">
      {conversations.map((convo) => {
        const otherParticipant = convo.otherParticipant;
        const lastMsg = convo.lastMessage;
        const isActive = convo.conversationId === activeConversationId;
        const isOtherParticipantOnline = onlineUserIds.has(otherParticipant.id);

        const isLastMessageFromCurrentUser = lastMsg.senderId === currentUserId;
        const lastMessageText = isLastMessageFromCurrentUser
          ? `Вы: ${lastMsg.text}`
          : lastMsg.text;

        let displayTime = '';
        if (lastMsg.timestamp) {
          const msgDate = new Date(lastMsg.timestamp);
          const today = new Date();
          if (msgDate.toDateString() === today.toDateString()) {
            displayTime = msgDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
          } else {
            displayTime = msgDate.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
          }
        }

        return (
          <li key={convo.conversationId}>
            <button
              onClick={() => onSelectConversation(convo)}
              className={`w-full text-left p-3 hover:bg-white/10 transition-colors duration-150 focus:outline-none ${
                isActive ? 'bg-indigo-600/30' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 relative"> 
                  {otherParticipant.avatarUrl ? (
                    <Image
                      src={otherParticipant.avatarUrl}
                      alt={otherParticipant.username}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <UserCircle className={`w-10 h-10 ${isActive ? 'text-indigo-200' : 'text-gray-400'}`} />
                  )}
                  {isOtherParticipantOnline && (
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-gray-800/50"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm font-semibold truncate ${isActive ? 'text-white' : 'text-gray-100'}`}>
                      {otherParticipant.username}
                    </p>
                    <p className={`text-xs ${isActive ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {displayTime}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <p className={`text-xs truncate pr-2 ${isActive ? 'text-gray-300' : 'text-gray-400'} ${(!isLastMessageFromCurrentUser && convo.unreadCount > 0 && !isActive) ? 'font-bold text-white/90' : ''}`}>
                      {lastMessageText}
                    </p>
                    {convo.unreadCount > 0 && !isActive && (
                      <span className="flex-shrink-0 bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {convo.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default ConversationList;
