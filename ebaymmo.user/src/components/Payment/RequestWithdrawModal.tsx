'use client';
import { useState, useEffect } from 'react';
import Modal from '../Modal/Modal';
import Input from '../BaseUI/Input/Input';
import { useSession } from 'next-auth/react';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { useRouter } from 'next/navigation';
import {
    useProcessWithdrawalActionMutation,
    useUserInfoSubscription,
    useVerify2FaCodeMutation,
    useGetPendingWithdrawalsCountQuery,
    useGetUserAddressesQuery,
    useInsertNotificationsMutation
} from '@/generated/graphql';
import { use2FAStatus } from '@/hooks/use2FAStatus';
import Select from '../BaseUI/Select/select';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface RequestWithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function RequestWithdrawModal({
    isOpen,
    onClose,
    onSuccess
}: RequestWithdrawModalProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const [amount, setAmount] = useState<number | ''>('');
    const [address, setAddress] = useState('');
    const [verifyCode, setVerifyCode] = useState('');
    const [show2FAWarning, setShow2FAWarning] = useState(false);
    const { showModal } = useStatusModal();
    const [createNotification] = useInsertNotificationsMutation();
    const t = useTranslations('Header');

    const messages = {
        walletRequired: t('walletRequired'),
        twoFactorRequired: t('twoFactorRequired'),
        pendingLimit: t('pendingLimit'),
        fillAllFields: t('fillAllFields'),
        minWithdrawal: t('minWithdrawal'),
        insufficientBalance: t('insufficientBalance'),
        incorrectCode: t('incorrectCode'),
        withdrawalSuccess: t('withdrawalSuccess'),
        error: t('error')
    };

    const [processWithdrawal] = useProcessWithdrawalActionMutation();
    const [verify2FACode] = useVerify2FaCodeMutation();
    const { is2FAEnabled, isLoading: loading2FA } = use2FAStatus();

    // Subscribe to user balance
    const { data: balanceData } = useUserInfoSubscription({
        variables: {
            userId: session?.user?.id || ''
        },
        skip: !session?.user?.id
    });

    // Thêm query để check số lượng pending withdrawals
    const { data: pendingCountData, refetch: refetchPendingCount } =
        useGetPendingWithdrawalsCountQuery({
            variables: {
                where: {
                    userId: { _eq: session?.user?.id },
                    withdrawalStatus: { _eq: 'pending' }
                }
            },
            skip: !session?.user?.id,
            fetchPolicy: 'network-only'
        });

    const { data: addressesData } = useGetUserAddressesQuery({
        variables: { userId: session?.user?.id || '' },
        skip: !session?.user?.id
    });

    const userBalance = balanceData?.usersByPk?.balance || 0;
    const insufficientBalance =
        typeof amount === 'number' && amount > userBalance;
    const pendingCount =
        pendingCountData?.withdrawalsAggregate?.aggregate?.count || 0;
    const addresses = addressesData?.addresses || [];

    useEffect(() => {
        if (!isOpen) {
            setShow2FAWarning(false);
            return;
        }

        // Đợi cho đến khi loading2FA hoàn tất và có dữ liệu
        if (!loading2FA && typeof is2FAEnabled !== 'undefined') {
            // Kiểm tra điều kiện ví trước
            if (addressesData && addressesData.addresses.length === 0) {
                showModal('warning', messages.walletRequired);
                onClose();
                return;
            }

            // Kiểm tra 2FA
            if (!is2FAEnabled) {
                setShow2FAWarning(true);
                return;
            }

            // Kiểm tra pending transactions
            if (pendingCount >= 3) {
                showModal('error', messages.pendingLimit);
                onClose();
            }
        }
    }, [
        isOpen,
        is2FAEnabled,
        loading2FA,
        addressesData,
        pendingCount,
        showModal,
        onClose
    ]);

    const handleWithdraw = async () => {
        try {
            // Kiểm tra các điều kiện trước khi thực hiện rút tiền
            if (!amount || !address || !verifyCode) {
                onClose();
                showModal('error', messages.fillAllFields);
                return;
            }

            // Kiểm tra số tiền tối thiểu
            if (typeof amount === 'number' && amount < 50) {
                onClose();
                showModal('error', messages.minWithdrawal);
                return;
            }

            // Kiểm tra số dư
            if (insufficientBalance) {
                onClose();
                showModal('error', messages.insufficientBalance);
                return;
            }

            // Verify 2FA first
            const { data: verifyResult } = await verify2FACode({
                variables: {
                    twoFactorToken: verifyCode
                }
            });

            if (!verifyResult?.verify2FACode?.status) {
                onClose(); // Đóng modal trước
                showModal('error', messages.incorrectCode);
                return;
            }

            // Process withdrawal
            const result = await processWithdrawal({
                variables: {
                    amount:
                        typeof amount === 'number'
                            ? amount
                            : parseFloat(amount),
                    balanceAddress: address
                }
            });

            const responseNotification = await createNotification({
                variables: {
                    objects: [
                        {
                            notificationType: 'Withdrawal Request',
                            content: `User ${session?.user?.name} has requested to withdraw ${amount} from ${address}`,
                            isRead: false,
                            createAt: new Date().toISOString(),
                            userId: session?.user?.id,
                            sentDate: new Date().toISOString()
                        }
                    ]
                }
            });

            if (result.data?.processWithdrawalAction) {
                onClose(); // Đóng modal trước
                await refetchPendingCount();
                onSuccess?.(); // Gọi callback nếu có
                showModal('success', messages.withdrawalSuccess);
            }
        } catch (error) {
            onClose(); // Đóng modal trước khi hiển thị lỗi
            console.error('Withdrawal error:', error);
            showModal('error', messages.error);
        }
    };

    // Chỉ hiển thị modal withdraw khi đã bật 2FA và không hiển thị warning
    const shouldShowWithdrawModal =
        isOpen && is2FAEnabled && !show2FAWarning && !loading2FA;

    return (
        <>
            <Modal
                isOpen={shouldShowWithdrawModal}
                onClose={onClose}
                title={t('withdrawTitle')}
                width="w-[900px]"
                className="p-10"
            >
                <div className="flex flex-col gap-6 pb-8">
                    <div>
                        <Input
                            label={t('amount')}
                            type="number"
                            className="w-full mt-4"
                            placeholder={t('enterWithdrawAmount')}
                            value={amount}
                            onChange={(e) =>
                                setAmount(
                                    e.target.value === ''
                                        ? ''
                                        : parseFloat(e.target.value)
                                )
                            }
                        />
                        {insufficientBalance && (
                            <span className="text-red-500 text-sm mt-1">
                                {messages.insufficientBalance}
                            </span>
                        )}
                    </div>

                    <div>
                        <Select
                            label={t('walletAddress')}
                            placeholder={t('selectWalletAddress')}
                            className="w-full"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            options={[
                                { value: '', label: t('pleaseSelectWallet') },
                                ...addresses.map((addr) => ({
                                    value: addr.address,
                                    label: addr.address
                                }))
                            ]}
                        />
                    </div>

                    <div>
                        <Input
                            label={t('2faVerificationCode')}
                            type="text"
                            placeholder={t('enter2faCode')}
                            className="w-full"
                            maxLength={6}
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value)}
                        />
                    </div>

                    <button
                        className="bg-[#33A959] hover:bg-[#2d9850] text-white font-semibold py-2 px-4 rounded-lg mt-4 w-full transition-all duration-300"
                        onClick={handleWithdraw}
                    >
                        {t('submitWithdrawal')}
                    </button>
                </div>
            </Modal>

            {show2FAWarning && (
                <Modal
                    isOpen={show2FAWarning}
                    onClose={onClose}
                    title={t('2faRequired')}
                    width="w-[500px]"
                    className="p-5"
                >
                    <div className="flex flex-col items-center gap-4 pb-5">
                        <div className="text-center">
                            <Image
                                src="/images/warning-icon.svg"
                                width={64}
                                height={64}
                                alt="Warning"
                                className="mx-auto mb-4"
                            />
                            <p className="mb-4">{t('2faRequiredMessage')}</p>
                        </div>
                        <div className="flex gap-4 w-full">
                            <button
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                                onClick={onClose}
                            >
                                {t('cancel')}
                            </button>
                            <button
                                className="flex-1 bg-[#33A959] hover:bg-[#2d9850] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                                onClick={() => {
                                    onClose();
                                    router.push('/user/security-settings');
                                }}
                            >
                                {t('setup2fa')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
}
