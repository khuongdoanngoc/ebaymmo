'use client';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Conversation } from '@/hooks/useChatSDK';
import ModalUploadImage from '@/pages/chatbox/_components/ModalUploadImage';
import ChatSidebar from '@/pages/chatbox/_components/ChatSidebar';
import ChatHeader from '@/pages/chatbox/_components/ChatHeader';
import ChatMessages from '@/pages/chatbox/_components/ChatMessages';
import ChatInput from '@/pages/chatbox/_components/ChatInput';
import { getOtherParticipant } from '@/pages/chatbox/_utils/conversation';
import {
    SocketProvider,
    useSocketContext
} from '@/context/SocketConnectionContext';
import {
    ChatProvider,
    useChatContext
} from '@/pages/chatbox/_contexts/ChatContext';
import { jwtDecode } from 'jwt-decode';
import { IDataTokenDecode } from '@/types/global.type';
import { useUserInfoSubscription } from '@/generated/graphql';
import { StatusModalProvider } from '@/context/StatusModalContext';
import { UserInfoProvider } from '@/context/UserInfoContext';
// Component chính bao bọc ChatProvider
export default function ChatboxPage() {
    return (
        <UserInfoProvider>
            <StatusModalProvider>
                <SocketProvider>
                    <ChatProvider>
                        <ChatboxContent />
                    </ChatProvider>
                </SocketProvider>
            </StatusModalProvider>
        </UserInfoProvider>
    );
}

function ChatboxContent() {
    // ----- HOOKS & CONTEXT -----
    // const session = useSession();
    // const router = useRouter();
    const navigate = useNavigate();
    const { socket } = useSocketContext();
    const token = localStorage.getItem('accessToken');
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

    const userData = useMemo(() => data?.usersByPk, [data?.usersByPk]);
    //console.log('userData', userData);
    // Lấy dữ liệu từ ChatContext
    const {
        conversations,
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
            socket.emit('markConversationAsRead', {
                conversationId: conversationId
            });
        }
    };

    // Xử lý khi chọn cuộc trò chuyện
    const handleConversationClick = (
        conversation: Conversation | string | undefined,
        isFind?: boolean
    ) => {
        if (typeof conversation === 'string') {
            if (isFind === true) {
                // Tìm kiếm cuộc trò chuyện hiện có với username
                const existingConversation: any = conversations.find((conv) => {
                    const otherParticipant = getOtherParticipant(
                        conv,
                        userData?.username
                    );
                    return otherParticipant?.username === conversation;
                });
                // Nếu không tìm thấy, tạo cuộc trò chuyện mới
                if (!existingConversation) {
                    if (socket && userData) {
                        socket.emit('createConversation', {
                            username: conversation
                        });
                    }
                    return;
                }

                // Nếu tìm thấy, chuyển đến cuộc trò chuyện đó
                setCurrentConversation(existingConversation);

                // Xử lý routing cho cuộc trò chuyện với chính mình
                if (existingConversation.participants.length === 1) {
                    navigate(`/admin/chatbox?chatto=${userData?.username}`, {
                        state: { preventScroll: false }
                    });
                    return;
                }

                // Xử lý routing cho cuộc trò chuyện với người khác
                const otherParticipant = existingConversation.participants.find(
                    (participant: any) =>
                        participant.username !== userData?.username
                );
                navigate(
                    `/admin/chatbox?chatto=${otherParticipant?.username}`,
                    {
                        state: { preventScroll: true }
                    }
                );
            } else {
                // Tạo cuộc trò chuyện mới từ username
                if (socket && userData) {
                    socket.emit('createConversation', {
                        username: conversation
                    });
                }
            }
        } else if (conversation) {
            // Xử lý khi chọn đối tượng Conversation có sẵn
            setCurrentConversation(conversation);

            if (socket && userData) {
                handleUpdateReadMessage(conversation._id);
            }

            // Kiểm tra nếu là cuộc trò chuyện nhóm
            if (conversation.type === 'group') {
                navigate(`/admin/chatbox?groupId=${conversation._id}`, {
                    state: { preventScroll: true }
                });
                return;
            }

            // Xử lý routing cho cuộc trò chuyện với chính mình
            if (conversation.participants.length === 1) {
                navigate(`/admin/chatbox?chatto=${userData?.username}`, {
                    state: { preventScroll: true }
                });
                return;
            }

            // Xử lý routing cho cuộc trò chuyện với người khác
            const otherParticipant = conversation.participants.find(
                (participant) => participant.username !== userData?.username
            );
            navigate(`/admin/chatbox?chatto=${otherParticipant?.username}`, {
                state: { preventScroll: true }
            });
        }
    };

    // Xử lý quay lại danh sách cuộc trò chuyện trên mobile
    const handleBackToList = () => {
        setCurrentConversation(null as any);
        navigate('/admin/chatbox', { state: { preventScroll: true } });
    };

    // ----- ROUTING HANDLING -----
    // Xử lý chuyển hướng từ query params
    useEffect(() => {
        // Kiểm tra session trước
        if (token === null) {
            navigate('/');
            return;
        }

        // Đọc tham số từ URL
        const searchParams = new URLSearchParams(window.location.search);
        const chatTo = searchParams.get('chatto');
        const groupId = searchParams.get('groupId');

        // Xử lý trường hợp groupId (chat nhóm)
        if (groupId) {
            const groupConversation = conversations.find(
                (conv) => conv._id === groupId && conv.type === 'group'
            );

            if (groupConversation) {
                socket?.emit('joinConversation', {
                    conversationId: groupConversation._id
                });
                setCurrentConversation(groupConversation);
                handleUpdateReadMessage(groupConversation._id);
            }
            return;
        }

        // Xử lý trường hợp chatTo (chat 1-1)
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
                // Nếu cuộc trò chuyện tồn tại, đặt làm hiện tại
                socket?.emit('joinConversation', {
                    conversationId: existingConversation._id
                });
                setCurrentConversation(existingConversation);
                handleUpdateReadMessage(existingConversation._id);
            } else if (socket && userData) {
                // Nếu không có cuộc trò chuyện hiện có, tạo mới
                socket.emit('createConversation', { username: chatTo });
            }
        }
    }, [navigate, conversations, userData]);

    return (
        <section className="w-full max-w-[1800px] flex flex-col mx-auto items-center">
            <div className="container w-full py-[50px] max-md:py-[20px] px-6 lg:px-[10px] flex flex-col justify-center max-w-[1800px]">
                <div className="flex flex-col gap-8">
                    <div
                        style={{
                            boxShadow: '0px 2px 15px 0px rgba(0, 45, 13, 0.10)'
                        }}
                        className="flex h-[calc(100vh-80px)] bg-neutral-50 border border-b-neutral-100 shadow-md overflow-hidden max-h-[710px] md:max-h-[710px] max-md:h-[calc(100vh-120px)] max-md:max-h-[calc(100vh-120px)] max-md:rounded-lg"
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
                                        : 'max-w-[120px] md:max-w-[250px] lg:max-w-[400px] xl:max-w-[400px]'
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
