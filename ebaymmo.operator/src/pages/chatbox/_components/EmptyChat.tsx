export default function EmptyChat() {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                </svg>
                <h3 className="mt-4 text-xl font-medium text-gray-700">
                    Chọn một cuộc trò chuyện
                </h3>
                <p className="mt-2 text-gray-500">
                    Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu
                    nhắn tin.
                </p>
            </div>
        </div>
    );
}
