'use client';
import { getOtherParticipant } from '@/pages/chatbox/_utils/conversation';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { useUserInfo } from '@/context/UserInfoContext';
import { IDataTokenDecode } from '@/types/global.type';
import { jwtDecode } from 'jwt-decode';
import { useUserInfoSubscription } from '@/generated/graphql';
import { useNavigate } from 'react-router-dom';
import { getGroupParticipants } from '@/pages/chatbox/_utils/groupConversation';

// Định nghĩa kiểu dữ liệu cho message và conversation
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
    groupName: string;
    __v: number;
    lastMessage: {
        _id: string;
        senderId: string;
        content: string;
    };
}

// Thêm interface cho messageData
interface SendMessageData {
    conversationId: string; // MongoDB ObjectId string
    senderId: string; // username
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

interface UseChatSDKReturn {
    conversations: Conversation[];
    messages: Message[];
    setMessages: (messages: Message[]) => void;
    isConnected: boolean;
    currentConversation: Conversation | null;
    setCurrentConversation: (conversation: Conversation) => void;
    sendMessage: (
        conversationId: string,
        content: string,
        type: string
    ) => void;
    socket: Socket | null;
    isLoading: boolean;
    emitTyping: (conversationId: string) => void;
    emitStopTyping: (conversationId: string) => void;
    typingUsers: { [key: string]: string };
    userStatuses: UserStatus;
    getUserStatus: (userIds: string[]) => void;
    setUserStatus: (status: 'online' | 'away' | 'busy' | 'offline') => void;
    formatLastSeen: (timestamp: number | null) => string;
    loadMoreMessages: (conversationId: string, lastMessageId: string) => void;
    isLoadingMore: boolean;
    hasMore: boolean;
    offsetMessage: number;
    createGroupConversation: (
        participants: string[],
        groupName?: string,
        participantUsernames?: string[]
    ) => void;
}

// Thêm hàm kiểm tra ObjectId hợp lệ
const isValidObjectId = (id: string): boolean => {
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
};

const useChatSDK = (accessToken: string | null): UseChatSDKReturn => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [currentConversation, setCurrentConversation] =
        useState<Conversation | null>(null);
    // Trong hàm/hook của bạn, thêm dòng này
    const navigate = useNavigate();

    const token = localStorage.getItem('accessToken');
    // Get userId from session token
    const userId = token
        ? jwtDecode<IDataTokenDecode>(token)['https://hasura.io/jwt/claims'][
              'X-Hasura-User-Id'
          ]
        : null;

