import { useRef, useState, useEffect } from 'react';
import EmojiPicker, { Theme, EmojiClickData } from 'emoji-picker-react';
import Image from 'next/image';
import ImageSend from '@images/Vector.svg';
import { useChatContext } from '../_contexts/ChatContext';

interface ChatInputProps {
    setIsUploadModalOpen: (value: boolean) => void;
}

export default function ChatInput({ setIsUploadModalOpen }: ChatInputProps) {
    // ----- CONTEXT & STATE -----
    const {
        currentConversation,
        sendMessage,
        emitTyping,
        emitStopTyping,
        updateMessageReadStatus
    } = useChatContext();
    // Trạng thái hiển thị bảng chọn emoji
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    // Danh sách emoji gần đây được sử dụng
    const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
    const [messageInput, setMessageInput] = useState<string>('');

    // ----- REFS -----
    // Ref cho bảng chọn emoji để xử lý click bên ngoài
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    // Ref cho timeout để xử lý trạng thái đang nhập tin nhắn
    const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
    // Ref cho input để focus và cuộn
    const inputRef = useRef<HTMLInputElement>(null);

    // ----- MESSAGE HANDLING -----
    // Xử lý gửi tin nhắn
    const handleSendMessage = () => {
        if (currentConversation && messageInput.trim()) {
            sendMessage(currentConversation._id, messageInput, 'text');
            setMessageInput('');
            emitStopTyping(currentConversation._id || '');
        }
    };

    // Xử lý khi input thay đổi - phát hiện và thông báo trạng thái đang nhập
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessageInput(e.target.value);
        emitTyping(currentConversation?._id || '');

        // Reset timeout mỗi khi người dùng nhập
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Thiết lập timeout mới để dừng trạng thái typing sau 3 giây không có hoạt động
        typingTimeoutRef.current = setTimeout(() => {
            emitStopTyping(currentConversation?._id || '');
        }, 3000);
    };

    // ----- EMOJI HANDLING -----
    // Xử lý khi chọn emoji
    const handleEmojiClick = (emojiData: EmojiClickData) => {
        setMessageInput(messageInput + emojiData.emoji);

        // Thêm vào danh sách emoji gần đây
        setRecentEmojis((prev) => {
            const filtered = prev.filter((emoji) => emoji !== emojiData.emoji);
            const updated = [emojiData.emoji, ...filtered].slice(0, 8);
            localStorage.setItem('recentEmojis', JSON.stringify(updated));
            return updated;
        });

        setShowEmojiPicker(false);
    };

    // ----- EFFECTS -----
    // Tự động focus vào input khi chuyển cuộc trò chuyện
    useEffect(() => {
        if (currentConversation && inputRef.current) {
            // Kiểm tra xem input có nhìn thấy được trong viewport không
            const rect = inputRef.current.getBoundingClientRect();
            const isVisible =
                rect.top >= 0 &&
                rect.bottom <=
                    (window.innerHeight ||
                        document.documentElement.clientHeight);

            if (isVisible) {
                // Nếu nhìn thấy, sử dụng cuộn mượt
                inputRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end'
                });
            } else {
                // Nếu không nhìn thấy, cuộn ngay lập tức
                inputRef.current.scrollIntoView({
                    behavior: 'auto',
                    block: 'end'
                });
            }

            inputRef.current?.focus();
        }
    }, [currentConversation]);

    // Tải emoji gần đây từ localStorage khi component mount
    useEffect(() => {
        const savedEmojis = localStorage.getItem('recentEmojis');
        if (savedEmojis) {
            try {
                setRecentEmojis(JSON.parse(savedEmojis));
            } catch (error) {
                console.error(
                    'Failed to parse recent emojis from localStorage',
                    error
                );
            }
        }
    }, []);

    // Đóng bảng emoji khi click bên ngoài
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target as Node)
            ) {
                setShowEmojiPicker(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Cleanup timeout khi unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="p-4 border-t">
            <div className="relative bg-white rounded-xl shadow-md border-2 border-gray-200">
                {/* Các nút công cụ bên trái */}
                <div className="absolute top-4 left-4 flex items-center gap-6">
                    {/* Nút tải lên tập tin */}
                    <button
                        className="text-gray-400 hover:text-gray-600"
                        onClick={() => setIsUploadModalOpen(true)}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                        </svg>
                    </button>
                    {/* Bộ chọn emoji */}
                    <div className="relative">
                        <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </button>
                        {/* Hiển thị bảng chọn emoji khi showEmojiPicker = true */}
                        {showEmojiPicker && (
                            <div
                                className="absolute bottom-10 left-0 z-10"
                                ref={emojiPickerRef}
                            >
                                {/* Hiển thị emoji gần đây */}
                                {recentEmojis.length > 0 && (
                                    <div className="bg-white p-2 border-b border-gray-200">
                                        <div className="text-sm text-gray-500 mb-1">
                                            Recent
                                        </div>
                                        <div className="flex gap-1">
                                            {recentEmojis.map(
                                                (emoji, index) => (
                                                    <button
                                                        key={index}
                                                        className="hover:bg-gray-100 p-1 rounded"
                                                        onClick={() => {
                                                            setMessageInput(
                                                                messageInput +
                                                                    emoji
                                                            );
                                                        }}
                                                    >
                                                        {emoji}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                                <EmojiPicker
                                    onEmojiClick={handleEmojiClick}
                                    theme={Theme.LIGHT}
                                    width={300}
                                    height={400}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Input nhập tin nhắn */}
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Type a message..."
                    className="w-full pt-16 pb-6 px-5 rounded-xl text-base focus:outline-none min-h-[80px]"
                    value={messageInput}
                    onChange={handleInputChange}
                    onFocus={() => {
                        updateMessageReadStatus(currentConversation?._id || '');
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSendMessage();
                        }
                    }}
                />

                {/* Nút gửi tin nhắn */}
                <button
                    className="absolute bottom-5 right-5 text-green-500 hover:text-green-600"
                    onClick={handleSendMessage}
                >
                    <div className="w-[25px] h-[25px]">
                        <Image
                            src={ImageSend}
                            alt="close"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </button>
            </div>
        </div>
    );
}
