'use client';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useGetUsersQuery } from '@/generated/graphql';
import StatusModal from '@/components/StatusModal/StatusModal';
import { useUserInfo } from '@/contexts/UserInfoContext';
import { useTranslations } from 'next-intl';

function TelegramStatus({ referralCode }: { referralCode?: string }) {
    const t = useTranslations('user.account-management.telegram');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const prevConnectedRef = useRef(false);
    const initialCheckDoneRef = useRef(false);

    // Sử dụng userInfo context để lấy trạng thái kết nối
    const { userInfo, loading } = useUserInfo();
    const isConnected = userInfo?.telegramConnectionStatus ?? false;

    // Tạo display name cho Telegram
    const telegramDisplayName = getTelegramDisplayName(
        userInfo?.telegramConnections
    );

    // Thiết lập trạng thái ban đầu khi component mount
    useEffect(() => {
        // Ban đầu, thiết lập trạng thái đã kết nối nếu đã có dữ liệu
        if (userInfo && !initialCheckDoneRef.current) {
            const wasConnected = userInfo.telegramConnectionStatus ?? false;
            prevConnectedRef.current = wasConnected;
            initialCheckDoneRef.current = true;
        }
    }, [userInfo]);

    // Hiển thị modal khi trạng thái kết nối thay đổi từ false sang true
    useEffect(() => {
        // Chỉ xử lý sau khi đã kiểm tra trạng thái ban đầu
        if (!initialCheckDoneRef.current) return;

        if (isConnected && !prevConnectedRef.current && telegramDisplayName) {
            setIsModalOpen(true);
        }

        prevConnectedRef.current = isConnected;
    }, [isConnected, telegramDisplayName]);

    const handleTelegramClick = () => {
        if (referralCode) {
            window.open(
                `https://t.me/SHOP3_TELE_bot?start=${referralCode}`,
                '_blank'
            );
        }
    };

    return (
        <>
            <div className="mt-1 flex justify-between items-center">
                <div>
                    {loading ? (
                        <span className="text-gray-500">{t('loading')}</span>
                    ) : isConnected ? (
                        <div>
                            <span className="text-green-500">
                                {t('connected')}
                            </span>
                            {telegramDisplayName && (
                                <span className="ml-2">
                                    ({telegramDisplayName})
                                </span>
                            )}
                        </div>
                    ) : (
                        <>
                            <span className="text-red-500">
                                {t('not-connected')}
                            </span>
                            <span className="text-green-500 ml-1">
                                {t('hint')}
                            </span>
                        </>
                    )}
                </div>
                <div
                    className={
                        isConnected ? 'pointer-events-none opacity-50' : ''
                    }
                >
                    <button
                        onClick={handleTelegramClick}
                        className="text-blue-500 hover:text-blue-600"
                        disabled={isConnected || loading}
                    >
                        <Image
                            src="/images/telegram.svg"
                            width={32}
                            height={32}
                            alt={t('title')}
                            className="text-blue-500"
                        />
                    </button>
                </div>
            </div>

            <StatusModal
                type="success"
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                message={
                    telegramDisplayName
                        ? t('success', { name: telegramDisplayName })
                        : t('success-no-name')
                }
            />
        </>
    );
}

// Helper function để lấy tên hiển thị của Telegram
function getTelegramDisplayName(telegramConnections: any): string | null {
    if (!telegramConnections) return null;

    if (telegramConnections.telegramUsername) {
        return `@${telegramConnections.telegramUsername}`;
    }

    const firstName = telegramConnections.telegramFirstName || '';
    const lastName = telegramConnections.telegramLastName || '';

    if (firstName || lastName) {
        return `${firstName} ${lastName}`.trim();
    }

    return null;
}

export default function TelegramConnect() {
    const t = useTranslations('user.account-management.telegram');
    const { data } = useGetUsersQuery({
        variables: {
            limit: 1
        }
    });

    return (
        <div>
            <label className="block text-[18px] font-medium text-gray-700">
                {t('title')}
            </label>
            <TelegramStatus referralCode={data?.users[0]?.referralCode} />
        </div>
    );
}