    const { data } = useUserInfoSubscription({
        variables: {
            userId: userId || ''
        },
        skip: !userId
    });

    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [typingUsers, setTypingUsers] = useState<{ [key: string]: string }>(
        {}
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    //const router = useRouter();
    const [socket, setSocket] = useState<Socket | null>(null);

    const { userInfo } = useUserInfo();
    const currentUser = useMemo(() => userInfo, [userInfo]);

    const currentConversationRef = useRef<Conversation | null>(null);

    const [userStatuses, setUserStatuses] = useState<UserStatus>({});

    const [offsetMessage, setOffsetMessage] = useState<number>(0);

    // Cập nhật ref khi currentConversation thay đổi
    useEffect(() => {
        currentConversationRef.current = currentConversation;
    }, [currentConversation]);

    // Hàm khởi tạo WebSocket
    const initializeSocket = useCallback(() => {
        // connect to websocket
        const socketConnection = io('wss://shop3-chat.crbgroup.live', {
            query: { accessToken },
            extraHeaders: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        // listen to connection event
        socketConnection.on('connect', () => {
            console.log('connected to socket');
            setIsConnected(true);
        });

        // lắng nghe sự kiện nhận tin nhắn mới
        socketConnection.on('newMessage', (newMsg) => {
            // cập nhật danh sách tin nhắn nếu đang ở trong cuộc trò chuyện
            if (
                currentConversationRef.current &&
                newMsg.conversationId.toString() ===
                    currentConversationRef.current._id.toString()
            ) {
                setMessages((prev) => [...prev, newMsg]);
            }
        });

        socketConnection.on(
            'updateConversation',
            (updatedConversation: Conversation) => {
                setConversations((prevConversations) => {
                    // Check if the conversation already exists
                    const existingIndex = prevConversations.findIndex(
                        (conv) => conv._id === updatedConversation._id
                    );

                    const newConversations = [...prevConversations];

                    if (existingIndex !== -1) {
                        // Update existing conversation
                        newConversations[existingIndex] = updatedConversation;

                        // Remove it from its current position
                        const [updatedConv] = newConversations.splice(
                            existingIndex,
                            1
                        );

                        // Add it to the top of the list
                        newConversations.unshift(updatedConv);
                    } else {
                        // Add new conversation to the top
                        newConversations.unshift(updatedConversation);
                    }

                    return newConversations;
                });
            }
        );

        // listen to messages event to get response history messages
        socketConnection.on(
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

        // listen to conversations event to get list of conversations response
        socketConnection.on(
            'responseHistoryConversations',
            (historyConversations: Conversation[]) => {
                setConversations(historyConversations);
                setIsLoading(false);
            }
        );

        socketConnection.on(
            'newConversation',
            (newConversation: Conversation) => {
                if (newConversation) {
                    setConversations((prev) => [...prev, newConversation]);
                    setCurrentConversation(newConversation);
                    // Đã thay đổi router.push thành navigate
                    navigate(
                        `/chatbox?chatto=${
                            getOtherParticipant(
                                newConversation,
                                currentUser?.username
                            )?.username
                        }`,
                        {
                            state: { preventScroll: true }
                            // navigate không có tùy chọn scroll như Next.js
                        }
                    );
                }
            }
        );

        socketConnection.on(
            'newGroupConversation',
            (newConversation: Conversation) => {
                setConversations((prev) => [...prev, newConversation]);
                setCurrentConversation(newConversation);
                // Get participants excluding the current user
                const participants = getGroupParticipants(
                    newConversation,
                    currentUser?.username
                );
                if (participants.length > 0) {
                    navigate(`/chatbox?chatto=${participants[0].username}`);
                } else {
                    console.warn(
                        'No other participants found in the group chat.'
                    );
                }
            }
        );

        // listen to disconnect event
        socketConnection.on('disconnect', () => {
            setIsConnected(false);
        });

        setSocket(socketConnection);

        return () => {
            socketConnection.disconnect();
        };
    }, [accessToken, data?.usersByPk?.username]);

    // hàm lấy history conversation qua websocket
    const getHistoryConversations = useCallback(
        async (userId: string | undefined) => {
            if (!accessToken || !socket || !userId) return;
            setIsLoading(true);
            socket.emit('getHistoryConversations', { userId });
        },
        [accessToken, socket]
    );

    // Sửa lại hàm sendMessage để xử lý cả socket message và chat message
    const sendMessage = useCallback(
        async (conversationId: string, content: string, type: string) => {
            if (!socket || !isConnected || !conversationId || !content) return;

            // Kiểm tra tính hợp lệ của conversationId
            if (!isValidObjectId(conversationId)) {
                console.error('Invalid conversation ID format');
                return;
            }
            const messageData: SendMessageData = {
                conversationId: conversationId, // Format lại thành ObjectId string
                senderId: userId || '',
                content: content,
                type: type,
                status: 'sent'
            };

            // Gửi tin nhắn qua socket.io
            socket.emit('sendMessage', messageData);
        },
        [socket, isConnected, data?.usersByPk?.userId]
    );

    // get history conversations khi truy cập vào trang chatbox
    useEffect(() => {
        getHistoryConversations(data?.usersByPk?.userId);
    }, [getHistoryConversations]);

    // join conversation khi chọn 1 current conversation
    useEffect(() => {
        if (currentConversation) {
            console.log('join conversation', currentConversation);
            socket?.emit('joinConversation', {
                conversationId: currentConversation._id
            });
        }
    }, [currentConversation]);

    const emitTyping = useCallback(
        (conversationId: string) => {
            if (!socket) return;

            // Get recipient ID from current conversation
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
                recipientId: recipientId // Add recipient ID to typing event
            });
        },
        [socket, currentConversation, currentUser?.username]
    );

    const emitStopTyping = useCallback(
        (conversationId: string) => {
            if (!socket) return;

            // Get recipient ID from current conversation
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
                recipientId: recipientId // Add recipient ID to stop typing event
            });
        },
        [socket, currentConversation, currentUser?.username]
    );

    // Khi token thay đổi, khởi tạo lại WebSocket
    useEffect(() => {
        if (accessToken) {
            initializeSocket();
        }
    }, [accessToken]);

    useEffect(() => {
        if (socket) {
            // Nhận tin nhắn mới
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

            socket.on('messagesStatusUpdated', ({ updatedMessages }) => {
                setMessages((prevMessages) => {
                    return prevMessages.map((message) => {
                        // Tìm tin nhắn tương ứng trong updatedMessages
                        const updatedMessage = updatedMessages.find(
                            (msg: Message) => msg._id === message._id
                        );
                        // Nếu tìm thấy, trả về tin nhắn đã được cập nhật, ngược lại giữ nguyên
                        return updatedMessage || message;
                    });
                });
            });

            // Add these new listeners for user status
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

            // Set initial status to online when connected
            if (data?.usersByPk?.userId) {
                socket.emit('setUserStatus', { status: 'online' });
            }

            return () => {
                // socket.off('newMessage');
                socket.off('user_typing');
                socket.off('user_stop_typing');
                socket.off('messageStatusUpdated');
                socket.off('userStatusResponse');
                socket.off('userStatusChanged');

                // Set status to offline when disconnecting
                if (data?.usersByPk?.userId) {
                    if (data?.usersByPk?.userId) {
                        setTimeout(() => {
                            socket.emit('setUserStatus', { status: 'offline' });
                        }, 6000);
                    }
                }
            };
        }
    }, [socket, data?.usersByPk?.userId]);

