'use client';
import { getOtherParticipant } from '@/app/[locale]/(default)/chatbox/_utils/conversation';
import { useSocketContext } from '@/contexts/SocketConnectionContext';
import { useUserInfo } from '@/contexts/UserInfoContext';
import { useRouter } from 'next/navigation';
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    useMemo,
    ReactNode
} from 'react';

// Các interface và type định nghĩa dữ liệu
interface Message {
    _id: string;
    conversationId: string;
    sender: {
        _id: string;
        username: string;
        avatar: string;
    };
    type: string;
    content: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface User {
    _id: string;
    username: string;
    avatar: string;
}

export interface Conversation {
    _id: string;
    type: string;
    participants: {
        _id: string;
        username: string;
        avatar: string;
    }[];
    createdAt: string;
    updatedAt: string;
    __v: number;
    lastMessage: {
        _id: string;
        senderId: string;
        content: string;
    };
}

interface SendMessageData {
    conversationId: string;
    senderId: string;
    content: string;
    type: string;
    status: string;
}

interface UserStatus {
    [userId: string]: {
        status: 'online' | 'away' | 'busy' | 'offline';
        lastSeen: number | null;
    };
}

interface ChatContextType {
    conversations: Conversation[];
    setConversations: (conversations: Conversation[]) => void;
    messages: Message[];
    setMessages: (messages: Message[]) => void;
    currentConversation: Conversation | null;
    setCurrentConversation: (conversation: Conversation) => void;
    sendMessage: (
        conversationId: string,
        content: string,
        type: string
    ) => void;
    isLoading: boolean;
    emitTyping: (conversationId: string) => void;
    emitStopTyping: (conversationId: string) => void;
    typingUsers: { [key: string]: string };
    userStatuses: UserStatus;
    formatLastSeen: (timestamp: number | null) => string;
    loadMoreMessages: (conversationId: string, lastMessageId: string) => void;
    isLoadingMore: boolean;
    hasMore: boolean;
    offsetMessage: number;
    getHistoryConversations: (userId: string | undefined) => void;
    updateMessageReadStatus: (conversationId: string) => void;
}

// Hàm utility kiểm tra định dạng ObjectId hợp lệ
const isValidObjectId = (id: string): boolean => {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
};

// Tạo context cho chat
const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { socket, isConnected } = useSocketContext();
    const router = useRouter();
    const { userInfo } = useUserInfo();

