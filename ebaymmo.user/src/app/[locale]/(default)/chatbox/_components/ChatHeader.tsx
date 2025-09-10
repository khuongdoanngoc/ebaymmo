import { useChatContext } from '../_contexts/ChatContext';
import { useUserInfo } from '@/contexts/UserInfoContext';
import { useMemo } from 'react';

// ----- INTERFACES -----
interface UserStatus {
    [userId: string]: {
        status: 'online' | 'away' | 'busy' | 'offline';
        lastSeen: number | null;
    };
}

interface ChatHeaderProps {
    userStatuses: UserStatus;
    isMobileView?: boolean;
    onBackClick?: () => void;
}

export default function ChatHeader({
    userStatuses,
    isMobileView,
    onBackClick
}: ChatHeaderProps) {
    // ----- CONTEXT & STATE -----
    const { currentConversation, formatLastSeen } = useChatContext();
    const { userInfo } = useUserInfo();

    // ----- DERIVED STATE -----
    // Kiểm tra xem cuộc trò chuyện có phải là group hay không
    const isGroupChat = useMemo(() => {
        return currentConversation && currentConversation.type === 'group';
    }, [currentConversation]);

    // ----- HELPER FUNCTIONS -----
    // Lấy thông tin người tham gia cuộc trò chuyện hiện tại
    const getCurrentConversationParticipant = () => {
        if (!currentConversation) return null;

        // Nếu cuộc trò chuyện với chính mình, trả về thông tin của user hiện tại
        if (currentConversation.participants.length === 1) {
            return {
                _id: userInfo?.userId,
                username: userInfo?.username,
                avatar: userInfo?.images || '/images/avatar.svg'
            };
        }

        // Nếu cuộc trò chuyện với người khác, tìm và trả về thông tin người đó
        const otherParticipant = currentConversation.participants.find(
            (participant) => participant.username !== userInfo?.username
        );
        return otherParticipant;
    };

    // ----- DERIVED STATE -----
    // Lấy thông tin người tham gia và lưu vào memo để tránh tính toán lại
    const participant = useMemo(
        () => (!isGroupChat ? getCurrentConversationParticipant() : null),
        [currentConversation, userInfo, isGroupChat]
    );

    // Lấy trạng thái online của người tham gia
    const userStatus = participant?._id ? userStatuses[participant?._id] : null;

    // Lấy danh sách tên thành viên trong group
    const groupMemberNames = useMemo(() => {
        if (!isGroupChat || !currentConversation) return [];

        // Lọc bỏ người dùng hiện tại và lấy tên các thành viên khác
        return currentConversation.participants
            .filter((p) => p.username !== userInfo?.username)
            .map((p) => p.username)
            .filter(Boolean);
    }, [currentConversation, userInfo, isGroupChat]);

    return (
        <div className="p-4 md:p-6 lg:p-8 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
                {/* Nút quay lại danh sách trò chuyện trên mobile */}
                {isMobileView && (
                    <button
                        onClick={onBackClick}
                        className="mr-2 p-1 bg-gray-100 rounded-full flex items-center justify-center w-8 h-8"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}

                {/* Avatar của người tham gia hoặc avatar group */}
                <div className="relative">
                    <img
                        src={
                            isGroupChat
                                ? '/images/group-team-svgrepo-com.svg'
                                : participant?.avatar || '/images/avatar.svg'
                        }
                        alt={
                            isGroupChat
                                ? 'Group chat'
                                : `${participant?.username || 'User'}'s avatar`
                        }
                        className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full object-cover"
                    />
                    {!isGroupChat && participant?._id && (
                        <div
                            className={`absolute bottom-0 right-0 w-2 h-2 md:w-2.5 md:h-2.5 lg:w-3 lg:h-3 border-2 border-white rounded-full ${
                                userStatus?.status === 'online'
                                    ? 'bg-green-500'
                                    : userStatus?.status === 'away'
                                      ? 'bg-yellow-500'
                                      : userStatus?.status === 'busy'
                                        ? 'bg-red-500'
                                        : 'bg-gray-400'
                            }`}
                        />
                    )}
                </div>

                {/* Tên và trạng thái của người tham gia hoặc thông tin group */}
                <div>
                    <h3 className="font-semibold text-base md:text-lg lg:text-xl">
                        {isGroupChat
                            ? 'Group Chat'
                            : participant?.username || 'User'}
                    </h3>
                    {isGroupChat ? (
                        <p className="text-xs md:text-sm text-gray-500">
                            {currentConversation?.participants.length || 0}{' '}
                            members
                            {groupMemberNames.length > 0 &&
                                `: ${groupMemberNames.slice(0, 3).join(', ')}${groupMemberNames.length > 3 ? '...' : ''}`}
                        </p>
                    ) : (
                        <p className="text-xs md:text-sm">
                            {userStatus?.status === 'online' ? (
                                <span className="text-green-500">
                                    Đang online
                                </span>
                            ) : userStatus?.status === 'away' ? (
                                <span className="text-yellow-500">Away</span>
                            ) : userStatus?.status === 'busy' ? (
                                <span className="text-red-500">Busy</span>
                            ) : userStatus?.status === 'offline' &&
                              userStatus?.lastSeen ? (
                                <span className="text-gray-400">
                                    Last seen{' '}
                                    {formatLastSeen(userStatus.lastSeen)}
                                </span>
                            ) : (
                                <span className="text-gray-400">Offline</span>
                            )}
                        </p>
                    )}
                </div>
            </div>

            {/* Nút tùy chọn thêm (menu 3 chấm) */}
            <button className="text-gray-500 hover:text-gray-700">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                    />
                </svg>
            </button>
        </div>
    );
}
