'use client';

import { Switch } from '@headlessui/react';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import Modal from '@/components/BaseUI/Modal';
import Input from '@/components/BaseUI/Input';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface TwoFactorSetupProps {
    twoFactorEnabled: boolean;
    enable2FA: () => Promise<{ qrCodeUrl: string; secret: string }>;
    verify2FAToken: (token: string) => Promise<{ success: boolean }>;
    showModal: (
        type: 'success' | 'loading' | 'warning' | 'error',
        message?: string
    ) => void;
    onUpdate: (enabled: boolean) => void;
}

export default function TwoFactorSetup({
    twoFactorEnabled,
    enable2FA,
    verify2FAToken,
    showModal,
    onUpdate
}: TwoFactorSetupProps) {
    const t = useTranslations('user.account-management.2fa');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [secret, setSecret] = useState('');
    const [verifying, setVerifying] = useState(false);

    const handleTwoFactorToggle = async () => {
        if (!twoFactorEnabled) {
            try {
                const { qrCodeUrl, secret } = await enable2FA();
                setQrCodeUrl(qrCodeUrl);
                setSecret(secret);
                setIsModalOpen(true);
            } catch (error) {
                showModal(
                    'error',
                    'Cannot activate 2FA. Please try again later'
                );
            }
        }
    };

    const handleConfirm2FA = async () => {
        if (otpCode.length !== 6) {
            showModal('error', 'OTP must be 6 digits');
            return;
        }
        setVerifying(true);
        try {
            const { success } = await verify2FAToken(otpCode);
            if (success) {
                showModal('success', '2FA activated successfully.');
                onUpdate(true);
                handleCloseModal();
            } else {
                showModal('error', 'OTP is not correct.');
            }
        } catch (error) {
            showModal('error', 'Cannot verify OTP.');
        } finally {
            setVerifying(false);
        }
    };

    const handleCopySecret = () => {
        navigator.clipboard
            .writeText(secret)
            .then(() => showModal('success', 'Secret key copied.'))
            .catch(() => showModal('error', 'Cannot copy secret key.'));
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setOtpCode('');
        setQrCodeUrl('');
        setSecret('');
    };

    // Kiểm tra nếu cần cuộn đến phần 2FA khi component được render
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const shouldScroll = localStorage.getItem('scrollTo2FA');
            if (shouldScroll === 'true') {
                // Xóa flag sau khi đã sử dụng
                localStorage.removeItem('scrollTo2FA');

                // Đợi DOM hoàn thành render
                setTimeout(() => {
                    const element =
                        document.getElementById('security-settings');
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 500);
            }
        }
    }, []);

    return (
        <>
            <div id="security-settings">
                <label className="block text-[18px] font-medium text-gray-700">
                    {t('title')}
                </label>
                <div className="mt-1 flex justify-between items-center">
                    <div>
                        <span
                            className={
                                twoFactorEnabled
                                    ? 'text-green-500'
                                    : 'text-red-500'
                            }
                        >
                            {twoFactorEnabled ? t('enabled') : t('not-enabled')}
                        </span>
                        <span className="text-green-500 ml-1">{t('hint')}</span>
                    </div>
                    <Switch
                        checked={twoFactorEnabled}
                        onChange={handleTwoFactorToggle}
                        disabled={twoFactorEnabled}
                        className={`${twoFactorEnabled ? 'bg-green-500' : 'bg-gray-200'} relative inline-flex h-6 w-11 items-center rounded-full ${twoFactorEnabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    >
                        <span
                            className={`${twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}
                        />
                    </Switch>
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={t('title')}
                width="50%"
                noButton={true}
            >
                <div className="p-6 flex flex-col items-center max-h-[80vh] overflow-y-auto scrollbar scrollbar-thin scrollbar-thumb-green_main">
                    <div className="mb-8 w-[200px] h-[200px] relative">
                        {qrCodeUrl && (
                            <Image
                                src={qrCodeUrl}
                                alt={t('qr-code')}
                                fill
                                className="object-contain"
                            />
                        )}
                    </div>
                    <p className="text-center mb-8 text-[16px] font-bold">
                        {t('scan-instruction')}
                    </p>
                    <div className="border-[1px] border-border_color w-full mb-4" />
                    <div className="relative mt-2 mb-4">
                        <div className="absolute top-[-37px] left-[50%] bg-white px-7 text-[16px] text-[#3F3F3F] font-medium leading-6">
                            {t('or')}
                        </div>
                    </div>
                    <div className="w-full mb-6">
                        <p className="mb-[20px] text-left text-neutral-400 font-bold">
                            {t('secret-key')}
                        </p>
                        <div className="flex items-center justify-between bg-white p-3 rounded-[80px] border border-black">
                            <span className="font-mono text-[20px]">
                                {secret}
                            </span>
                            <button
                                onClick={handleCopySecret}
                                className="flex items-center gap-2 bg-[#EF4444] hover:bg-[#DC2626] text-white px-4 py-2 rounded-[80px] transition-colors"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M13.3333 6H7.33333C6.59695 6 6 6.59695 6 7.33333V13.3333C6 14.0697 6.59695 14.6667 7.33333 14.6667H13.3333C14.0697 14.6667 14.6667 14.0697 14.6667 13.3333V7.33333C14.6667 6.59695 14.0697 6 13.3333 6Z"
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M3.33333 10H2.66667C2.31305 10 1.97391 9.85953 1.72386 9.60948C1.47381 9.35943 1.33334 9.02029 1.33334 8.66667V2.66667C1.33334 2.31305 1.47381 1.97391 1.72386 1.72386C1.97391 1.47381 2.31305 1.33334 2.66667 1.33334H8.66667C9.02029 1.33334 9.35943 1.47381 9.60948 1.72386C9.85953 1.97391 10 2.31305 10 2.66667V3.33334"
                                        stroke="white"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                {t('copy')}
                            </button>
                        </div>
                    </div>
                    <div className="text-[15px] mb-4 text-left w-full flex flex-row gap-2">
                        <p className="text-red-500">{t('note')}</p>
                        <p className="text-green_main">{t('save-code')}</p>
                        <Link
                            href="/2fa"
                            className="text-green-500 ml-2 underline"
                        >
                            {t('get-otp')}
                        </Link>
                    </div>
                    <div className="border-[1px] border-border_color w-full mb-4 mt-4" />
                    <div className="w-full mb-6">
                        <Input
                            type="text"
                            label={t('enter-otp')}
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) =>
                                setOtpCode(e.target.value.replace(/\D/g, ''))
                            }
                            placeholder={t('otp-placeholder')}
                            disabled={verifying}
                        />
                    </div>
                    <button
                        onClick={handleConfirm2FA}
                        disabled={otpCode.length !== 6 || verifying}
                        className="w-[50%] bg-green_main hover:bg-green_main_hover text-white py-3 rounded-[99px] disabled:opacity-50 text-[20px] flex items-center justify-center gap-2"
                    >
                        {verifying ? (
                            <>
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                                {t('verifying')}
                            </>
                        ) : (
                            t('confirm')
                        )}
                    </button>
                    <div className="text-[15px] mt-4 text-left w-full flex flex-row gap-2">
                        <p className="text-red-500">{t('note')}</p>
                        <p className="text-green_main">{t('save-reminder')}</p>
                    </div>
                </div>
            </Modal>
        </>
    );
}
