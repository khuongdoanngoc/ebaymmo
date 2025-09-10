import { useEffect, useMemo, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { useChatContext } from '../_contexts/ChatContext';
import { useUserInfo } from '@/context/UserInfoContext';

export default function ChatMessages() {
    const { userInfo } = useUserInfo();
    const {
        messages,
        typingUsers,
        loadMoreMessages,
        isLoadingMore,
        currentConversation,
        hasMore
    } = useChatContext();

    const messageContainerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef<number>(0);
    const prevFirstMessageIdRef = useRef<string | null>(null);
    const isNearBottomRef = useRef<boolean>(true);

    const typingUser = useMemo(() => {
        return typingUsers[currentConversation?._id || ''];
    }, [typingUsers, currentConversation?._id]);

    const formatMessageTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

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

        if (scrollTop === 0) {
            const firstMessage = messages[0];
            loadMoreMessages(currentConversation?._id || '', firstMessage._id);
        }

        const scrollBottom = scrollHeight - scrollTop - clientHeight;
        isNearBottomRef.current = scrollBottom < 50;
    };

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.style.scrollBehavior = 'smooth';
            messageContainerRef.current.scrollTop =
                messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!messageContainerRef.current) return;

        const container = messageContainerRef.current;
        const { scrollTop, scrollHeight, clientHeight } = container;

        const scrollBottom = scrollHeight - scrollTop - clientHeight;
        isNearBottomRef.current = scrollBottom < 50;

        const prevLength = prevMessagesLengthRef.current;
        const currentLength = messages.length;
        const firstMessageId = messages[0]?._id || null;
        const prevFirstId = prevFirstMessageIdRef.current;

        if (prevLength > 0) {
            if (
                firstMessageId !== prevFirstId &&
                currentLength > prevLength &&
                !isLoadingMore
            ) {
                requestAnimationFrame(() => {
                    if (container) {
                        const diff = container.scrollHeight - scrollHeight;
                        container.scrollTop = diff;
                    }
                });
            } else if (currentLength > prevLength && isNearBottomRef.current) {
                requestAnimationFrame(() => {
                    if (container) {
                        container.scrollTop = container.scrollHeight;
                    }
                });
            }
        } else {
            requestAnimationFrame(() => {
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
            });
        }

        prevMessagesLengthRef.current = currentLength;
        prevFirstMessageIdRef.current = firstMessageId;
    }, [messages, isLoadingMore]);

    const renderedMessages = useMemo(() => {
        return messages.map((message, index) => {
            const isMyMessage = message.sender?.username === userInfo?.username;
            //console.log('message', message);
            const isLastMessage = index === messages.length - 1;
            return (
                <div key={index}>
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
            className="flex-1 overflow-y-auto p-4 space-y-4"
            onScroll={handleScroll}
        >
            {isLoadingMore && (
                <div className="text-center py-2">
                    <span className="text-gray-500">
                        Loading more messages...
                    </span>
                </div>
            )}

            {renderedMessages}

            {typingUser && typingUser !== userInfo?.username && (
                <div className="text-gray-500 text-sm">
                    {typingUser} is typing...
                </div>
            )}
        </div>
    );
}
