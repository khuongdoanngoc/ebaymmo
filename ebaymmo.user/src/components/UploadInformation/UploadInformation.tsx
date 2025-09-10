import { useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { useStatusModal } from '@/contexts/StatusModalContext';

interface UploadInformationProps {
    iconSrc: string;
    title: string;
    onUploadSuccess?: (url: string) => void;
}

export default function UploadInformation({
    iconSrc,
    title,
    onUploadSuccess
}: UploadInformationProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadAvatar } = useUploadAvatar();
    const { showModal } = useStatusModal();
    const { data: session } = useSession();
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file || !session?.user?.id) return;

        // Tạo preview URL ngay lập tức
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        try {
            const url = await uploadAvatar(file, session.user.id);
            onUploadSuccess?.(url);
        } catch (error) {
            console.error('Upload failed:', error);
            showModal('error', 'Upload failed');
            setPreviewUrl(''); // Reset preview nếu upload thất bại
        }
    };

    return (
        <div
            className="flex h-[120px] p-[10px] w-full flex-col justify-center items-center gap-[6px] flex-[1-0-0] rounded-[12px] border border-dashed border-[#33A959] bg-[#FFF] cursor-pointer"
            onClick={handleClick}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
            />

            {previewUrl ? (
                <div className="w-full h-full flex items-center justify-center">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            ) : (
                <>
                    <div className="flex flex-col self-center gap-[10px]">
                        <img
                            src={iconSrc}
                            alt="Upload Icon"
                            width="30"
                            height="30"
                        />
                    </div>
                    <div className="text-[#232338] self-stretch text-[16px] font-[500] text-center text-base leading-[160%]  line-clamp-2">
                        {title}
                    </div>
                </>
            )}
        </div>
    );
}