    // Thêm hàm để tìm và cập nhật tin nhắn cuối cùng của đối phương
    const updateLastOtherUserMessageStatus = useCallback(
        (messages: Message[]) => {
            if (!socket || !currentUser) return;

            // Tìm tin nhắn cuối cùng của đối phương
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
        [socket, currentUser]
    );

    // Sửa useEffect khi messages thay đổi
    useEffect(() => {
        if (currentConversation && messages.length > 0) {
            updateLastOtherUserMessageStatus(messages);
        }
    }, [currentConversation, messages, updateLastOtherUserMessageStatus]);

    // Add function to request user status
    const getUserStatus = useCallback(
        (userIds: string[]) => {
            if (!socket || !userIds.length) return;
            socket.emit('getUserStatus', { userIds });
        },
        [socket]
    );

    // Add function to set user status
    const setUserStatus = useCallback(
        (status: 'online' | 'away' | 'busy' | 'offline') => {
            if (!socket) return;
            socket.emit('setUserStatus', { status });
        },
        [socket]
    );

    // When conversations change, get status for all participants
    useEffect(() => {
        if (conversations.length > 0) {
            // Extract all unique user IDs from conversations
            const userIds = new Set<string>();

            conversations.forEach((conversation) => {
                conversation.participants.forEach((participant) => {
                    if (participant._id !== data?.usersByPk?.userId) {
                        userIds.add(participant._id);
                    }
                });
            });

            // Request status for all users
            if (userIds.size > 0) {
                getUserStatus(Array.from(userIds));
            }
        }
    }, [conversations, data?.usersByPk?.userId, getUserStatus]);

    // Format last seen time helper function
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

    // Sửa lại hàm loadMoreMessages - keep only one declaration
    const loadMoreMessages = useCallback(
        (conversationId: string, lastMessageId: string) => {
            if (
                !socket ||
                !conversationId ||
                !lastMessageId ||
                isLoadingMore ||
                !hasMore
            )
                return;

            console.log('Emitting loadMoreMessages:', {
                conversationId,
                lastMessageId
            });
            setIsLoadingMore(true);
            socket.emit('loadMoreMessages', {
                conversationId,
                lastMessageId,
                limit: 10,
                offset: offsetMessage + 1
            });
            setOffsetMessage(offsetMessage + 1);
        },
        [socket, isLoadingMore, hasMore, offsetMessage]
    );

    // Cập nhật socket listener
    useEffect(() => {
        if (socket) {
            socket.on(
                'responseMoreMessages',
                (response: { messages: Message[]; hasMore: boolean }) => {
                    if (response.messages.length > 0) {
                        setMessages((prev) => [...response.messages, ...prev]);
                        setHasMore(response.hasMore);
                        console.log('response', response);
                        setIsLoadingMore(false);
                    }
                }
            );

            return () => {
                socket.off('responseMoreMessages');
            };
        }
    }, [socket]);

    // Reset hasMore khi chuyển conversation
    useEffect(() => {
        setHasMore(true);
    }, [currentConversation]);

    // Reset offset when changing conversation
    useEffect(() => {
        setOffsetMessage(0);
    }, [currentConversation]);

    const createGroupConversation = (
        participants: string[],
        groupName?: string,
        participantUsernames?: string[]
    ) => {
        if (!socket) return;

        // Nếu groupName không được cung cấp và có participantUsernames, tạo tên nhóm từ danh sách username
        let finalGroupName = groupName;
        if (
            !finalGroupName &&
            participantUsernames &&
            participantUsernames.length > 0
        ) {
            finalGroupName = participantUsernames.join(', ');
        }

        socket.emit('createGroupConversation', {
            participants,
            groupName: finalGroupName || 'Nhóm chat'
        });
    };

    return {
        setMessages,
        conversations,
        messages,
        currentConversation,
        setCurrentConversation,
        isConnected,
        sendMessage,
        socket,
        isLoading,
        emitTyping,
        emitStopTyping,
        typingUsers,
        userStatuses,
        getUserStatus,
        setUserStatus,
        formatLastSeen,
        loadMoreMessages,
        isLoadingMore,
        hasMore,
        offsetMessage,
        createGroupConversation
    };
};

export default useChatSDK;
