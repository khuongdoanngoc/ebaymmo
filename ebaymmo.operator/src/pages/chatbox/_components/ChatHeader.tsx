import { useChatContext } from '../_contexts/ChatContext';
import { useUserInfo } from '@/context/UserInfoContext';
import { useMemo } from 'react';
import Avatar from '@/assets/images/avatar.svg';
// ----- INTERFACES -----
interface UserStatus {
    [userId: string]: {
        status: 'online' | 'away' | 'busy' | 'offline';
        lastSeen: number | null;
    };
}
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

    const isGroup = currentConversation?.type === 'group';

    // Tạo tiêu đề hiển thị dựa trên loại cuộc trò chuyện
    const displayName = isGroup
        ? `Order ${(currentConversation as Conversation).groupName}`
        : currentConversation?.participants?.length === 1;

    // ----- HELPER FUNCTIONS -----
    // Lấy thông tin người tham gia cuộc trò chuyện hiện tại
    const getCurrentConversationParticipant = () => {
        if (!currentConversation) return null;

        // Nếu là nhóm chat, trả về thông tin nhóm
        if (currentConversation.type === 'group') {
            // Sử dụng type assertion để truy cập thuộc tính name
            const conversationName = displayName;

            return {
                _id: currentConversation._id,
                username: conversationName, // Sử dụng tên nhóm thực tế hoặc mặc định
                avatar: Avatar, // Có thể thay bằng ảnh nhóm nếu API trả về
                isGroup: true
            };
        }

        // Nếu cuộc trò chuyện với chính mình, trả về thông tin của user hiện tại
        if (currentConversation.participants.length === 1) {
            return {
                _id: userInfo?.userId,
                username: userInfo?.username,
                avatar: userInfo?.images || Avatar
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
        () => getCurrentConversationParticipant(),
        [currentConversation, userInfo]
    );

    // Lấy trạng thái online của người tham gia (không áp dụng cho nhóm)
    const userStatus =
        participant?._id && !participant?.isGroup
            ? userStatuses[participant?._id]
            : null;

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

                {/* Avatar của người tham gia với chỉ báo trạng thái online */}
                <div className="relative">
                    {isGroup ? (
                        // Avatar tùy chỉnh cho nhóm
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-500 font-bold">G</span>
                        </div>
                    ) : (
                        <img
                            src={participant?.avatar || Avatar}
                            alt={`${participant?.username || 'User'}'s avatar`}
                            className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full object-cover"
                        />
                    )}
                    {participant?._id && !participant?.isGroup && (
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

                {/* Tên và trạng thái của người tham gia */}
                <div>
                    <h3 className="font-semibold text-base md:text-lg lg:text-xl">
                        {participant?.username || 'User'}
                    </h3>
                    {participant?.isGroup ? (
                        <p className="text-xs md:text-sm text-gray-500">
                            {currentConversation?.participants.map(
                                (p, index) => (
                                    <span key={p._id} className="mr-1">
                                        {p.username}
                                        {index <
                                            currentConversation.participants
                                                .length -
                                                1 && ','}
                                    </span>
                                )
                            )}
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
