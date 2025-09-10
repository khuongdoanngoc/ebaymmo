'use client';
import { useEffect, useRef, useState } from 'react';
import useBidChatSDK from '@/hooks/useBidChatSDK';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface ChatItemProps {
    currentBidId: string;
    accessToken: string;
    categoryName: string;
}

export default function ChatItem({
    categoryName,
    currentBidId,
    accessToken
}: ChatItemProps) {
    const {
        messages,
        isConnected,
        sendMessage,
        joinBidChat,
        leaveBidChat,
        participants, // Thêm participants để hiển thị số người tham gia
        isTyping,
        typingUser
    } = useBidChatSDK(accessToken);

    const { data: session } = useSession();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Kiểm tra vị trí scroll
    const isNearBottom = () => {
        const container = messagesContainerRef.current;
        if (!container) return false;

        const threshold = 100; // px from bottom
        return (
            container.scrollHeight -
                container.scrollTop -
                container.clientHeight <
            threshold
        );
    };

    // Xử lý scroll event
    const handleScroll = () => {
        setShouldAutoScroll(isNearBottom());
    };

    // Auto scroll khi có tin nhắn mới
    useEffect(() => {
        if (shouldAutoScroll && messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
                messagesContainerRef.current.scrollHeight;
        }
    }, [messages, shouldAutoScroll]);

    useEffect(() => {
        if (currentBidId && isConnected) {
            joinBidChat(currentBidId);
            return () => {
                leaveBidChat(currentBidId);
            };
        }
    }, [currentBidId, isConnected, joinBidChat, leaveBidChat]);

    // Xử lý gửi tin nhắn
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Ngăn event bubble
        if (!newMessage.trim() || !isConnected) return;

        try {
            await sendMessage({
                bidId: currentBidId,
                content: newMessage,
                type: 'text'
            });
            setNewMessage('');

            // Force scroll to bottom after sending
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop =
                    messagesContainerRef.current.scrollHeight;
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    if (!isConnected) {
        return (
            <div className="w-[400px] border rounded-[20px] p-4 h-[600px] flex items-center justify-center flex-col">
                <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500" />
                    <span>Connecting...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="md:w-[400px] w-[360px] border rounded-[20px] p-4 h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex flex-col items-start mb-4">
                <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2">
                        <Image
                            src="/images/eye.4.svg"
                            alt="Viewers"
                            width={24}
                            height={24}
                        />
                        <span className="text-[18px]">
                            {participants.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Image
                            src="/images/user.svg"
                            alt="Bidders"
                            width={24}
                            height={24}
                        />
                        <span className="text-[18px] text-gray-500">
                            {
                                participants.filter((p) => p._id !== 'system')
                                    .length
                            }
                        </span>
                    </div>
                </div>
                <div className="border-[1px] border-gray-300 w-full my-4" />
                <div className="flex items-center gap-2">
                    <Image
                        src="/images/avatar.svg"
                        alt="System"
                        width={24}
                        height={24}
                        className="rounded-full"
                    />
                    <span className="text-green-500">system.bot.ebaymmo</span>
                    <span className="text-green-500 text-sm">✓</span>
                </div>
            </div>

            {/* System Message */}
            <p className="text-gray-600 ml-2 mb-4">
                {/* The auction {categoryName} category has started! */}
                {categoryName}
            </p>

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-thin scrollbar-thumb-green_main"
            >
                {messages.map((message) => {
                    const isMyMessage =
                        message.sender._id === session?.user?.id;

                    if (message.type === 'system') {
                        return (
                            <div
                                key={message._id}
                                className="text-center text-gray-500 text-sm"
                            >
                                {message.content}
                            </div>
                        );
                    }

                    return (
                        <div
                            key={message._id}
                            className={`flex items-start gap-2 ${isMyMessage ? 'flex-row-reverse' : ''}`}
                        >
                            {!isMyMessage && (
                                <Image
                                    src={
                                        message.sender.avatar ||
                                        '/images/avatar.svg'
                                    }
                                    alt="User"
                                    width={24}
                                    height={24}
                                    className="rounded-full"
                                />
                            )}
                            <div
                                className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                            >
                                {!isMyMessage && (
                                    <span className="text-gray-700 text-sm mb-1">
                                        {message.sender.username}
                                    </span>
                                )}
                                <div
                                    className={`px-4 py-2 rounded-[20px] max-w-[280px] break-words
                  ${
                      isMyMessage
                          ? 'bg-green-500 text-white rounded-[20px]'
                          : 'bg-gray-100 text-gray-800 rounded-lg'
                  }`}
                                >
                                    <p>{message.content}</p>
                                    <span className="text-[10px] text-white">
                                        {new Date(
                                            message.createdAt
                                        ).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {isTyping && typingUser && (
                    <div className="text-gray-500 text-sm ml-2">
                        {typingUser} is typing...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="relative">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full border rounded-[20px] px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                    type="submit"
                    disabled={!isConnected || !newMessage.trim()}
                    className={`absolute right-2 top-1/2 transform -translate-y-1/2 
            ${
                !isConnected || !newMessage.trim()
                    ? 'opacity-50 cursor-not-allowed'
                    : 'text-green-500 hover:text-green-600'
            }`}
                >
                    <Image
                        src="/images/send.svg"
                        alt="Send"
                        width={24}
                        height={24}
                    />
                </button>
            </form>
        </div>
    );
}
