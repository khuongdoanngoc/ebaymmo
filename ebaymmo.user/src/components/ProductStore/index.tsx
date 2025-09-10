'use client';

import { useMemo, useState } from 'react';
import Minus from '@images/minus.svg';
import Plus from '@images/plus.svg';
import Recycle from '@images/recycle.svg';
import Image from 'next/image';
import ProductStoreInfo from './ProductStoreInfo';
import Modal from '../BaseUI/Modal';
import {
    useRegisterResellerMutation,
    useSubmitOrderMutation,
    useCreateOrderServicesMutation
} from '@/generated/graphql';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useStatusModal } from '@/contexts/StatusModalContext';
import StatusModal from '../StatusModal/StatusModal';
import PopupReseller from '../PopupReseller/PopupReseller';
import { useTranslations } from 'next-intl';

interface Product {
    productId: string;
    productName: string;
    price: number;
    stockCount: number;
    soldCount: number;
    imageUrl?: string;
}

interface ProductStoreProps {
    products: Product[];
    tag: string;
    storeId: string;
    sellerId: string;
    storeName: string;
    isService: boolean;
    allowPreOrder: boolean;
}

interface OrderData {
    productId: string;
    storeId: string;
    sellerId: string;
    customerId: string | undefined;
    productName: string;
    productPrice: number;
    quantity: number;
    discount: number;
    totalAmount: number;
}

