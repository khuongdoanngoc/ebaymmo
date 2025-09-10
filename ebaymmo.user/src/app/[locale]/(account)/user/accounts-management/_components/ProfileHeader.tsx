'use client';

import Image from 'next/image';
import { useState } from 'react';
import Button from '@/components/BaseUI/Button/button';
import type { UserInfo } from '@/contexts/UserInfoContext';
import { useTranslations } from 'next-intl';
import { useStatusModal } from '@/contexts/StatusModalContext';

interface ProfileHeaderProps {
    userInfo: UserInfo;
    uploadAvatar: (file: File, userId: string) => Promise<string>;
    handleEditUserProfile: (publicUrl: string) => Promise<void>;
    userId: string;
    updateSession: (data: any) => Promise<void>;
}

export default function ProfileHeader({
    userInfo,
    uploadAvatar,
    handleEditUserProfile,
    userId,
    updateSession
}: ProfileHeaderProps) {
    const t = useTranslations('user.account-management.profile');
    const { showModal } = useStatusModal();
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            showModal('error', t('fileTypeError'));
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setSelectedFile(file);
    };

    const handleUploadImage = async () => {
        if (!selectedFile || !userId) return;
        try {
            setUploading(true);
            const publicUrl = await uploadAvatar(selectedFile, userId);
            await handleEditUserProfile(publicUrl);
            await updateSession({ user: { image: publicUrl } });
            setSelectedFile(null);
            setPreviewUrl(null);
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                {t('title')}
            </h2>
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <Image
                        src={userInfo?.images || '/images/telegram.svg'}
                        width={200}
                        height={200}
                        alt={t('avatar')}
                        className="rounded-lg mb-4"
                    />
                </div>
                <div className="flex flex-col items-center gap-[20px]">
                    {uploading ? (
                        <div className="w-full h-[120px] border-2 border-dashed border-primary-500 rounded-lg flex flex-col items-center justify-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full w-1/2" />
                            </div>
                            <span className="text-gray-600">
                                {t('uploading')}
                            </span>
                        </div>
                    ) : (
                        <>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/png,image/gif"
                                onChange={handleFileSelect}
                                id="avatar-upload"
                            />
                            <label
                                htmlFor="avatar-upload"
                                className="w-full min-h-[120px] border-2 border-dashed border-primary-500 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50"
                            >
                                {previewUrl ? (
                                    <Image
                                        src={previewUrl}
                                        width={300}
                                        height={200}
                                        alt={t('preview')}
                                        className="object-cover rounded-lg"
                                    />
                                ) : (
                                    <>
                                        <Image
                                            src="/images/cloud-upload.svg"
                                            width={32}
                                            height={32}
                                            alt={t('upload')}
                                        />
                                        <span className="text-gray-600">
                                            {t('choose-picture')}
                                        </span>
                                    </>
                                )}
                            </label>
                            <Button
                                onClick={handleUploadImage}
                                disabled={!selectedFile}
                            >
                                {t('save')}
                            </Button>
                        </>
                    )}
                </div>
            </div>
            <div className="mt-8">
                {/* <div className="text-sm text-gray-600 mb-2">{t('points')}</div>
                <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full w-[30%] bg-green-500 rounded-full" />
                    </div>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-green-500 font-medium">
                        {t('level', { level: 0 })}
                    </span>
                    <span className="text-gray-600">
                        {t('points-to-next', { points: 10, nextLevel: 1 })}
                    </span>
                </div> */}
            </div>
            <div className="mt-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-gray-700 font-medium">
                        {t('account')}
                    </span>
                    <span
                        className={`px-3 py-1 ${userInfo?.twoFactorEnabled ? 'bg-green-100 text-green-600' : 'bg-secondary-100 text-secondary-600'} rounded-full text-sm`}
                    >
                        {userInfo?.twoFactorEnabled
                            ? t('kyc-verified')
                            : t('kyc-unverified')}
                    </span>
                </div>
                <div className="text-gray-600">
                    @{userInfo?.username || t('username')}
                </div>
            </div>
        </div>
    );
}
