'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Conversation } from './types/chatbox.types';
import ModalUploadImage from './_components/ModalUploadImage';
import ChatSidebar from './_components/ChatSidebar';
import ChatHeader from './_components/ChatHeader';
import { useSession } from 'next-auth/react';
import ChatMessages from './_components/ChatMessages';
import ChatInput from './_components/ChatInput';
import { getOtherParticipant } from './_utils/conversation';
import { useSocketContext } from '@/contexts/SocketConnectionContext';
import { ChatProvider, useChatContext } from './_contexts/ChatContext';

// Component chính bao bọc ChatProvider
export default function ChatboxPage() {
    return (
        <ChatProvider>
            <ChatboxContent />
        </ChatProvider>
    );
}

function ChatboxContent() {
    // ----- HOOKS & CONTEXT -----
    const session = useSession();
    const router = useRouter();
    const { socket } = useSocketContext();
    const userData = useMemo(() => session.data?.user, [session.data?.user]);
    // Lấy dữ liệu từ ChatContext
    const {
        conversations,
        setConversations,
        currentConversation,
        setCurrentConversation,
        userStatuses
    } = useChatContext();

    // ----- STATE -----
    // Quản lý trạng thái modal tải lên hình ảnh
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    // Quản lý trạng thái đóng/mở sidebar
    const [isCollapsed, setIsCollapsed] = useState(false);
    // Quản lý responsive (mobile/desktop)
    const [isMobileView, setIsMobileView] = useState(false);

    // ----- RESPONSIVE HANDLING -----
    // Kiểm tra kích thước màn hình khi mount và khi thay đổi kích thước
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobileView(window.innerWidth < 768); // md breakpoint là 768px
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => {
            window.removeEventListener('resize', checkScreenSize);
        };
    }, []);

    // ----- CONVERSATION MANAGEMENT -----
    // Cập nhật trạng thái đã đọc tin nhắn
    const handleUpdateReadMessage = (conversationId: string) => {
        if (socket && userData) {
            // Gửi sự kiện đến server
            socket.emit('markConversationAsRead', {
                conversationId: conversationId
            });

            // Cập nhật hội thoại trong danh sách conversations
            try {
                // Tìm và cập nhật conversation trong mảng conversations
                const updatedConversations = conversations.map((conv) => {
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

                // Cập nhật state conversations
                setConversations(updatedConversations);
            } catch (error) {
                console.error('Lỗi khi cập nhật trạng thái đã đọc:', error);
            }
        }
    };

    // Xử lý khi chọn cuộc trò chuyện
    const handleConversationClick = (
        conversation: Conversation | undefined
    ) => {
        if (conversation) {
            // Xử lý khi chọn đối tượng Conversation có sẵn
            setCurrentConversation(conversation);

            if (socket && userData) {
                handleUpdateReadMessage(conversation._id);
            }

            // Xử lý routing cho cuộc trò chuyện với chính mình
            if (conversation.participants.length === 1) {
                router.push(`/chatbox?chatto=${userData?.username}`, {
                    scroll: false
                });
                return;
            }

            // Xử lý routing cho cuộc trò chuyện với người khác
            const otherParticipant = conversation.participants.find(
                (participant) => participant.username !== userData?.username
            );
            router.push(`/chatbox?chatto=${otherParticipant?.username}`, {
                scroll: false
            });
        }
    };

    // Xử lý quay lại danh sách cuộc trò chuyện trên mobile
    const handleBackToList = () => {
        setCurrentConversation(null as any);
        router.push('/chatbox', { scroll: false });
    };

    // ----- ROUTING HANDLING -----
    // Tạo một giá trị được memo hóa chỉ thay đổi khi số lượng hoặc ID của conversations thay đổi
    const conversationsSignature = useMemo(() => {
        return conversations.map((conv) => conv._id).join(',');
    }, [conversations]);

    // Sử dụng conversationsSignature trong dependency array
    useEffect(() => {
        // Kiểm tra session trước
        if (session.status === 'unauthenticated') {
            router.push('/');
            return;
        }
        // Đọc tham số 'chatto' từ URL
        const searchParams = new URLSearchParams(window.location.search);
        const chatTo = searchParams.get('chatto');

        if (chatTo) {
            // Tìm cuộc trò chuyện hiện có với người dùng chatTo
            const existingConversation = conversations.find((conv) => {
                const otherParticipant = getOtherParticipant(
                    conv,
                    userData?.username
                );
                return otherParticipant?.username === chatTo;
            });

            if (existingConversation) {
                setCurrentConversation(existingConversation);
                handleUpdateReadMessage(existingConversation._id);
            } else if (socket && userData) {
                // Nếu không có cuộc trò chuyện hiện có, tạo mới
                socket.emit('createConversation', { username: chatTo });
            }
        }
    }, [userData, session.status, conversationsSignature, socket]);

    return (
        <section className="w-full max-w-[1800px] flex flex-col mx-auto items-center">
            <div className="container w-full py-[50px] max-md:py-[20px] px-6 lg:px-32 2xl:px-36 flex flex-col justify-center max-w-[1800px]">
                <div className="flex flex-col gap-8">
                    <div
                        style={{
                            boxShadow: '0px 2px 15px 0px rgba(0, 45, 13, 0.10)'
                        }}
                        className="flex h-[calc(100vh-80px)] rounded-[30px] bg-neutral-50 border border-b-neutral-100 shadow-md overflow-hidden max-h-[710px] md:max-h-[710px] max-md:h-[calc(100vh-120px)] max-md:max-h-[calc(100vh-120px)] max-md:rounded-lg"
                    >
                        {/* Danh sách cuộc trò chuyện - Ẩn trên mobile khi cuộc trò chuyện được chọn */}
                        {(!isMobileView ||
                            (isMobileView && !currentConversation)) && (
                            <div
                                className={`transition-all duration-700 ease-in-out ${
                                    isCollapsed && !isMobileView
                                        ? 'w-[120px]'
                                        : 'w-[120px] md:w-[250px] lg:w-[400px] xl:w-[550px]'
                                } ${
                                    isCollapsed && !isMobileView
                                        ? 'max-w-[120px]'
                                        : 'max-w-[120px] md:max-w-[250px] lg:max-w-[400px] xl:max-w-[550px]'
                                } ${
                                    isMobileView && !currentConversation
                                        ? 'w-full max-w-full'
                                        : ''
                                }`}
                            >
                                <ChatSidebar
                                    onConversationClick={
                                        handleConversationClick
                                    }
                                    isCollapsed={isCollapsed}
                                    setIsCollapsed={setIsCollapsed}
                                />
                            </div>
                        )}

                        {/* Khu vực chat - Hiển thị toàn màn hình trên mobile khi cuộc trò chuyện được chọn */}
                        {(!isMobileView ||
                            (isMobileView && currentConversation)) && (
                            <div
                                className={`flex-1 flex flex-col h-full ${isMobileView && currentConversation ? 'w-full' : ''}`}
                            >
                                {currentConversation ? (
                                    <>
                                        <ChatHeader
                                            userStatuses={userStatuses}
                                            isMobileView={isMobileView}
                                            onBackClick={handleBackToList}
                                        />
                                        <ChatMessages />
                                        <ChatInput
                                            setIsUploadModalOpen={
                                                setIsUploadModalOpen
                                            }
                                        />
                                    </>
                                ) : (
                                    !isMobileView && (
                                        <div className="flex-1 flex items-center justify-center">
                                            <p className="text-gray-500">
                                                Chọn một cuộc trò chuyện để bắt
                                                đầu
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <ModalUploadImage
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                />
            </div>
        </section>
    );
}
