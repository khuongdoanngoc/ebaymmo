import { useEffect, useState } from 'react';
import SidebarItem from './SidebarItem';
import { useChatContext } from '../_contexts/ChatContext';
import { useUserInfo } from '@/contexts/UserInfoContext';
import { Conversation as BaseConversation } from '../types/chatbox.types';
import { useSocketContext } from '@/contexts/SocketConnectionContext';

// ----- INTERFACES -----
interface Participant {
    _id: string;
    username: string;
    avatar?: string;
}

// Extend để thêm trạng thái cho tin nhắn cuối cùng
interface Conversation extends Omit<BaseConversation, 'lastMessage'> {
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
}

interface ChatSidebarProps {
    onConversationClick: (conversation: BaseConversation | undefined) => void;
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export default function ChatSidebar({
    onConversationClick,
    isCollapsed,
    setIsCollapsed
}: ChatSidebarProps) {
    // ----- CONTEXT & STATE -----
    const { socket } = useSocketContext();
    const { conversations, currentConversation, isLoading } = useChatContext();
    const { userInfo } = useUserInfo();
    const [isMobile, setIsMobile] = useState(false);

    // Type casting để có thêm thông tin lastMessage status
    const typedConversations = conversations as unknown as Conversation[];
    const typedCurrentConversation =
        currentConversation as unknown as Conversation | null;

    // ----- RESPONSIVE HANDLING -----
    // Kiểm tra kích thước màn hình
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    return (
        <div
            className={`border-r h-full border-gray-200 bg-gray-50 transition-all duration-700 ease-in-out ${
                isCollapsed
                    ? 'w-[300px]'
                    : 'w-[100%] md:w-[250px] lg:w-[400px] xl:w-[550px]'
            } ${
                isCollapsed
                    ? 'max-w-[120px] max-sm:w-[100px]'
                    : 'max-w-[120px] md:max-w-[250px] lg:max-w-[400px] xl:max-w-[550px]'
            } ${isMobile ? 'w-full max-w-full' : ''}`}
        >
            {/* Header với nút tạo chat và thu gọn */}
            <div className="p-8 border-b border-gray-200 flex justify-between items-center h-[113px] max-lg:h-[97px] max-md:h-[73px] max-md:p-4">
                {(!isCollapsed || isMobile) && (
                    <h2 className="text-3xl font-semibold animate-slideInSlow mr-auto md:text-xl max-md:text-lg">
                        Tất cả
                    </h2>
                )}
                <div className="flex items-center gap-2">
                    <button
                        className="p-2 transition-transform duration-300 hover:scale-110 hidden md:block"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <img
                            src="/images/toggle.svg"
                            alt="Toggle sidebar"
                            className={`w-10 h-10 transition-transform duration-700 ${
                                isCollapsed ? 'rotate-180' : 'rotate-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Danh sách cuộc trò chuyện */}
            <div className="overflow-y-auto h-[calc(100%-113px)] transition-all duration-300 ease-in-out overflow-x-hidden">
                {/* Chat với chính mình */}
                <div className="transition-all duration-300 ease-in-out transform hover:scale-[1.02]">
                    <SidebarItem
                        isActive={
                            typedCurrentConversation?.participants[0]
                                .username === userInfo?.username
                        }
                        username={userInfo?.username || ''}
                        avatar={userInfo?.images || '/images/avatar.svg'}
                        isSelf={true}
                        onClick={() => {
                            // Tìm cuộc trò chuyện với chính mình
                            const isSelfConversationAvailable =
                                typedConversations.find(
                                    (convo) => convo.type === 'self'
                                );
                            if (isSelfConversationAvailable) {
                                onConversationClick(
                                    isSelfConversationAvailable as unknown as BaseConversation
                                );
                            } else {
                                if (socket && userInfo?.username) {
                                    socket.emit('createConversation', {
                                        username: userInfo?.username
                                    });
                                }
                            }
                        }}
                        isCollapsed={isCollapsed && !isMobile}
                    />
                </div>

                {/* Hiển thị skeleton khi đang tải */}
                {isLoading && (
                    <>
                        {[1, 2, 3, 4, 5].map((item) => (
                            <div
                                key={`skeleton-${item}`}
                                className="px-4 py-2 animate-pulse"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full" />
                                    {(!isCollapsed || isMobile) && (
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {/* Danh sách cuộc trò chuyện (trừ self chat) */}
                {!isLoading &&
                    typedConversations
                        .filter((convo) => convo.type !== 'self')
                        .sort((a, b) => {
                            // Sắp xếp theo thời gian cập nhật mới nhất
                            return (
                                new Date(b.updatedAt).getTime() -
                                new Date(a.updatedAt).getTime()
                            );
                        })
                        .map((convo, index) => {
                            const otherParticipant = convo.participants?.find(
                                (p: Participant) =>
                                    p.username !== userInfo?.username
                            );
                            return (
                                <div
                                    key={index}
                                    className={
                                        'transition-all duration-300 ease-in-out transform hover:scale-[1.02]'
                                    }
                                    style={{
                                        animationDelay: `${index * 50}ms`
                                    }}
                                >
                                    <SidebarItem
                                        conversation={convo}
                                        username={
                                            otherParticipant?.username ||
                                            'Unknown'
                                        }
                                        avatar={otherParticipant?.avatar || ''}
                                        isActive={
                                            typedCurrentConversation?._id ===
                                            convo._id
                                        }
                                        onClick={() => {
                                            onConversationClick(
                                                convo as unknown as BaseConversation
                                            );
                                        }}
                                        isCollapsed={isCollapsed && !isMobile}
                                        isUnread={
                                            convo.lastMessage?.status !==
                                                'read' &&
                                            convo.lastMessage?.sender
                                                ?.username !==
                                                userInfo?.username
                                        }
                                    />
                                </div>
                            );
                        })}
            </div>
        </div>
    );
}
