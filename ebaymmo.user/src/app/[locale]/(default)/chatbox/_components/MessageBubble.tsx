import MediaViewer from '@/components/BaseUI/MediaViewer';

interface MessageBubbleProps {
    message: any;
    isMyMessage: boolean;
    formatTime: (date: string) => string;
    showStatus?: boolean;
}

// Kiểm tra xem tin nhắn có chứa phần lớn là emoji không để hiển thị kích thước lớn hơn
const isMostlyEmojis = (text: string) => {
    const emojiRegex = /[\p{Emoji}]/gu;
    const emojis = text?.match(emojiRegex) || [];
    const textWithoutEmojis = text?.replace(emojiRegex, '').trim();
    return (
        (text?.length <= 8 && emojis.length > 0) ||
        (emojis.length > 0 && textWithoutEmojis.length < emojis.length * 2)
    );
};

export default function MessageBubble({
    message,
    isMyMessage,
    formatTime,
    showStatus = false
}: MessageBubbleProps) {
    return (
        <div
            className={`mb-4 flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
        >
            {/* Avatar bên trái cho tin nhắn của người khác */}
            {!isMyMessage && (
                <img
                    src={message.sender?.avatar || '/images/avatar.svg'}
                    alt={`${message.sender?.username}'s avatar`}
                    className="w-8 h-8 rounded-full mr-2 self-end"
                />
            )}

            <div
                className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'} max-w-[50vw]`}
            >
                <div
                    className={` px-[20px] ${
                        message.type === 'image' || message.type === 'video'
                            ? 'p-0 bg-transparent'
                            : `p-3 ${
                                  isMyMessage
                                      ? ' text-[var(--Neutral-500,#1C1C1C)] rounded-[10px] bg-[var(--Primary-200,#B9F7CD)] p-4 '
                                      : 'bg-gray-100 text-gray-800 rounded-bl-none'
                              }`
                    } rounded-lg break-words whitespace-pre-wrap`}
                >
                    {/* Hiển thị nội dung tin nhắn dựa vào loại (hình ảnh, video hoặc text) */}
                    {message.type === 'image' ? (
                        <MediaViewer
                            src={message.content}
                            type="image"
                            alt="Message image"
                            className="h-[250px] w-[250px]"
                        />
                    ) : message.type === 'video' ? (
                        <MediaViewer
                            src={message.content}
                            type="video"
                            className="h-[250px] w-[250px]"
                        />
                    ) : message.content ? (
                        <p
                            className={`${
                                isMostlyEmojis(message.content)
                                    ? 'text-2xl'
                                    : ''
                            } break-all whitespace-normal overflow-wrap-anywhere`}
                        >
                            {message.content}
                        </p>
                    ) : null}

                    {/* Hiển thị thời gian tin nhắn */}
                    <div className="flex items-center gap-1">
                        <p
                            className={`text-[11px] mt-1 ${
                                message.type === 'image'
                                    ? 'text-sm font-medium text-black drop-shadow-md'
                                    : isMyMessage
                                      ? 'text-[var(--Neutral-500,#1C1C1C)]'
                                      : 'text-gray-500'
                            }`}
                        >
                            {formatTime(message.createdAt)}
                        </p>
                    </div>
                </div>

                {/* Hiển thị trạng thái tin nhắn (chỉ cho tin nhắn của mình) */}
                {isMyMessage && showStatus && (
                    <span className="text-[11px] text-[var(--Neutral-500,#1C1C1C)] mt-1 mr-1">
                        {message.status === 'sent' ? 'Đã nhận' : 'Đã xem'}
                    </span>
                )}
            </div>

            {/* Avatar bên phải cho tin nhắn của mình */}
            {isMyMessage && (
                <img
                    src={message.sender?.avatar || '/images/avatar.svg'}
                    alt={`${message.sender?.username}'s avatar`}
                    className="w-8 h-8 rounded-full ml-2 self-end"
                />
            )}
        </div>
    );
}
