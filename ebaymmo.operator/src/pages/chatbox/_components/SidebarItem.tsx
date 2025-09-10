import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import Avatar from '@/assets/images/avatar.svg';
import { useState } from 'react';
import { useUserInfo } from '@/context/UserInfoContext';

interface Conversation {
    _id: string;
    type: string;
    participants: {
        _id: string;
        username: string;
        avatar: string;
    }[];
    groupName?: string;
    lastMessage: {
        _id: string;
        senderId: string;
        content: string;
        type?: string;
        status?: string;
        sender?: {
            username: string;
        };
    };
    createdAt: string;
    updatedAt: string;
}

interface SidebarItemProps {
    conversation?: Conversation;
    username: string;
    avatar?: string;
    isActive?: boolean;
    onClick: () => void;
    isCollapsed?: boolean;
    isUnread?: boolean;
    isSelf?: boolean;
}

export default function SidebarItem({
    conversation,
    username,
    avatar,
    isActive,
    onClick,
    isCollapsed,
    isUnread,
    isSelf
}: SidebarItemProps) {
    const [isHovered, setIsHovered] = useState(false);
    const { userInfo } = useUserInfo();

    const isGroup = conversation?.type === 'group';

    // Tạo tiêu đề hiển thị dựa trên loại cuộc trò chuyện
    const displayName = isGroup
        ? `Order ${conversation?.groupName}`
        : isSelf
          ? 'Ghi chú'
          : username;

    //console.log('SidebarItem - displayName:', displayName);
    // Tạo nội dung tin nhắn cuối cùng với tên người gửi (cho nhóm)
    const lastMessageContent = conversation?.lastMessage?.content || '';
    const lastMessageSender = conversation?.lastMessage?.sender?.username || '';
    const displayLastMessage =
        isGroup && lastMessageSender !== userInfo?.username
            ? `${lastMessageSender}: ${lastMessageContent}`
            : lastMessageContent;

    // Tạo hiển thị thời gian
    const getTimeDisplay = () => {
        if (!conversation) return '';
        try {
            const date = new Date(conversation.updatedAt);
            return formatDistanceToNow(date, { addSuffix: true, locale: vi });
        } catch (error) {
            return '';
        }
    };

    return (
        <div
            className={`px-4 py-2 cursor-pointer transition-colors duration-300 ${
                isActive ? 'bg-gray-100' : isHovered ? 'bg-gray-50' : ''
            }`}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center space-x-4">
                <div className="relative">
                    {isGroup ? (
                        // Avatar tùy chỉnh cho nhóm
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-500 font-bold">G</span>
                        </div>
                    ) : (
                        <img
                            src={avatar || Avatar}
                            alt={`${username}'s avatar`}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    )}
                    {isUnread && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
                            !
                        </div>
                    )}
                </div>

                {!isCollapsed && (
                    <div className="flex-1 overflow-hidden animate-slideInSlow">
                        <div className="flex justify-between items-start">
                            <h3
                                className={`font-semibold truncate ${
                                    isUnread ? 'font-bold' : ''
                                }`}
                            >
                                {displayName}
                            </h3>
                            {conversation && (
                                <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                    {getTimeDisplay()}
                                </span>
                            )}
                        </div>
                        {conversation && (
                            <p
                                className={`text-sm text-gray-500 truncate ${
                                    isUnread
                                        ? 'font-semibold text-gray-800'
                                        : ''
                                }`}
                            >
                                {displayLastMessage ||
                                    'Bắt đầu cuộc trò chuyện'}
                            </p>
                        )}
                        {isSelf && !conversation && (
                            <p className="text-sm text-gray-500 truncate">
                                Ghi chú và lưu trữ
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
