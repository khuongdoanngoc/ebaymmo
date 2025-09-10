import React, { useState } from 'react';
import Modal from '../BaseUI/Modal';
import Image from 'next/image';
import Input from '../BaseUI/Input';
import {
    useInsertProductMutation,
    GetProductsByStoreDocument
} from '@/generated/graphql';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { useTranslations } from 'next-intl';

interface PopupAddWarehouseProps {
    isOpen: boolean;
    onClose: () => void;
    storeName?: string;
    storeId: string;
    type: string | null;
}

const PopupAddWarehouse: React.FC<PopupAddWarehouseProps> = ({
    isOpen,
    onClose,
    storeName = 'ttt',
    storeId,
    type
}) => {
    const t = useTranslations('popupAddWarehouse');
    const { showModal } = useStatusModal();
    const initialFormData = {
        warehouseName: '',
        stock: '0',
        price: '0',
        isPrivate: false,
        status: false
    };

    const [formData, setFormData] = useState(initialFormData);
    const [priceError, setPriceError] = useState<string>('');

    const [insertProducts] = useInsertProductMutation({
        onCompleted: () => {
            showModal('success', t('success'));
            setFormData(initialFormData);
            onClose();
        },
        onError: (error) => {
            showModal('error', t('error') + error.message);
            console.error('Error adding product:', error.message);
            console.error('GraphQL Errors:', error.graphQLErrors);
            console.error('Network Error:', error.networkError);
        },
        refetchQueries: [
            {
                query: GetProductsByStoreDocument,
                variables: { storeId }
            }
        ]
    });

    const handleSubmit = async () => {
        if (!storeId) {
            console.error('No store ID provided');
            return;
        }

        // Validate price before submitting
        if (!formData.price || formData.price === '') {
            setPriceError(t('priceRequired'));
            return;
        }

        const price = parseFloat(formData.price);
        if (isNaN(price)) {
            setPriceError(t('priceInvalid'));
            return;
        }
        if (price <= 0) {
            setPriceError(t('priceGreaterThanZero'));
            return;
        }
        if (price > 100000) {
            setPriceError(t('priceTooHigh'));
            return;
        }

        try {
            await insertProducts({
                variables: {
                    productName: formData.warehouseName,
                    stockCount: parseInt(formData.stock || '0'),
                    price: price,
                    storeId: storeId,
                    status: formData.status ? 'active' : 'inactive',
                    usePrivateWarehouse: formData.isPrivate,
                    isService: type === 'service' ? true : false
                }
            });
        } catch (error) {
            console.error('Failed to add product:', error);
        }
    };

    const handleInputChange = (field: string, value: string | boolean) => {
        if (field === 'price') {
            if (value === '') {
                setFormData((prev) => ({ ...prev, [field]: value }));
                setPriceError('');
                return;
            }

            // Convert to number for validation
            const numValue = parseFloat(value as string);

            // Validate price constraints
            if (isNaN(numValue)) {
                setPriceError(t('priceInvalid'));
                return;
            }
            if (numValue <= 0) {
                setPriceError(t('priceGreaterThanZero'));
                return;
            }
            if (numValue > 100000) {
                setPriceError(t('priceTooHigh'));
                return;
            }

            // Clear error when valid
            setPriceError('');
        }

        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={type === 'product' ? t('addProduct') : t('addService')}
            buttonTitle={t('addNew')}
            width="auto"
            onSubmit={handleSubmit}
            className="[&_.modal-title]:!bg-[#47A8DF] [&_.modal-title]:!text-white mx-auto w-[90%] md:w-auto"
        >
            <div className="flex items-center align-center gap-[10px]">
                <span>{t('store')}</span>
                <span className="w-auto h-29px text-[#47A8DF] ml-[5px] text-[18px] font-[500]">
                    {storeName}
                </span>
                <Image
                    src="/images/envelope-06.svg"
                    alt="store-image"
                    width={25}
                    height={25}
                />
            </div>
            <div className="flex items-center mt-[15px] gap-1">
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.isPrivate}
                        onChange={(e) =>
                            handleInputChange('isPrivate', e.target.checked)
                        }
                    />
                    <div className="w-[18px] h-[18px] border-2 border-gray-300 rounded peer-checked:bg-primary-500 peer-checked:border-primary-500 after:content-[''] after:absolute after:left-[6px] after:top-[2px] after:w-[6px] after:h-[10px] after:border-white after:border-r-2 after:border-b-2 after:hidden peer-checked:after:block after:rotate-45" />
                </label>
                <span className="ml-[12px]">
                    {t('usePrivateWarehouse')}{' '}
                    <span className="text-[14px] text-[#FF5858] font-[400] break-words">
                        {t('privateWarehouseNote')}
                    </span>
                </span>
            </div>
            <div className="mt-[30px]">
                <Input
                    label={
                        type === 'product' ? t('productName') : t('serviceName')
                    }
                    placeholder={
                        type === 'product'
                            ? t('enterProductName')
                            : t('enterServiceName')
                    }
                    type="text"
                    value={formData.warehouseName}
                    onChange={(e) =>
                        handleInputChange('warehouseName', e.target.value)
                    }
                />
            </div>
            <div className="mt-[30px] flex gap-[20px]">
                <div className="flex-1">
                    <Input
                        label={t('price')}
                        placeholder={t('enterPrice')}
                        type="number"
                        min="0"
                        max="999999999999"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) =>
                            handleInputChange('price', e.target.value)
                        }
                        onKeyDown={(e) => {
                            // Prevent negative sign
                            if (e.key === '-' || e.key === 'e') {
                                e.preventDefault();
                            }
                        }}
                    />
                    {priceError && (
                        <div className="text-red-500 text-sm mt-1">
                            {priceError}
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-[30px] mb-[40px] flex items-center gap-[15px]">
                <span className="flex items-center text-[16px] font-[400]">
                    {t('productStatus')}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.status}
                        onChange={(e) =>
                            handleInputChange('status', e.target.checked)
                        }
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500" />
                </label>
            </div>
        </Modal>
    );
};

export default PopupAddWarehouse;
