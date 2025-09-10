'use client';
import { useState } from 'react';
import Modal from '../BaseUI/Modal';
import Input from '../BaseUI/Input';
import Button from '../BaseUI/Button/button';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { useInsertDepositeLogsMutation } from '@/generated/graphql';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

interface DepositModalProps {
    isOpen: boolean;
    onClose: () => void;
    balance: number;
}

export default function DepositModal({
    isOpen,
    onClose,
    balance
}: DepositModalProps) {
    const t = useTranslations('depositModal');
    const { data: session } = useSession();
    const { showModal } = useStatusModal();
    const [amount, setAmount] = useState('');
    const [networkCode, setNetworkCode] = useState('');
    const [networkError, setNetworkError] = useState('');
    const [amountError, setAmountError] = useState('');
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
    const [insertDeposit] = useInsertDepositeLogsMutation();

    const networkOptions = [
        { value: 'BSC', label: t('networks.bsc') },
        { value: 'ETH', label: t('networks.ethereum') },
        { value: 'ARB', label: t('networks.arbitrum') }
    ];

    // ... rest of your existing deposit logic ...

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('title')}
            noButton={true}
            className="!w-[900px] h-[550px]"
        >
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <span className="text-[16px] text-[#3F3F3F]">
                        {t('walletAddress')}
                    </span>
                    <span className="text-[16px] text-[#3F3F3F]">
                        {t('balance')}: {balance} USDT
                    </span>
                </div>

                {/* ... rest of your existing deposit modal JSX ... */}
            </div>
        </Modal>
    );
}
