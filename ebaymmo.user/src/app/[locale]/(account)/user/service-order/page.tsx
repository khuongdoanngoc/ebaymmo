'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGetListingOrdersQuery, OrderBy } from '@/generated/graphql';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/BaseUI/Pagination';
import { ModeOrder } from '@/constants/enum';
import PopupReview from '@/components/PopupReview/PopupReview';
import ComplainOrderModal from '@/components/ComplainOrder/ComplainOrder';
import ViewComplainModal from '@/components/ComplainOrder/ViewComplainModal';
import OrderTable from '@/components/OrderManagement/OrderTable';
import HeaderOrder from '@/components/OrderManagement/Header';
import OrderSkeleton from '@/components/OrderManagement/OrderSkeleton';
import Modal from '@/components/BaseUI/Modal';
import ModalService from '@/components/OrderManagement/ModalService';
import { useTranslations } from 'next-intl';

type Order = NonNullable<ReturnType<typeof useGetListingOrdersQuery>['data']>['listingOrders'][0];

const DataModal = ({
    order,
    onClose
}: {
    order: Order;
    onClose: () => void;
}) => {
    const t = useTranslations('order-management');
    const { data: session } = useSession();
   
    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={t('getProductData')}
            noButton
            width="100%"
            className="max-w-[1138px]"
        >
            <div className="flex flex-col gap-4">
                <div className="">
                    <ModalService 
                        testMode={true}
                        orderData={{
                            orderCode: order.orderCode || '',
                            quantity: typeof order.quantity === 'number' ? order.quantity : 0,
                            price: typeof order.totalAmount === 'number' ? order.totalAmount : 0,
                            item: order.productName || '',
                            buyer: order.buyerName || '',
                            orderDate: order.orderDate ? new Date(order.orderDate) : new Date(),
                            orderStatus: order.orderStatus || '',
                            notes: '',
                            productId: order.productId || '',
                            productName: order.productName || '',
                            productImage: '',
                            
                            completeDate: order.completeDateService ? new Date(order.completeDateService) : new Date()
                        }}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default function ServiceOrder() {
    const { data: session } = useSession();
    const { page, limit, setPage, offset } = usePagination(
        '/user/service-order',
        5
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [modalContent, setModalContent] = useState<React.ReactNode>(null);
    const [filterType, setFilterType] = useState('');
    const [selectedOrderDetails, setSelectedOrderDetails] =
        useState<Order | null>(null);
    const router = useRouter();

    const filter = [];
    if (filterType === 'order-code') {
        filter.push({ orderCode: OrderBy.Desc });
    } else {
        filter.push({ sellerName: OrderBy.Asc });
    }
    filter.push({ orderDate: OrderBy.Desc });

    const { data, loading } = useGetListingOrdersQuery({
        variables: {
            limit: limit,
            offset: offset,
            orderBy: filter,
            search: `%${searchTerm}%`,
            userId: session?.user?.id || ''
        },
        fetchPolicy: 'network-only'
    });
    const totalPage = data?.listingOrdersAggregate?.aggregate?.count;

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/login');
        }
    }, [status, router]);

    const handleOpenModal = (order: Order, mode: ModeOrder) => {
        setSelectedOrder(order);
        setSelectedOrderDetails(order);
        setIsModalOpen(true);

        switch (mode) {
            case ModeOrder.DATA:
                setModalContent(
                    <DataModal order={order} onClose={handleCloseModal} />
                );
                break;
            case ModeOrder.FEEDBACK:
                const storeId = order.storeId;
                setModalContent(
                    <>
                        <PopupReview
                            isOpen={true}
                            onClose={() => setIsModalOpen(false)}
                            storeId={storeId}
                        />
                    </>
                );
                break;
            case ModeOrder.COMPLAIN:
                const orderId = order.orderId;
                const orderCode = order.orderCode;
                setModalContent(
                    <>
                        <ComplainOrderModal
                            isOpen={true}
                            onClose={() => setIsModalOpen(false)}
                            orderId={orderId}
                            orderCode={orderCode}
                        />
                    </>
                );
                break;
            case ModeOrder.VIEW_COMPLAIN:
                const viewOrderId = order.orderId;
                const viewOrderCode = order.orderCode;
                setModalContent(
                    <>
                        <ViewComplainModal
                            isOpen={true}
                            onClose={() => setIsModalOpen(false)}
                            orderId={viewOrderId}
                            orderCode={viewOrderCode}
                        />
                    </>
                );
                break;
            default:
                break;
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
        setModalContent(null);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilterType(e.target.value);
        setPage(1);
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setPage(1);
    };

    const formatDate = (dateString: string) => {
        try {
            const date = parseISO(dateString);
            return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
        } catch (error) {
            return dateString;
        }
    };

    if (loading) {
        return <OrderSkeleton />;
    }

    return (
        <div className="flex flex-col border md:py-[40px] md:px-[46px] py-[20px] px-[24px] rounded-[15px] border-border_color bg-white md:gap-[35px] gap-[20px] overflow-hidden">
            <HeaderOrder
                searchTerm={searchTerm}
                filterType={filterType}
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
            />
            <OrderTable
                orders={data?.listingOrders || []}
                onOpenModal={handleOpenModal}
                formatDate={formatDate}
            />
            <Pagination
                page={page}
                limit={limit}
                setPage={setPage}
                total={totalPage}
            />

            {isModalOpen && modalContent}
        </div>
    );
} 