    // Quản lý state cho cuộc trò chuyện
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] =
        useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const [offsetMessage, setOffsetMessage] = useState<number>(0);

    // Quản lý trạng thái người dùng
    const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>(
        {}
    );
    const [userStatuses, setUserStatuses] = useState<UserStatus>({});

    const currentUser = useMemo(() => userInfo, [userInfo]);
    const currentConversationRef = useRef<Conversation | null>(null);

    // Cập nhật ref khi currentConversation thay đổi
    useEffect(() => {
        currentConversationRef.current = currentConversation;
    }, [currentConversation]);

    // QUẢN LÝ CUỘC TRÒ CHUYỆN

    // Lấy lịch sử cuộc trò chuyện
    const getHistoryConversations = useCallback(
        (userId: string | undefined) => {
            if (!socket || !isConnected || !userId) return;
            setIsLoading(true);
            socket.emit('getHistoryConversations', { userId });
        },
        [socket, isConnected]
    );

    // Tham gia cuộc trò chuyện khi được chọn
    useEffect(() => {
        if (currentConversation && socket) {
            socket.emit('joinConversation', {
                conversationId: currentConversation._id
            });
        }
    }, [currentConversation, socket]);

    // Reset offset khi thay đổi cuộc trò chuyện
    useEffect(() => {
        setOffsetMessage(0);
        setHasMore(true);
    }, [currentConversation]);

    // Lấy cuộc trò chuyện khi component mount
    useEffect(() => {
        if (socket && isConnected && userInfo?.userId) {
            getHistoryConversations(userInfo?.userId);
        }
    }, [getHistoryConversations, userInfo?.userId, socket, isConnected]);

    // QUẢN LÝ TIN NHẮN

    // Gửi tin nhắn
    const sendMessage = useCallback(
        (conversationId: string, content: string, type: string) => {
            if (!socket || !isConnected || !conversationId || !content) return;

            if (!isValidObjectId(conversationId)) {
                console.error('Invalid conversation ID format');
                return;
            }

            const messageData: SendMessageData = {
                conversationId: conversationId,
                senderId: userInfo?.userId || '',
                content: content,
                type: type,
                status: 'sent'
            };

            socket.emit('sendMessage', messageData);
        },
        [socket, isConnected, userInfo]
    );

    // Cập nhật trạng thái tin nhắn
    const updateLastOtherUserMessageStatus = useCallback(
        (messages: Message[]) => {
            if (!socket || !isConnected || !currentUser) return;

            const lastOtherUserMessage = [...messages]
                .reverse()
                .find((msg) => msg.sender.username !== currentUser.username);

            if (
                lastOtherUserMessage &&
                lastOtherUserMessage.status !== 'read'
            ) {
                socket.emit('updateMessageStatus', {
                    messageId: lastOtherUserMessage._id,
                    status: 'read'
                });
            }
        },
        [socket, isConnected, currentUser]
    );

    // Cập nhật trạng thái tin nhắn khi tin nhắn thay đổi
    useEffect(() => {
        if (currentConversation && messages.length > 0) {
            updateLastOtherUserMessageStatus(messages);
        }
    }, [currentConversation, messages, updateLastOtherUserMessageStatus]);

    // Tải thêm tin nhắn cũ
    const loadMoreMessages = useCallback(
        (conversationId: string, lastMessageId: string) => {
            if (
                !socket ||
                !isConnected ||
                !conversationId ||
                !lastMessageId ||
                isLoadingMore ||
                !hasMore
            )
                return;

            setIsLoadingMore(true);
            socket.emit('loadMoreMessages', {
                conversationId,
                lastMessageId,
                limit: 10,
                offset: offsetMessage + 10
            });
            setOffsetMessage(offsetMessage + 10);
        },
        [socket, isConnected, isLoadingMore, hasMore, offsetMessage]
    );

    // QUẢN LÝ TRẠNG THÁI GÕ

    // Gửi thông báo đang gõ
    const emitTyping = useCallback(
        (conversationId: string) => {
            if (!socket || !isConnected) return;

            let recipientId = '';
            if (currentConversation) {
                const recipient = getOtherParticipant(
                    currentConversation,
                    currentUser?.username
                );
                recipientId = recipient?._id || '';
            }

            socket.emit('typing', {
                conversationId: conversationId,
                recipientId: recipientId
            });
        },
        [socket, isConnected, currentConversation, currentUser?.username]
    );

    // Gửi thông báo dừng gõ
    const emitStopTyping = useCallback(
        (conversationId: string) => {
            if (!socket || !isConnected) return;

            let recipientId = '';
            if (currentConversation) {
                const recipient = getOtherParticipant(
                    currentConversation,
                    currentUser?.username
                );
                recipientId = recipient?._id || '';
            }

            socket.emit('stop_typing', {
                conversationId: conversationId,
                recipientId: recipientId
            });
        },
        [socket, isConnected, currentConversation, currentUser?.username]
    );

    // QUẢN LÝ TRẠNG THÁI NGƯỜI DÙNG

    // Lấy trạng thái người dùng
    const getUserStatus = useCallback(
        (userIds: string[]) => {
            if (!socket || !isConnected || !userIds.length) return;
            socket.emit('getUserStatus', { userIds });
        },
        [socket, isConnected]
    );

    // Cài đặt trạng thái người dùng
    const setUserStatus = useCallback(
        (status: 'online' | 'away' | 'busy' | 'offline') => {
            if (!socket || !isConnected) return;
            socket.emit('setUserStatus', { status });
        },
        [socket, isConnected]
    );

    // Cài đặt trạng thái online khi component mount
    useEffect(() => {
        if (socket && userInfo) {
            // Đặt trạng thái online khi component mount
            setUserStatus('online');

            // Đặt trạng thái offline khi component unmount
            return () => {
                setUserStatus('offline');
            };
        }
    }, [socket, userInfo, setUserStatus]);

    // Lấy trạng thái cho tất cả người dùng trong cuộc trò chuyện
    useEffect(() => {
        if (conversations.length > 0 && socket && isConnected) {
            const userIds = new Set<string>();

            conversations.forEach((conversation) => {
                conversation.participants.forEach((participant) => {
                    if (participant._id !== userInfo?.userId) {
                        userIds.add(participant._id);
                    }
                });
            });

            if (userIds.size > 0) {
                getUserStatus(Array.from(userIds));
            }
        }
    }, [conversations, userInfo?.userId, getUserStatus, socket, isConnected]);

    // Định dạng thời gian lần cuối xuất hiện
    const formatLastSeen = useCallback((timestamp: number | null): string => {
        if (!timestamp) return '';

        const now = new Date();
        const lastSeen = new Date(timestamp);
        const diffMinutes = Math.floor(
            (now.getTime() - lastSeen.getTime()) / (1000 * 60)
        );

        if (diffMinutes < 60) {
            return `${diffMinutes}m ago`;
        } else if (diffMinutes < 1440) {
            return `${Math.floor(diffMinutes / 60)}h ago`;
        } else {
            return new Date(timestamp).toLocaleDateString();
        }
    }, []);

    // QUẢN LÝ KẾT NỐI SOCKET

    // Thêm socket event listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('newMessage', (newMsg) => {
            if (
                currentConversationRef.current &&
                newMsg.conversationId.toString() ===
                    currentConversationRef.current._id.toString()
            ) {
                setMessages((prev) => [...prev, newMsg]);
            }
        });

        socket.on('updateConversation', (updatedConversation: Conversation) => {
            setConversations((prevConversations) => {
                // Kiểm tra xem cuộc trò chuyện đã tồn tại chưa
                const existingIndex = prevConversations.findIndex(
                    (conv) => conv._id === updatedConversation._id
                );

                const newConversations = [...prevConversations];

                if (existingIndex !== -1) {
                    // Cập nhật cuộc trò chuyện đã tồn tại
                    newConversations[existingIndex] = updatedConversation;

                    // Xóa nó khỏi vị trí hiện tại
                    const [updatedConv] = newConversations.splice(
                        existingIndex,
                        1
                    );

                    // Thêm vào đầu danh sách
                    newConversations.unshift(updatedConv);
                } else {
                    // Thêm cuộc trò chuyện mới vào đầu
                    newConversations.unshift(updatedConversation);
                }

                return newConversations;
            });
        });

        socket.on(
            'responseHistoryMessages',
            (response: {
                messages: Message[];
                offset: number;
                hasMore: boolean;
                remainingCount: number;
            }) => {
                setMessages(response.messages);
                setHasMore(response.hasMore);
                setOffsetMessage(response.offset);
            }
        );

        socket.on(
            'responseHistoryConversations',
            (historyConversations: Conversation[]) => {
                setConversations(historyConversations);
                setIsLoading(false);
            }
        );

        socket.on('newConversation', (newConversation: Conversation) => {
            if (newConversation) {
                // Check if conversation already exists in the array
                const conversationExists = conversations.some(
                    (conv) => conv._id === newConversation._id
                );
                
                // Only update conversations array if it doesn't exist
                if (!conversationExists) {
                    setConversations((prev) => [...prev, newConversation]);
                }
                setCurrentConversation(newConversation);
            }
        });

        // Phản hồi thêm tin nhắn
        socket.on(
            'responseMoreMessages',
            (response: { messages: Message[]; hasMore: boolean }) => {
                if (response.messages.length > 0) {
                    setMessages((prev) => [...response.messages, ...prev]);
                    setHasMore(response.hasMore);
                    setIsLoadingMore(false);
                }
            }
        );

        // Sự kiện người dùng đang gõ
        socket.on('user_typing', (data) => {
            setTypingUsers((prev) => ({
                ...prev,
                [data.conversationId]: data.username
            }));
        });

        socket.on('user_stop_typing', (data) => {
            setTypingUsers((prev) => {
                const updated = { ...prev };
                delete updated[data.conversationId];
                return updated;
            });
        });

        socket.on('messagesStatusUpdated', ({ messages }) => {
            setMessages((prevMessages) => {
                return prevMessages.map((message) => {
                    const updatedMessage = messages?.find(
                        (msg: Message) => msg._id === message._id
                    );
                    return updatedMessage || message;
                });
            });
        });

        // Sự kiện trạng thái người dùng
        socket.on('userStatusResponse', (statuses: UserStatus) => {
            setUserStatuses((prev) => ({ ...prev, ...statuses }));
        });

        socket.on(
            'userStatusChanged',
            (data: {
                userId: string;
                status: 'online' | 'away' | 'busy' | 'offline';
                lastSeen: number | null;
            }) => {
                setUserStatuses((prev) => ({
                    ...prev,
                    [data.userId]: {
                        status: data.status,
                        lastSeen: data.lastSeen
                    }
                }));
            }
        );

        return () => {
            socket.off('newMessage');
            socket.off('updateConversation');
            socket.off('responseHistoryMessages');
            socket.off('responseHistoryConversations');
            socket.off('newConversation');
            socket.off('responseMoreMessages');
            socket.off('user_typing');
            socket.off('user_stop_typing');
            socket.off('messagesStatusUpdated');
            socket.off('userStatusResponse');
            socket.off('userStatusChanged');
        };
    }, [socket, currentUser?.username, router]);

    // Cập nhật trạng thái đọc tin nhắn khi focus vào input
    const updateMessageReadStatus = useCallback(
        (conversationId: string) => {
            if (!socket || !isConnected || !conversationId || !userInfo?.userId)
                return;

            const lastOtherUserMessage = [...messages]
                .reverse()
                .find((msg) => msg.sender.username !== currentUser?.username);

            // Emit the messageRead event to update message status on the server
            socket.emit('messageRead', {
                conversationId: conversationId,
                userId: lastOtherUserMessage?.sender._id
            });

            // Update conversation locally to show messages as read
            setConversations((prevConversations) => {
                return prevConversations.map((conv) => {
                    if (conv._id === conversationId && conv.lastMessage) {
                        return {
                            ...conv,
                            lastMessage: {
                                ...conv.lastMessage,
                                status: 'read'
                            }
                        };
                    }
                    return conv;
                });
            });
        },
        [socket, isConnected, userInfo?.userId]
    );

    // Giá trị context
    const value = {
        conversations,
        setConversations,
        messages,
        setMessages,
        currentConversation,
        setCurrentConversation,
        sendMessage,
        isLoading,
        emitTyping,
        emitStopTyping,
        typingUsers,
        userStatuses,
        formatLastSeen,
        loadMoreMessages,
        isLoadingMore,
        hasMore,
        offsetMessage,
        getHistoryConversations,
        updateMessageReadStatus
    };

    return (
        <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    );
};

// Hook để sử dụng ChatContext
export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};
