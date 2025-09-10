import { useEffect, useState } from 'react';
import DropdownAccount from '@/components/DropdownAccount';
import SidebarItem from './SidebarItem';
// import Image from 'next/image';
import { Conversation as BaseConversation } from '@/hooks/useChatSDK';
//import { useRouter } from 'next/navigation';
import { useSearchUsersQuery } from '@/generated/graphql';
import useDebounced from '@/hooks/useDebounced';
import { useChatContext } from '../_contexts/ChatContext';
import { useUserInfo } from '@/context/UserInfoContext';
import Toggle from '@/assets/images/toggle.svg';
import ChatIcon from '@/assets/images/chat-icon.svg';
import Avatar from '@/assets/images/avatar.svg';
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
    onConversationClick: (
        conversation: BaseConversation | string | undefined
    ) => void;
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
}

export default function ChatSidebar({
    onConversationClick,
    isCollapsed,
    setIsCollapsed
}: ChatSidebarProps) {
    // ----- CONTEXT & STATE -----
    const { conversations, currentConversation, isLoading } = useChatContext();
    const { userInfo } = useUserInfo();
    const [isMobile, setIsMobile] = useState(false);

    // Type casting để có thêm thông tin lastMessage status
    const typedConversations = conversations as unknown as Conversation[];
    //console.log('typedConversations', typedConversations);
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
            className={`border-r h-[calc(100vh-80px)] border-gray-200 bg-gray-50 transition-all duration-700 ease-in-out ${
                isCollapsed
                    ? 'w-[300px]'
                    : 'w-[100%] md:w-[250px] lg:w-[400px] xl:w-[550px]'
            } ${
                isCollapsed
                    ? 'max-w-[120px] max-sm:w-[100px]'
                    : 'max-w-[120px] md:max-w-[250px] lg:max-w-[400px] xl:max-w-[400px]'
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
                    {(!isCollapsed || isMobile) && (
                        <DropdownAccount
                            button={
                                <img
                                    width={32}
                                    height={32}
                                    src={ChatIcon}
                                    alt="Add"
                                />
                            }
                        >
                            <CreateChatDialog
                                onConversationClick={onConversationClick}
                            />
                        </DropdownAccount>
                    )}
                    <button
                        className="p-2 transition-transform duration-300 hover:scale-110 hidden md:block"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        <img
                            src={Toggle}
                            alt="Toggle sidebar"
                            className={`w-10 h-10 transition-transform duration-700 ${
                                isCollapsed ? 'rotate-180' : 'rotate-0'
                            }`}
                        />
                    </button>
                </div>
            </div>

            {/* Danh sách cuộc trò chuyện */}
            <div className="overflow-y-auto h-[calc(100vh-320px)] transition-all duration-300 ease-in-out">
                {/* Chat với chính mình */}
                <div className="transition-all duration-300 ease-in-out transform hover:scale-[1.02]">
                    <SidebarItem
                        isActive={
                            typedCurrentConversation?.participants[0]
                                .username === userInfo?.username
                        }
                        username={userInfo?.username || ''}
                        avatar={userInfo?.images || Avatar}
                        isSelf={true}
                        onClick={() => {
                            // Tìm hoặc tạo cuộc trò chuyện với chính mình
                            const isSelfConversationAvailable =
                                typedConversations.find(
                                    (convo) => convo.type === 'self'
                                );
                            if (isSelfConversationAvailable) {
                                onConversationClick(
                                    isSelfConversationAvailable as unknown as BaseConversation
                                );
                            } else {
                                onConversationClick(userInfo?.username || '');
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

// ----- CREATE CHAT DIALOG COMPONENT -----
interface User {
    _id: string;
    username: string;
    avatar: string;
}

const CreateChatDialog = ({
    onConversationClick
}: {
    onConversationClick: (
        conversation: string | Conversation | undefined,
        isFind?: boolean
    ) => void;
}) => {
    // ----- STATE & QUERIES -----
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<User[]>([]);
    // Debounce input để tránh gọi API quá nhiều
    const debouncedSearchQuery = useDebounced(searchQuery, 500);

    console.log('suggestions', suggestions);
    // GraphQL query để tìm kiếm người dùng
    const { data: searchResults, loading } = useSearchUsersQuery({
        variables: {
            where: {
                username: {
                    _ilike: `%${debouncedSearchQuery}%`
                }
            },
            limit: 10,
            offset: 0
        },
        skip: debouncedSearchQuery.length < 2
    });

    // console.log('searchResults', searchResults);
    // console.log('suggestions', suggestions);
    // Cập nhật gợi ý khi có kết quả tìm kiếm
    useEffect(() => {
        if (searchResults?.users) {
            setSuggestions(
                searchResults.users.map((user) => ({
                    _id: user.userId,
                    username: user.username,
                    avatar: user.images || ''
                }))
            );
        }
    }, [searchResults]);

    // Tạo cuộc trò chuyện mới khi chọn người dùng
    const handleCreateConversation = (user: Participant) => {
        onConversationClick(user.username, true);
        setSearchQuery('');
        setSuggestions([]);
    };

    return (
        <div className="w-[400px] max-xl:w-[300px] max-lg:w-[250px] max-md:w-[150px] max-sm:w-[100px] max-[480px]:w-[120px] max-[380px]:w-[100px]  p-2">
            <div className="relative w-[200px] max-xl:w-[180px] max-lg:w-[200px] max-md:w-[140px] max-sm:w-[60px] max-[480px]:w-[80px] max-[380px]:w-[60px]">
                <input
                    type="text"
                    placeholder="Search username..."
                    className="w-full p-2 border rounded-lg text-sm max-md:text-xs max-md:p-1.5 max-[480px]:text-xs max-[480px]:p-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {loading && (
                    <div className="absolute w-full mt-1 bg-white border rounded-lg shadow-lg">
                        <div className="p-2">Loading...</div>
                    </div>
                )}
                {!loading && suggestions.length > 0 && (
                    <div className="absolute w-full mt-1 bg-white border rounded-lg shadow-lg">
                        {suggestions.map((user) => (
                            <div
                                key={user._id}
                                className="p-2 hover:bg-gray-100 cursor-pointer"
                                onClick={() => handleCreateConversation(user)}
                            >
                                <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 rounded-full overflow-hidden">
                                        <img
                                            src={user.avatar || Avatar}
                                            className="w-full h-full object-cover"
                                            alt={user.username}
                                        />
                                    </div>
                                    <span>{user.username}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
