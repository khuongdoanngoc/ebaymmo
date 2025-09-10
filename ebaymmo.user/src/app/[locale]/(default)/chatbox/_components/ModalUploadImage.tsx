import Modal from '@/components/Modal/Modal';
import React, { useState } from 'react';
import Image from 'next/image';
import Button from '@/components/BaseUI/Button/button';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { useSession } from 'next-auth/react';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { useChatContext } from '../_contexts/ChatContext';

interface ModalUploadImageProps {
    isOpen: boolean;
    onClose: () => void;
}

const ModalUploadImage: React.FC<ModalUploadImageProps> = ({
    isOpen,
    onClose
}) => {
    // ----- HOOKS & STATE -----
    const { data: session } = useSession();
    const { showModal } = useStatusModal();
    const { uploadAvatar } = useUploadAvatar();
    const { currentConversation, sendMessage } = useChatContext();

    // Trạng thái upload
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<'image' | 'video'>('image');

    // ----- EVENT HANDLERS -----
    // Xử lý khi chọn file
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Kiểm tra kích thước file video
        if (
            file.type.startsWith('video/') &&
            file.size > Number(process.env.NEXT_PUBLIC_MAX_VIDEO_SIZE)
        ) {
            showModal('error', 'Video size must be less than 100MB');
            event.target.value = ''; // Reset input
            return;
        }

        // Tạo URL xem trước và cập nhật state
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setSelectedFile(file);
        setFileType(file.type.startsWith('video/') ? 'video' : 'image');
    };

    // Xử lý tải lên và gửi hình ảnh/video
    const handleUploadImageOrVideo = async () => {
        if (!selectedFile || !session?.user?.id || !currentConversation) return;

        try {
            setUploading(true);
            const type = selectedFile.type.startsWith('video/')
                ? 'video'
                : 'image';

            // Upload lên server và lấy URL
            const imageUrl = await uploadAvatar(selectedFile, session.user.id);

            // Gửi tin nhắn với URL hình ảnh/video
            sendMessage(currentConversation._id, imageUrl, type);

            // Reset trạng thái
            setSelectedFile(null);
            setPreviewUrl(null);
            onClose();
        } catch (error) {
            console.error('Upload failed:', error);
            showModal('error', 'Failed to upload media');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            title="Choose media"
            onClose={onClose}
            className="w-[95%] md:w-[800px] lg:w-[1000px] max-w-[1000px] absolute inset-0 m-auto h-fit p-[15px]"
        >
            <div className="flex flex-col items-center gap-[20px] p-8 ">
                {/* Hiển thị loading khi đang upload */}
                {uploading ? (
                    <div className="w-full h-[100px] md:h-[200px] border-2 border-dashed border-primary-500 rounded-lg flex flex-col items-center justify-center gap-2 p-4">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-green-500 h-2.5 rounded-full w-1/2" />
                        </div>
                        <span className="text-gray-600">Uploading...</span>
                    </div>
                ) : (
                    <>
                        {/* Input file ẩn */}
                        <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,image/gif,video/mp4,video/webm,video/quicktime,video/x-msvideo"
                            onChange={handleFileSelect}
                            id="avatar-upload"
                        />

                        {/* Khu vực kéo thả file */}
                        <label
                            htmlFor="avatar-upload"
                            className="w-full h-[300px] border-2 border-dashed border-primary-500 rounded-lg 
                                flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50"
                        >
                            {previewUrl ? (
                                <div className="w-[300px] h-[300px] relative">
                                    {fileType === 'video' ? (
                                        <video
                                            src={previewUrl}
                                            controls
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    ) : (
                                        <Image
                                            src={previewUrl}
                                            fill
                                            alt="Preview"
                                            className="object-cover rounded-lg"
                                        />
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Image
                                        src="/images/cloud-upload.svg"
                                        width={32}
                                        height={32}
                                        alt="Upload"
                                    />
                                    <span className="text-gray-600">
                                        Choose Profile Picture or Video
                                    </span>
                                </>
                            )}
                        </label>

                        {/* Nút upload */}
                        <Button
                            onClick={handleUploadImageOrVideo}
                            className="mt-4 w-[800px] text-lg font-semibold py-3 min-w-[400px] max-w-[55%]"
                            disabled={!selectedFile}
                        >
                            Upload
                        </Button>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default ModalUploadImage;
