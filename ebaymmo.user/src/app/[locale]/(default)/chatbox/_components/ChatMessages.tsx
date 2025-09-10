import { useEffect, useMemo, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { useChatContext } from '../_contexts/ChatContext';
import { useUserInfo } from '@/contexts/UserInfoContext';

export default function ChatMessages() {
    // ----- STATE & CONTEXT -----
    const { userInfo } = useUserInfo();
    const {
        messages,
        typingUsers,
        loadMoreMessages,
        isLoadingMore,
        currentConversation,
        hasMore
    } = useChatContext();

    // ----- REFS -----
    // Ref cho container tin nhắn
    const messageContainerRef = useRef<HTMLDivElement>(null);
    // Lưu số lượng tin nhắn trước đó để phát hiện tin nhắn mới hoặc cũ
    const prevMessagesLengthRef = useRef<number>(0);
    // Lưu ID tin nhắn đầu tiên để phát hiện nếu có tin nhắn cũ được tải
    const prevFirstMessageIdRef = useRef<string | null>(null);
    // Theo dõi xem người dùng có đang ở cuối cuộc trò chuyện không
    const isNearBottomRef = useRef<boolean>(true);

    // ----- DERIVED STATE -----
    // Lấy người dùng đang nhập trong cuộc trò chuyện hiện tại
    const typingUser = useMemo(() => {
        return typingUsers[currentConversation?._id || ''];
    }, [typingUsers, currentConversation?._id]);

    // ----- HELPER FUNCTIONS -----
    // Format thời gian hiển thị cho tin nhắn
    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ----- SCROLL HANDLING -----
    // Xử lý sự kiện cuộn để tải thêm tin nhắn cũ và cập nhật trạng thái cuộn
    const handleScroll = () => {
        if (
            !messageContainerRef.current ||
            messages.length === 0 ||
            isLoadingMore ||
            !hasMore
        )
            return;

        const container = messageContainerRef.current;
        const { scrollTop, scrollHeight, clientHeight } = container;

        // Tải thêm tin nhắn khi cuộn lên đầu
        if (scrollTop === 0) {
            const firstMessage = messages[0];
            loadMoreMessages(currentConversation?._id || '', firstMessage._id);
        }

        // Cập nhật trạng thái xem người dùng có ở gần cuối không
        const scrollBottom = scrollHeight - scrollTop - clientHeight;
        isNearBottomRef.current = scrollBottom < 50;
    };

    // ----- EFFECTS -----
    // Xử lý cuộn tự động khi có tin nhắn mới
    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.style.scrollBehavior = 'smooth';
            messageContainerRef.current.scrollTop =
                messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Logic phức tạp để xử lý vị trí cuộn dựa trên việc tải tin nhắn mới hay cũ
    useEffect(() => {
        if (!messageContainerRef.current) return;

        const container = messageContainerRef.current;
        const { scrollTop, scrollHeight, clientHeight } = container;

        // Lưu trạng thái xem người dùng có đang ở cuối không
        const scrollBottom = scrollHeight - scrollTop - clientHeight;
        isNearBottomRef.current = scrollBottom < 50;

        // Xác định nếu tin nhắn mới được thêm vào hoặc tin nhắn cũ được tải
        const prevLength = prevMessagesLengthRef.current;
        const currentLength = messages.length;
        const firstMessageId = messages[0]?._id || null;
        const prevFirstId = prevFirstMessageIdRef.current;

        // Bỏ qua khi component mới mount
        if (prevLength > 0) {
            // Nếu tin nhắn cũ được tải (ID đầu tiên thay đổi và số lượng tin nhắn tăng)
            if (
                firstMessageId !== prevFirstId &&
                currentLength > prevLength &&
                !isLoadingMore
            ) {
                // Giữ nguyên vị trí cuộn khi tải tin nhắn cũ
                requestAnimationFrame(() => {
                    if (container) {
                        const diff = container.scrollHeight - scrollHeight;
                        container.scrollTop = diff;
                    }
                });
            }
            // Nếu có tin nhắn mới ở cuối và người dùng đang ở cuối
            else if (currentLength > prevLength && isNearBottomRef.current) {
                // Cuộn xuống cuối cho tin nhắn mới
                requestAnimationFrame(() => {
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                });
            }
            // Ngược lại, không thay đổi vị trí cuộn
        } else {
            // Lần tải đầu tiên - cuộn xuống cuối
            requestAnimationFrame(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            });
        }

        // Cập nhật refs cho lần so sánh tiếp theo
        prevMessagesLengthRef.current = currentLength;
        prevFirstMessageIdRef.current = firstMessageId;
    }, [messages, isLoadingMore]);

    // ----- RENDER LOGIC -----
    // Tạo các thành phần tin nhắn với hiệu ứng animation
    const renderedMessages = useMemo(() => {
        return messages.map((message, index) => {
            const isMyMessage = message.sender?.username === userInfo?.username;
            const isLastMessage = index === messages.length - 1;
            return (
                <div
                    key={index}
                    className={`opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] ${isMyMessage ? 'animate-[slideFromRight_0.5s_ease-out_forwards]' : 'animate-[slideFromLeft_0.5s_ease-out_forwards]'}`}
                    style={{
                        animationDelay: `${index * 50}ms`
                    }}
                >
                    <MessageBubble
                        message={message}
                        isMyMessage={isMyMessage}
                        formatTime={formatMessageTime}
                        showStatus={isMyMessage && isLastMessage}
                    />
                </div>
            );
        });
    }, [messages, userInfo?.username]);

    return (
        <div
            ref={messageContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 overflow-x-hidden smooth-scroll"
            onScroll={handleScroll}
        >
            {/* Hiển thị trạng thái đang tải thêm tin nhắn */}
            {isLoadingMore && (
                <div className="text-center py-2">
                    <span className="text-gray-500">
                        Loading more messages...
                    </span>
                </div>
            )}

            {/* Danh sách tin nhắn */}
            {renderedMessages}

            {/* Hiển thị trạng thái đang nhập của người dùng khác */}
            {typingUser && typingUser !== userInfo?.username && (
                <div className="text-gray-500 text-sm">
                    {typingUser} is typing...
                </div>
            )}
        </div>
    );
}
