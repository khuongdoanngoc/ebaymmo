'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Định nghĩa interfaces
interface BidMessage {
    _id: string;
    bidId: string;
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

interface BidChat {
    _id: string;
    bidId: string;
    participants: {
        _id: string;
        username: string;
        avatar: string;
    }[];
    createdAt: string;
    updatedAt: string;
    lastMessage?: {
        content: string;
        sender: string;
        createdAt: string;
    };
}

interface SendBidMessageData {
    bidId: string;
    content: string;
    type?: string;
}

interface Participant {
    _id: string;
    username: string;
    avatar: string;
}

interface UseBidChatSDKReturn {
    messages: BidMessage[];
    isConnected: boolean;
    sendMessage: (data: SendBidMessageData) => void;
    joinBidChat: (bidId: string) => void;
    leaveBidChat: (bidId: string) => void;
    isTyping: boolean;
    typingUser: string | null;
    startTyping: (bidId: string) => void;
    stopTyping: (bidId: string) => void;
    participants: Participant[];
}

const useBidChatSDK = (accessToken: string | null): UseBidChatSDKReturn => {
    const [messages, setMessages] = useState<BidMessage[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [typingUser, setTypingUser] = useState<string | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const session = useSession();

    // Khởi tạo WebSocket
    const initializeSocket = useCallback(() => {
        if (!accessToken) return;

        const socketConnection = io(process.env.NEXT_PUBLIC_CHAT_WS_URL, {
            query: { token: accessToken },
            extraHeaders: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        socketConnection.on('connect', () => {
            setIsConnected(true);
        });

        // Lắng nghe tin nhắn bid chat
        socketConnection.on('bidMessages', (bidMessages: BidMessage[]) => {
            setMessages(bidMessages);
        });

        // Lắng nghe tin nhắn mới
        socketConnection.on('newBidMessage', (newMsg: BidMessage) => {
            setMessages((prev) => [...prev, newMsg]);
        });

        // Lắng nghe danh sách participants
        socketConnection.on('bidParticipants', (users: Participant[]) => {
            setParticipants(users);
        });

        // Lắng nghe khi có người tham gia mới
        socketConnection.on(
            'userJoinedBid',
            (data: { user: Participant; bidId: string }) => {
                const newUser = data.user;
                setParticipants((prev) => {
                    if (!prev.find((p) => p._id === newUser._id)) {
                        return [...prev, newUser];
                    }
                    return prev;
                });

                // Thêm system message
                const systemMessage: BidMessage = {
                    _id: Date.now().toString(),
                    bidId: data.bidId,
                    sender: {
                        _id: 'system',
                        username: 'System',
                        avatar: ''
                    },
                    type: 'system',
                    content: `${newUser.username} has joined the chat`,
                    status: 'sent',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                setMessages((prev) => [...prev, systemMessage]);
            }
        );

        // Lắng nghe khi có người rời đi
        socketConnection.on(
            'userLeftBid',
            (data: { user: Participant; bidId: string }) => {
                const leftUser = data.user;
                setParticipants((prev) =>
                    prev.filter((p) => p._id !== leftUser._id)
                );

                // Thêm system message
                const systemMessage: BidMessage = {
                    _id: Date.now().toString(),
                    bidId: data.bidId,
                    sender: {
                        _id: 'system',
                        username: 'System',
                        avatar: ''
                    },
                    type: 'system',
                    content: `${leftUser.username} has left the chat`,
                    status: 'sent',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                setMessages((prev) => [...prev, systemMessage]);
            }
        );

        // Lắng nghe typing indicators
        socketConnection.on(
            'userTypingInBid',
            (data: { username: string; bidId: string }) => {
                if (data.username !== session.data?.user.username) {
                    setIsTyping(true);
                    setTypingUser(data.username);
                }
            }
        );

        socketConnection.on('userStopTypingInBid', () => {
            setIsTyping(false);
            setTypingUser(null);
        });

        socketConnection.on('disconnect', () => {
            setIsConnected(false);
            setParticipants([]);
        });

        setSocket(socketConnection);

        return () => {
            socketConnection.disconnect();
        };
    }, [accessToken, session.data?.user.username]);

    // Join bid chat room
    const joinBidChat = useCallback(
        (bidId: string) => {
            if (!socket || !isConnected) return;
            socket.emit('joinBidChat', { bidId });
        },
        [socket, isConnected]
    );

    // Leave bid chat room
    const leaveBidChat = useCallback(
        (bidId: string) => {
            if (!socket || !isConnected) return;
            socket.emit('leaveBidChat', { bidId });
        },
        [socket, isConnected]
    );

    // Send message in bid chat
    const sendMessage = useCallback(
        async ({ bidId, content, type = 'text' }: SendBidMessageData) => {
            if (!socket || !isConnected || !bidId || !content) return;

            const messageData = {
                bidId,
                content,
                type,
                sender: {
                    _id: session.data?.user.id,
                    username: session.data?.user.username,
                    avatar: session.data?.user.image
                }
            };

            socket.emit('sendBidMessage', messageData);
        },
        [socket, isConnected, session.data?.user]
    );

    // Typing indicators
    const startTyping = useCallback(
        (bidId: string) => {
            if (!socket || !isConnected) return;
            socket.emit('typingInBid', { bidId });
        },
        [socket, isConnected]
    );

    const stopTyping = useCallback(
        (bidId: string) => {
            if (!socket || !isConnected) return;
            socket.emit('stopTypingInBid', { bidId });
        },
        [socket, isConnected]
    );

    // Initialize socket when token changes
    useEffect(() => {
        if (accessToken) {
            const cleanup = initializeSocket();
            return () => {
                cleanup?.();
                setParticipants([]);
            };
        }
    }, [accessToken, initializeSocket]);

    return {
        messages,
        isConnected,
        sendMessage,
        joinBidChat,
        leaveBidChat,
        isTyping,
        typingUser,
        startTyping,
        stopTyping,
        participants
    };
};

export default useBidChatSDK;
