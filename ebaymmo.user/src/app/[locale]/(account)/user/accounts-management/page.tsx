'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    useGetUsersQuery,
    useEditUserProfileMutation,
    useChangeUserPasswordMutation,
    useEnable2FaMutation,
    useVerify2FaTokenMutation,
    useUserStatisticsQuery
} from '@/generated/graphql';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { useUserInfo } from '@/contexts/UserInfoContext';
import ProfileHeader from '../accounts-management/_components/ProfileHeader';
import UserStats from '../accounts-management/_components/UserStats';
import EditableField from './_components/EditableField';
import TwoFactorSetup from '../accounts-management/_components/TwoFactorSetup';
import LoginHistory from '../accounts-management/_components/LoginHistory';
import ApiPurchaseToggle from './_components/ApiPurchare';
import TelegramConnect from './_components/TelegramConnect';
import { useTranslations } from 'next-intl';

interface UserInfo {
    username: string;
    fullName: string | null;
    email: string;
    createAt: string | null;
    image: string | null;
    twoFactorEnabled?: boolean;
}

export default function AccountManagement() {
    const { userInfo: userInfoContext, loading: loadingContext } =
        useUserInfo();
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const { data: session, status, update } = useSession();
    const router = useRouter();
    const { showModal } = useStatusModal();
    const t = useTranslations('user.account-management.profile');
    const { data: userStatistics } = useUserStatisticsQuery({
        variables: { where: { userId: { _eq: userInfoContext?.userId } } }
    });

    const {
        data: userData,
        loading,
        refetch
    } = useGetUsersQuery({
        variables: { where: { userId: { _eq: session?.user?.id } }, offset: 0 },
        skip: !session?.user?.email
    });

    const [editUserProfile] = useEditUserProfileMutation();
    const [changePassword] = useChangeUserPasswordMutation();
    const [enable2FA] = useEnable2FaMutation();
    const [verify2FAToken] = useVerify2FaTokenMutation();
    const { uploadAvatar } = useUploadAvatar();

    const processedUserData = useMemo(() => {
        if (!userData?.users[0]) return null;
        const user = userData.users[0];
        return {
            fullName: user.fullName || null,
            username: user.username,
            email: user.email,
            createAt: user.createAt || null,
            image: user.images || session?.user?.image || null,
            twoFactorEnabled: user.twoFactorEnabled || false
        };
    }, [userData, session?.user?.image]);

    useEffect(() => {
        if (processedUserData) setUserInfo(processedUserData);
    }, [processedUserData]);

    useEffect(() => {
        if (status === 'unauthenticated') router.replace('/login');
    }, [status, router]);

    const handleEditUserProfile = async (publicUrl: string) => {
        if (!session?.user?.id) return;
        await editUserProfile({
            variables: { userId: session.user.id, input: { images: publicUrl } }
        });
        setUserInfo((prev) => (prev ? { ...prev, image: publicUrl } : null));
    };

    const handleEditFullName = async (newFullName: string) => {
        if (!session?.user?.id) return;
        await editUserProfile({
            variables: {
                userId: session.user.id,
                input: { fullName: newFullName }
            }
        });
        setUserInfo((prev) =>
            prev ? { ...prev, fullName: newFullName } : null
        );
    };

    const handleChangePassword = async (
        oldPassword: string,
        newPassword: string
    ) => {
        try {
            await changePassword({
                variables: {
                    token: session?.user?.refreshToken || '',
                    oldPassword,
                    newPassword
                }
            });
            showModal('success', 'Change password successfully');
        } catch (error: any) {
            if (error?.message) {
                showModal('error', error.message);
            } else {
                showModal('error', 'Change password failed');
            }
        }
    };

    const handleEnable2FA = async () => {
        const { data } = await enable2FA();
        return {
            qrCodeUrl: data?.enable2FA?.qrCodeUrl || '',
            secret: data?.enable2FA?.secret || ''
        };
    };

    const handleVerify2FAToken = async (token: string) => {
        const { data } = await verify2FAToken({ variables: { token } });
        return { success: data?.verify2FAToken?.success || false };
    };

    if (status !== 'authenticated') return null;

    return (
        <div className="p-6 lg:p-10 border-black-700 border-[1px] rounded-[15px]">
            {loading || loadingContext ? (
                <div className="mx-auto w-[940px] max-w-[100%]">
                    {/* Skeleton loading */}
                    <div className="h-8 w-48 bg-gray-200 rounded mb-6 animate-pulse" />
                    {/* Thêm skeleton nếu cần */}
                </div>
            ) : (
                <div className="mx-auto w-[940px] max-w-[100%]">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white lg:p-6">
                            {userInfo && (
                                <>
                                    <ProfileHeader
                                        userInfo={userInfoContext!}
                                        uploadAvatar={uploadAvatar}
                                        handleEditUserProfile={
                                            handleEditUserProfile
                                        }
                                        userId={session?.user?.id || ''}
                                        updateSession={async (data) => {
                                            await update(data);
                                        }}
                                    />
                                    <EditableField
                                        label={t('fullName')}
                                        value={userInfo.fullName}
                                        onSave={handleEditFullName}
                                        placeholder={t('fullNamePlaceholder')}
                                    />
                                    <div>
                                        <label className="block text-[18px] font-medium text-gray-700">
                                            {t('email')}
                                        </label>
                                        <p className="mt-1 text-[18px] text-gray-600">
                                            {userInfo.email ||
                                                'email@example.com'}
                                        </p>
                                    </div>
                                    <EditableField
                                        label={t('password')}
                                        value={null}
                                        type="password"
                                        onSave={async () => {}}
                                        onSavePassword={handleChangePassword}
                                        isPassword
                                        placeholder={t('passwordPlaceholder')}
                                    />
                                    <div className="border-[1px] border-border_color mt-[20px] mb-[20px] p-0" />
                                    <div>
                                        <label className="block text-[18px] font-medium text-gray-700">
                                            {t('registration-date')}
                                        </label>
                                        <p className="mt-1 text-[18px] text-gray-600">
                                            {userInfoContext?.createAt
                                                ? new Date(
                                                      userInfoContext.createAt
                                                  ).toLocaleDateString()
                                                : 'N/A'}
                                        </p>
                                    </div>
                                    <UserStats
                                        userStatistics={
                                            userStatistics?.userStatistics[0]
                                        }
                                    />
                                    <div className="border-[1px] border-border_color mt-[20px] mb-[20px] p-0" />
                                    <div
                                        id="security-settings"
                                        className="flex flex-col gap-[30px]"
                                    >
                                        {/* <ApiPurchaseToggle /> */}
                                        <TwoFactorSetup
                                            twoFactorEnabled={
                                                userInfo.twoFactorEnabled ||
                                                false
                                            }
                                            enable2FA={handleEnable2FA}
                                            verify2FAToken={
                                                handleVerify2FAToken
                                            }
                                            showModal={showModal}
                                            onUpdate={(enabled) =>
                                                setUserInfo((prev) =>
                                                    prev
                                                        ? {
                                                              ...prev,
                                                              twoFactorEnabled:
                                                                  enabled
                                                          }
                                                        : null
                                                )
                                            }
                                        />
                                        <TelegramConnect />
                                    </div>
                                    {/* <LoginHistory /> */}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