const ProductStore = (props: ProductStoreProps) => {
    const { storeId, sellerId } = props;
    const t = useTranslations();
    const router = useRouter();
    const { data: session } = useSession();
    const { showModal } = useStatusModal();
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(props.products[0]?.price);
    const [_, setStockCount] = useState(props.products[0]?.price);
    const [selectedProduct, setSelectedProduct] = useState(
        props.products[0]?.productId
    );
    const [isPreOrder, setIsPreOrder] = useState(false);
    const [isRecycleModalOpen, setIsRecycleModalOpen] = useState(false);
    const [discountPercentage, setDiscountPercentage] = useState('');
    const [recycleText, setRecycleText] = useState('');
    const [registerReseller] = useRegisterResellerMutation();
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [completionDate, setCompletionDate] = useState(() => {
        // Mặc định là 2 ngày từ hiện tại
        const date = new Date();
        date.setDate(date.getDate() + 2);
        return date.toISOString().split('T')[0];
    });
    const [isModalOpen, setIsModalOpen] = useState(false);

    const currentProduct = props.products.find(
        (p) => p.productId === selectedProduct
    );

    const userId = session?.user?.id;
    const sellerIds = props.sellerId;

    // Helper function to format price
    const formatPrice = (value: number) => {
        const total = value * quantity;
        return total % 1 === 0 ? total.toString() : total.toFixed(2);
    };

    const handleBuyNow = async (type: 'regular' | 'pre-order') => {
        if (!session?.user) {
            router.push('/login');
            return;
        }
        try {
            // Kiểm tra nếu type là pre-order và cửa hàng không cho phép pre-order
            if (type === 'pre-order' && !props.allowPreOrder) {
                showModal('error', t('errors.noPreOrder'));
                return;
            }

            setShowStatusModal(true);
            setIsPreOrder(type === 'pre-order');
        } catch (error) {
            console.error('Error creating order:', error);
            showModal('error', t('errors.orderFailed'));
        }
    };

    // Đặt useSubmitOrderMutation ở cấp độ component
    const [submitOrder] = useSubmitOrderMutation();
    const [createOrderServices] = useCreateOrderServicesMutation();

    const handleSubmitOrder = async () => {
        const searchParams = new URLSearchParams(window.location.search);
        const referralCode = searchParams.get('ref');

        if (!currentProduct) {
            showModal('error', t('errors.noProduct'));
            return;
        }

        const orderData: OrderData = {
            productId: currentProduct.productId,
            storeId: storeId,
            sellerId: sellerId,
            customerId: session?.user.id,
            productName: currentProduct.productName || ' ',
            productPrice: currentProduct.price || 10,
            quantity: quantity,
            discount: 0,
            totalAmount: price * quantity
        };

        if (userId === sellerIds) {
            showModal('error', t('errors.ownProduct'));
            return;
        } else if (userId !== sellerIds) {
            try {
                let response;
                let orderResponse;

                // Sử dụng API khác nhau dựa trên isService
                if (props.isService) {
                    // Gọi API cho service
                    response = await createOrderServices({
                        variables: {
                            completeDateService: new Date(completionDate),
                            couponValue: orderData.discount,
                            productId: orderData.productId,
                            sellerId: orderData.sellerId
                        }
                    });
                    if (response.data && response.data.createOrderServices) {
                        orderResponse = {
                            ...response.data.createOrderServices,
                            discount: orderData.discount
                        };
                    } else {
                        showModal('error', t('errors.serviceFailed'));
                        return;
                    }
                } else {
                    // Gọi API cho product
                    response = await submitOrder({
                        variables: {
                            couponValue: orderData.discount,
                            productId: orderData.productId,
                            quantity: orderData.quantity,
                            sellerId: orderData.sellerId,
                            isPreOrder: isPreOrder,
                            referralCode: referralCode
                        }
                    });
                    if (response.data && response.data.createOrder) {
                        orderResponse = {
                            ...response.data.createOrder,
                            discount: orderData.discount
                        };
                    } else {
                        showModal('error', t('errors.orderFailed'));
                        return;
                    }
                }

                // Xử lý kết quả chung
                setShowStatusModal(false);
                router.push(
                    `/order?orderData=${encodeURIComponent(JSON.stringify(orderResponse))}`
                );
            } catch (error: any) {
                console.error('Error submitting order:', error);
                // Extract and show the actual error message from the server response
                const errorMessage = error.message;
                if (errorMessage) {
                    const match = errorMessage.match(
                        /extensions":{"path":[^}]+,"internal":{"[^}]+,"error":{"message":"([^"]+)"/
                    );
                    if (match && match[1]) {
                        showModal('error', match[1]);
                    } else {
                        showModal('error', t('errors.notEnoughBalance'));
                    }
                } else {
                    showModal('error', t('errors.submitFailed'));
                }
            }
        }
    };

    const handleRecycleSubmit = async () => {
        const userId = session?.user.id;
        try {
            const response = await registerReseller({
                variables: {
                    object: {
                        storeId: props.storeId,
                        userId: userId,
                        commissionRate: parseFloat(discountPercentage),
                        notes: recycleText
                    }
                }
            });

            if (response.data) {
                showModal('success', t('success.resellerRegistered'));
                setIsRecycleModalOpen(false);
            }
        } catch (error) {
            if (error instanceof Error && error.message.includes('duplicate')) {
                showModal('error', t('errors.resellerDuplicate'));
            } else {
                showModal('error', t('errors.resellerFailed'));
            }
        }
    };

    const renderProductStore = useMemo(() => {
        return props.products.map((item) => {
            return (
                <button
                    key={item.productId}
                    onClick={() => {
                        setPrice(item.price);
                        setSelectedProduct(item.productId);
                        setQuantity(1);
                        setStockCount(item.stockCount);
                    }}
                    className={`flex w-auto px-[25px] py-[12px] justify-center items-center gap-[10px] rounded-[8px] 
                        ${
                            selectedProduct === item.productId
                                ? 'bg-[#33A959] text-white'
                                : 'bg-[#F4F4F4] text-black'
                        } 
                        hover:bg-[#33A959] hover:text-white
                        text-[18px] font-[400] leading-[28.8px]`}
                >
                    {item.productName}
                </button>
            );
        });
    }, [selectedProduct, props.products]);

    // Hàm validate ngày hoàn thành
    const validateCompletionDate = (dateString: string) => {
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Kiểm tra ngày phải là tương lai
        return selectedDate >= today;
    };

    const stock = currentProduct?.stockCount || 0;

    const handleIncreaseQuantity = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        if (quantity + 1 > stock && !isPreOrder) {
            setIsModalOpen(true);
        } else {
            setQuantity(quantity + 1);
        }
    };

    return (
        <>
            <ProductStoreInfo
                warehouse={currentProduct?.stockCount}
                soldout={currentProduct?.soldCount}
                tag={props.tag}
                isService={props.isService}
            />
            <div>
                <span className="text-neutral-400 font-[700] text-[18px]">
                    {t('product.details.product')}
                </span>
                <div className="flex flex-wrap w-full max-w-[700px] min-h-[200px] gap-[15px] mt-5 ">
                    {renderProductStore}
                    <div className="mt-[35px] w-full h-[1px] bg-[#E1E1E1]" />
                    <div className="flex flex-col gap-[20px]">
                        {/* Price section */}
                        <div className="flex items-center gap-[30px]">
                            <span className="text-[32px] md:text-[40px] font-bold text-primary">
                                {formatPrice(price)} USDT
                            </span>
                            <div className="flex items-center gap-[15px]">
                                <h2 className="text-[#767676] text-[17px] font-[500] leading-[27.2px]">
                                    {t('product.details.quantity')}:
                                </h2>
                                {!props.isService && (
                                    <div className="flex items-center border border-neutral-300 rounded-[5px] w-[135px] h-[41px]">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (quantity > 1) {
                                                    setQuantity(quantity - 1);
                                                }
                                            }}
                                            className="flex items-center justify-center hover:opacity-50 p-[10px]"
                                        >
                                            <Image
                                                src={Minus}
                                                alt="Decrease quantity"
                                                width={20}
                                                height={20}
                                            />
                                        </button>
                                        <input
                                            className="w-[50px] text-center outline-none"
                                            type="text"
                                            min="1"
                                            max={
                                                currentProduct?.stockCount || 1
                                            }
                                            value={quantity}
                                            onChange={(e) => {
                                                const value = parseInt(
                                                    e.target.value,
                                                    10
                                                );
                                                if (
                                                    !isNaN(value) &&
                                                    value >= 1 &&
                                                    value <=
                                                        (currentProduct?.stockCount ||
                                                            1)
                                                ) {
                                                    setQuantity(value);
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={handleIncreaseQuantity}
                                            className="flex items-center justify-center hover:opacity-50 p-[10px]"
                                        >
                                            <Image
                                                src={Plus}
                                                alt="Increase quantity"
                                                width={20}
                                                height={20}
                                            />
                                        </button>
                                    </div>
                                )}
                                {props.isService && (
                                    <div className="text-[17px] font-[500]">
                                        1
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Buttons section */}
                        <div className="flex flex-col sm:flex-row items-center gap-[15px] sm:gap-[20px] flex-[1_0_0]">
                            <button
                                className={`transition-opacity ${
                                    !props.isService && stock <= 0
                                        ? 'opacity-50 cursor-not-allowed'
                                        : 'cursor-pointer hover:opacity-80'
                                } flex w-full sm:w-[337px] px-[15px] sm:px-[25px] py-[10px] justify-center items-center gap-[10px] rounded-[86px] bg-main-gradio text-white text-[16px] sm:text-[20px] font-[500] leading-[160%] font-beau`}
                                disabled={!props.isService && stock <= 0}
                                onClick={() => handleBuyNow('regular')}
                            >
                                {t('product.details.buyNow')}
                            </button>

                            {!props.isService && (
                                <button
                                    className={`transition-opacity ${
                                        stock > 0 || !props.allowPreOrder
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'hover:opacity-80'
                                    } flex w-full sm:w-[266px] px-[15px] sm:px-[25px] py-[10px] justify-center items-center gap-[10px] rounded-[86px] bg-sub-gradio text-white text-[16px] sm:text-[20px] font-[500] leading-[160%] font-beau`}
                                    disabled={stock > 0 || !props.allowPreOrder}
                                    onClick={() => handleBuyNow('pre-order')}
                                >
                                    {t('product.details.preOrder')}
                                </button>
                            )}

                            <div
                                className="cursor-pointer w-[40px] sm:w-auto"
                                onClick={() => {
                                    if (!session?.user) {
                                        router.push('/login');
                                    } else {
                                        setIsRecycleModalOpen(true);
                                    }
                                }}
                            >
                                <Image
                                    src={Recycle}
                                    alt="Recycle"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <PopupReseller
                isOpen={isRecycleModalOpen}
                onClose={() => setIsRecycleModalOpen(false)}
                discountPercentage={discountPercentage}
                setDiscountPercentage={setDiscountPercentage}
                recycleText={recycleText}
                setRecycleText={setRecycleText}
                handleRecycleSubmit={handleRecycleSubmit}
            />

            <Modal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                title={
                    !isPreOrder
                        ? t('product.details.orderConfirmation')
                        : t('product.details.preOrderConfirmation')
                }
                width="1140px"
                noButton
            >
                <div className="p-5">
                    <div className="flex flex-col md:flex-row gap-5">
                        {/* Phần hình ảnh bên trái */}
                        <div className="w-full md:w-2/5 relative">
                            <div className="bg-gray-100 rounded-lg overflow-hidden relative">
                                <Image
                                    src={
                                        currentProduct?.imageUrl ||
                                        '/images/placeholder.png'
                                    }
                                    alt={
                                        currentProduct?.productName || 'Product'
                                    }
                                    width={400}
                                    height={400}
                                    className="object-cover w-full aspect-square"
                                />
                                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-md">
                                    {t('product.details.notDuplicate')}
                                </div>
                            </div>
                        </div>

                        {/* Phần thông tin bên phải */}
                        <div className="w-full md:w-3/5">
                            <h3 className="text-xl font-bold mb-4">
                                {props.storeName}
                            </h3>

                            <div className="flex items-center mb-4">
                                <div className="flex items-center text-yellow-500 mr-2">
                                    ★
                                </div>
                                <span className="text-sm text-gray-500">
                                    {t('product.details.noReviews')} (0)
                                </span>
                            </div>

                            <div className="mb-4 flex flex-row items-center justify-start">
                                <div className="text-gray-700 mb-1 mr-5">
                                    {t('product.details.product')}:
                                </div>
                                <div className="flex items-center">
                                    <div className="font-medium">
                                        {currentProduct?.productName}
                                    </div>
                                    <div className="ml-2 text-green-500">✓</div>
                                </div>
                            </div>

                            {/* Hiển thị số lượng nếu không phải dịch vụ */}
                            {!props.isService && (
                                <div className="mb-4 flex flex-row items-center justify-start">
                                    <div className="text-gray-700 mb-2 mr-5">
                                        {t('product.details.quantity')}
                                    </div>
                                    <div className="flex items-center">
                                        <button
                                            onClick={() =>
                                                setQuantity(
                                                    Math.max(1, quantity - 1)
                                                )
                                            }
                                            className="w-12 h-12 border border-gray-300 rounded-l-md flex items-center justify-center text-xl"
                                        >
                                            −
                                        </button>
                                        <input
                                            type="text"
                                            min="1"
                                            max={
                                                currentProduct?.stockCount || 1
                                            }
                                            value={quantity}
                                            onChange={(e) => {
                                                const value = parseInt(
                                                    e.target.value,
                                                    10
                                                );
                                                if (
                                                    !isNaN(value) &&
                                                    value >= 1 &&
                                                    value <=
                                                        (currentProduct?.stockCount ||
                                                            1)
                                                ) {
                                                    setQuantity(value);
                                                }
                                            }}
                                            className="w-20 h-12 border-t border-b border-gray-300 text-center text-lg focus:outline-none"
                                        />
                                        <button
                                            onClick={handleIncreaseQuantity}
                                            className="w-12 h-12 border border-gray-300 rounded-r-md flex items-center justify-center text-xl"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* UI cho phần số ngày hoàn thành giống như trong hình */}
                            {props.isService && (
                                <div className="mb-4 flex flex-col items-start justify-start">
                                    <div className="text-gray-700 mb-2">
                                        {t('product.details.completionDate')}
                                    </div>
                                    <div className="flex flex-col">
                                        <input
                                            type="date"
                                            value={completionDate}
                                            onChange={(e) => {
                                                const newDate = e.target.value;
                                                if (
                                                    validateCompletionDate(
                                                        newDate
                                                    )
                                                ) {
                                                    setCompletionDate(newDate);
                                                } else {
                                                    showModal(
                                                        'error',
                                                        'Please select a future date'
                                                    );
                                                }
                                            }}
                                            min={
                                                new Date()
                                                    .toISOString()
                                                    .split('T')[0]
                                            }
                                            className="w-full h-12 border border-gray-300 rounded-md px-3 text-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            {t(
                                                'product.details.selectCompletionDate'
                                            )}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 mb-4">
                                <div className="flex justify-between border-b pb-2 mb-2">
                                    <div className="text-gray-700">
                                        {t('product.details.price')}:
                                    </div>
                                    <div className="font-medium">
                                        {currentProduct?.price.toLocaleString()}{' '}
                                        USDT
                                    </div>
                                </div>
                                <div className="flex justify-between border-b pb-2 mb-2">
                                    <div className="text-gray-700">
                                        {t('product.details.discount')}:
                                    </div>
                                    <div className="font-medium">0 USDT</div>
                                </div>
                                <div className="flex justify-between mt-4">
                                    <div className="text-xl font-bold">
                                        {t('product.details.totalPayment')}
                                    </div>
                                    <div className="text-xl font-bold text-green-600">
                                        {(price * quantity).toLocaleString()}{' '}
                                        USDT
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={handleSubmitOrder}
                                className="w-full py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium cursor-pointer"
                            >
                                {t('product.details.placeOrder')}
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
            <div className="relative z-[9999]">
                <StatusModal
                    type="warning"
                    message={t('product.details.quantityExceedsStock')}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                />
            </div>
        </>
    );
};

export default ProductStore;
