import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';
import { useChatContext } from '../_contexts/ChatContext';
import { useUserInfo } from '@/contexts/UserInfoContext';

// ----- INTERFACES -----
interface UserStatus {
    [userId: string]: {
        status: 'online' | 'away' | 'busy' | 'offline';
        lastSeen: number | null;
    };
}

interface SidebarItemProps {
    conversation?: any;
    username: string;
    avatar: string;
    isActive: boolean;
    onClick: () => void;
    isSelf?: boolean;
    isCollapsed: boolean;
    isUnread?: boolean;
}

export default function SidebarItem({
    conversation,
    username,
    avatar,
    isActive,
    onClick,
    isSelf = false,
    isCollapsed,
    isUnread = false
}: SidebarItemProps) {
    // ----- CONTEXT & STATE -----
    const { userStatuses, formatLastSeen } = useChatContext();
    const { userInfo } = useUserInfo();

    // ----- DERIVED DATA -----
    const isGroup = conversation?.type === 'group';
    // Lấy ID người dùng từ cuộc trò chuyện để kiểm tra trạng thái online
    const userId = conversation?.participants?.find(
        (p: any) => p.username === username
    )?._id;

    // Lấy trạng thái online của người dùng
    const userStatus = userId ? userStatuses[userId] : null;

    // Format group name to show other participants' names
    const getGroupDisplayName = () => {
        if (!isGroup || !conversation?.participants || !userInfo)
            return 'Group';

        // Filter out current user and get other participants' usernames
        const otherParticipants = conversation.participants
            .filter((p: any) => p.username !== userInfo.username)
            .map((p: any) => p.username);

        if (otherParticipants.length === 0) return 'Group';

        // If custom group name is set and not empty, use it instead
        if (conversation?.name && conversation.name.trim() !== '') {
            return conversation.name;
        }

        // Display up to 3 names and indicate if there are more
        if (otherParticipants.length <= 3) {
            return otherParticipants.join(', ');
        } else {
            return `${otherParticipants.slice(0, 3).join(', ')} +${otherParticipants.length - 3}`;
        }
    };

    // Get the display name for the conversation
    const displayName = isGroup
        ? getGroupDisplayName()
        : isSelf
          ? 'My Notes'
          : username;

    return (
        <div
            className={`flex items-center gap-4 p-6 cursor-pointer transition-colors hover:bg-gray-100 ${
                isActive ? 'bg-[var(--Primary-100,#E8FFEF)]' : ''
            }`}
            onClick={onClick}
        >
            {/* Avatar với chỉ báo trạng thái */}
            <div className="relative w-[50px] h-[50px] max-md:w-[60px] max-md:h-[60px] md:w-[50px] md:h-[50px] lg:w-[70px] lg:h-[70px] flex-shrink-0">
                {isGroup ? (
                    <div className="w-full h-full rounded-full bg-[#ECF0F1] flex items-center justify-center">
                        <img
                            src={avatar || '/images/group-avatar.svg'}
                            alt={displayName}
                            className="w-full h-full rounded-full object-cover p-2 md:p-3 lg:p-4"
                        />
                        {/* Group indicator icon */}
                        <div className="absolute top-0 right-0 bg-white rounded-full p-1 shadow-sm">
                            <img
                                src="/images/group-team-svgrepo-com.svg"
                                alt="Group"
                                className="w-3 h-3 max-md:w-4 max-md:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4"
                            />
                        </div>
                    </div>
                ) : (
                    <img
                        src={avatar || '/images/avatar.svg'}
                        alt={username}
                        className="w-full h-full rounded-full object-cover bg-[url('/path-to-image')] bg-[50%] bg-contain bg-no-repeat bg-[#ECF0F1] p-2 md:p-3 lg:p-4"
                    />
                )}
                {/* Chỉ báo trạng thái online (chỉ hiển thị với người dùng khác, không phải bản thân và không phải nhóm) */}
                {!isSelf && !isGroup && userId && (
                    <div
                        className={`absolute bottom-0 right-0 w-3 h-3 max-md:w-4 max-md:h-4 md:w-3 md:h-3 lg:w-4 lg:h-4 border-2 border-white rounded-full ${
                            userStatus?.status === 'online'
                                ? 'bg-green-500'
                                : userStatus?.status === 'away'
                                  ? 'bg-yellow-500'
                                  : userStatus?.status === 'busy'
                                    ? 'bg-red-500'
                                    : 'bg-gray-400'
                        }`}
                        title={
                            userStatus?.status === 'offline' &&
                            userStatus?.lastSeen
                                ? `Last seen ${formatLastSeen(userStatus.lastSeen)}`
                                : userStatus?.status || 'offline'
                        }
                    />
                )}
            </div>

            {/* Hiển thị tối giản khi sidebar thu gọn */}
            {isCollapsed && (
                <div className="flex-1 min-w-0">
                    <h3
                        className={`text-xl ${isUnread ? 'font-bold' : 'font-medium'} text-gray-900 truncate hidden md:block`}
                    >
                        {displayName}
                    </h3>
                </div>
            )}

            {/* Hiển thị đầy đủ khi sidebar mở rộng */}
            {!isCollapsed && (
                <div className="flex-1 min-w-0">
                    {/* Tên người dùng hoặc tên nhóm */}
                    <h3
                        className={`${isUnread ? 'font-bold' : 'font-medium'} text-gray-900 truncate text-lg max-md:text-base`}
                    >
                        {displayName}
                    </h3>

                    {/* Tin nhắn cuối cùng */}
                    {conversation?.lastMessage && (
                        <p
                            className={`text-sm ${isUnread ? 'font-semibold text-gray-700' : 'font-normal text-gray-500'} truncate max-md:text-xs`}
                        >
                            {conversation.lastMessage.type === 'image'
                                ? '🖼️ Sent an image'
                                : conversation.lastMessage.type === 'video'
                                  ? '🎥 Sent a video'
                                  : isGroup
                                    ? `${conversation.lastMessage.sender?.username || 'Someone'}: ${conversation.lastMessage.content}`
                                    : conversation.lastMessage.sender
                                            ?.username === userInfo?.username
                                      ? `You: ${conversation.lastMessage.content}`
                                      : conversation.lastMessage.content}
                        </p>
                    )}

                    {/* Hiển thị trạng thái hoặc thời gian online cuối cùng (chỉ hiển thị với người dùng, không hiển thị với nhóm) */}
                    {!isSelf &&
                        !isGroup &&
                        userStatus?.status === 'offline' &&
                        userStatus?.lastSeen && (
                            <p className="text-xs text-gray-400">
                                Last seen {formatLastSeen(userStatus.lastSeen)}
                            </p>
                        )}
                    {!isSelf && !isGroup && userStatus?.status === 'online' && (
                        <p className="text-xs text-green-500">Online</p>
                    )}
                    {isGroup && (
                        <p className="text-xs text-gray-400">
                            {conversation?.participants?.length || 0} members
                        </p>
                    )}
                </div>
            )}

            {/* Hiển thị ngày và dấu chấm tin nhắn chưa đọc */}
            {!isCollapsed && (
                <div className="items-center text-[var(--Neutral-500,#1C1C1C)] text-[14px] font-normal leading-[160%] hidden lg:flex max-sm:flex max-sm:text-xs">
                    {conversation?.updatedAt &&
                        dayjs(conversation.updatedAt).format('DD/MM/YYYY')}
                    {isUnread && (
                        <div className="ml-2 w-2 h-2 bg-green-500 rounded-full" />
                    )}
                </div>
            )}
        </div>
    );
}
