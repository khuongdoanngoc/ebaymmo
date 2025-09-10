import React from 'react';
import Modal from '../BaseUI/Modal';
import { useTranslations } from 'next-intl';

interface PopupResellerProps {
    isOpen: boolean;
    onClose: () => void;
    discountPercentage: string;
    setDiscountPercentage: (value: string) => void;
    recycleText: string;
    setRecycleText: (value: string) => void;
    handleRecycleSubmit: () => void;
}

const PopupReseller: React.FC<PopupResellerProps> = ({
    isOpen,
    onClose,
    discountPercentage,
    setDiscountPercentage,
    recycleText,
    setRecycleText,
    handleRecycleSubmit
}) => {
    const t = useTranslations('popupReseller');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('title')}
            width="860px"
            noButton
        >
            <div className="flex flex-col items-start gap-[20px] mb-[20px] w-full">
                <div className="w-full">
                    <h3 className="text-[18px] font-[500] mb-2">
                        {t('becomeReseller')}
                    </h3>
                    <p className="text-[#FF4D4F] text-[14px] sm:text-[16px]">
                        {t('description')}
                    </p>
                </div>

                <div className="w-full">
                    <h3 className="text-[14px] sm:text-[16px] font-[500] mb-2 flex">
                        {t('discountTitle')}
                    </h3>
                    <input
                        type="number"
                        min="0"
                        max="35"
                        className="w-full px-3 sm:px-4 py-2 rounded-[15px] border border-neutral-200 focus:border-primary-500 outline-none text-[14px] sm:text-[16px]"
                        placeholder={t('discountPlaceholder')}
                        value={discountPercentage}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value <= 35) {
                                setDiscountPercentage(e.target.value);
                            } else if (e.target.value === '') {
                                setDiscountPercentage('');
                            }
                        }}
                    />
                </div>

                <div className="w-full">
                    <h3 className="text-[14px] sm:text-[16px] font-[500] mb-2 flex">
                        {t('detailsTitle')}
                    </h3>
                    <textarea
                        className="w-full min-h-[120px] sm:min-h-[160px] rounded-[15px] px-3 sm:px-4 py-2 outline-none border border-neutral-200 focus:border-primary-500 text-[14px] sm:text-[16px]"
                        placeholder={t('detailsPlaceholder')}
                        value={recycleText}
                        onChange={(e) => setRecycleText(e.target.value)}
                    />
                </div>
            </div>
            <div
                onClick={handleRecycleSubmit}
                className="w-full py-3 bg-green-600 text-white rounded-[86px] hover:bg-green-700 font-medium cursor-pointer"
            >
                {t('submitButton')}
            </div>
        </Modal>
    );
};

export default PopupReseller;
