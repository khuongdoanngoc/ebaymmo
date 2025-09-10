'use client';

import Modal from '../Modal/Modal';
import Input from '../BaseUI/Input/Input';
import { useTranslations } from 'next-intl';

interface DonateModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function DonateModal({ isOpen, onClose }: DonateModalProps) {
    const t = useTranslations('donateModal');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('title')}
            width="w-[900px]"
            height="h-[900px]"
            className="p-6"
        >
            <div className="flex flex-col gap-6 pb-8">
                {/* Amount Input */}
                <div>
                    <Input
                        label={t('amount')}
                        type="text"
                        placeholder={t('amountPlaceholder')}
                        className="w-full mt-4"
                    />
                </div>

                {/* Comment Input */}
                <div>
                    <Input
                        label={t('comment')}
                        type="textarea"
                        placeholder={t('commentPlaceholder')}
                        className="w-full min-h-[450px]"
                    />
                </div>

                {/* Donate Button */}
                <button className="w-full bg-[#33A959] text-white py-4 rounded-[14px] text-lg font-medium hover:bg-[#2d9850] transition-colors">
                    {t('donateButton')}
                </button>
            </div>
        </Modal>
    );
}
