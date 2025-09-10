'use client';

import { useGetProductOrderViewQuery } from '@/generated/graphql';
import Button from '../BaseUI/Button/button';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import StatusBadge from '../StatusProps/StatusBadge';
import Table from '../BaseUI/Table';
import usePagination from '@/hooks/usePagination';
import Pagination from '../BaseUI/Pagination';
import { TableSkeleton } from '@/components/BaseUI/SkeletonTable/SkeletonTable';
import CustomDropdown from '@/app/[locale]/(account)/seller/product-orders/CustomDropdown';
import { useTranslations } from 'next-intl';
import Modal from '../BaseUI/Modal';
import React from 'react';
import ModalService from '../OrderManagement/ModalService';

export default function ServiceOrder() {
    const t = useTranslations('seller.service-orders');
    const tProduct = useTranslations('seller.product-order');
    const tDropdown = useTranslations('custom-dropdown');
    const tOrderStatus = useTranslations('order-service.status');
    const { data: session, status } = useSession();
    const [userId, setUserId] = useState<string | null>(null);
    const [isModalview, setIsModalview] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const tableStyles: {
        tableContainer: React.CSSProperties;
        table: React.CSSProperties;
    } = {
        tableContainer: {
            overflowX: 'auto',
            width: '100%'
        },
        table: {
            tableLayout: 'fixed',
            width: '100%',
            whiteSpace: 'nowrap'
        }
    };

    const [filters, setFilters] = useState({
        orderCode: '',
        buyerName: '',
        status: t('all')
    });

    const [searchFilters, setSearchFilters] = useState({
        orderCode: '',
        buyerName: '',
        status: t('all')
    });

    const columnStyles = {
        action: { width: '80px' },
        orderCode: { width: '120px' },
        saleDate: { width: '120px' },
        time: { width: '100px' },
        buyer: { width: '150px' },
        store: { width: '150px' },
        item: { width: '150px' },
        quantity: { width: '100px' },
        price: { width: '100px' },
        discounted: { width: '120px' },
        total: { width: '100px' },
        refunded: { width: '100px' },
        reseller: { width: '150px' },
        platform: { width: '120px' },
        status: { width: '120px' }
    };

    const { page, limit, setPage, offset } = usePagination(
        '/seller/service-orders',
        10
    );

    // Add a mapping function to convert display status to backend status
    const mapStatusToBackend = (displayStatus: string) => {
        // Create a mapping between display status (translated) and backend status
        const statusMap: Record<string, string> = {
            [tDropdown('all')]: 'all',
            [tDropdown('pending')]: 'pending',
            [tDropdown('successed')]: 'successed',
            [tDropdown('refunded')]: 'refunded',
            [tDropdown('cancelled')]: 'cancelled'
        };

        // Return the backend status or default to the display status lowercase
        return statusMap[displayStatus] || displayStatus.toLowerCase();
    };

    const actionButtons = (orderData: any) => (
        <div className="flex flex-col space-y-2">
            <button 
                className={`text-sm px-3 text-white cursor-pointer border rounded-[8px] p-3 ${
                    orderData.status === 'cancelled' || orderData.status === 'refunded'
                        ? 'bg-red-500 hover:bg-red-600' 
                        : orderData.status === 'pending'
                        ? 'bg-yellow-500 hover:bg-yellow-600'
                        : orderData.status === 'accepted'
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-green-500 hover:bg-green-600'
                }`}
                onClick={() => {
                    setSelectedOrder(orderData);
                    setIsModalview(true);
                }}
            >
                {orderData.status === 'cancelled' || orderData.status === 'refunded'
                    ? tOrderStatus('cancelled')
                    : orderData.status === 'pending'
                    ? t('actions.acceptOrder')
                    : orderData.status === 'accepted'
                    ? tOrderStatus('accepted')
                    : tOrderStatus('completed')
                }
            </button>
        </div>
    );

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.id) {
            setUserId(session.user.id);
        }
    }, [session, status]);

    const { data, loading, refetch } = useGetProductOrderViewQuery({
        variables: {
            limit: limit,
            offset: offset,
            where: {
                isService: {
                    _eq: true
                },
                ...(searchFilters.orderCode && {
                    orderCode: { _ilike: `%${searchFilters.orderCode}%` }
                }),
                ...(searchFilters.buyerName && {
                    userUsername: { _ilike: `%${searchFilters.buyerName}%` }
                }),
                ...(mapStatusToBackend(searchFilters.status) !== 'all' && {
                    orderStatus: {
                        _eq: mapStatusToBackend(searchFilters.status)
                    }
                })
            }
        },
        fetchPolicy: 'network-only'
    });

    const handleSearch = () => {
        setSearchFilters(filters);
        setPage(1);
    };

    const transformedData =
        data?.getProductOrdersView?.map((order) => {
            const orderData = {
                orderId: order.orderId || '',
                orderCode: order.orderCode,
                saleDate: order.orderDate
                    ? new Date(order.orderDate).toLocaleDateString()
                    : '-',
                buyer: order.userUsername || 'N/A',
                quantity: order.quantity,
                price: `${order.price}`,
                discounted: order.discountType || '0',
                total: `${order.price}`,
                status: order.orderStatus,
                store: order.storeName || 'N/A',
                item: order.productName || 'N/A',
                completeDateService: order.completeDateSevice
            };
            
            return {
                action: actionButtons(orderData),
                orderId: order.orderId || '',
                orderCode: order.orderCode,
                saleDate: order.orderDate
                    ? new Date(order.orderDate).toLocaleDateString()
                    : '-',
                buyer: order.userUsername || 'N/A',
                quantity: order.quantity,
                price: `${order.price}`,
                discounted: order.discountType || '0',
                total: `${order.price}`,
                statusStyle: order.orderStatus,
                store: order.storeName || 'N/A',
                item: order.productName || 'N/A',
                completeDateService: order.completeDateSevice
            };
        }) || [];

    const columns = [
        {
            header: t('table.action'),
            accessor: 'action',
            style: columnStyles.action
        },
        {
            header: t('table.orderCode'),
            accessor: 'orderCode',
            style: columnStyles.orderCode
        },
        {
            header: t('table.saleDate'),
            accessor: 'saleDate',
            style: columnStyles.saleDate
        },
        {
            header: t('table.buyer'),
            accessor: 'buyer',
            style: columnStyles.buyer
        },
        {
            header: t('table.store'),
            accessor: 'store',
            style: columnStyles.store
        },
        { header: t('table.item'), accessor: 'item', style: columnStyles.item },
        {
            header: t('table.quantity'),
            accessor: 'quantity',
            style: columnStyles.quantity
        },
        {
            header: t('table.price'),
            accessor: 'price',
            style: columnStyles.price
        },
        {
            header: t('table.discounted'),
            accessor: 'discounted',
            style: columnStyles.discounted
        },
        {
            header: t('table.total'),
            accessor: 'total',
            style: columnStyles.total
        },
        {
            header: t('table.refund'),
            accessor: 'refund',
            style: columnStyles.refunded
        },
        {
            header: t('table.reseller'),
            accessor: 'reseller',
            style: columnStyles.reseller
        },
        {
            header: t('table.platform'),
            accessor: 'platform',
            style: columnStyles.platform
        },
        {
            header: t('table.status'),
            accessor: 'statusStyle',
            style: columnStyles.status,
            cell: (data: any) => <StatusBadge status={data.status} />
        }
    ];

    // Hàm xử lý cập nhật trạng thái đơn hàng
    const handleOrderStatusUpdate = (newStatus: string) => {
        
        // Cập nhật selectedOrder với trạng thái mới
        if (selectedOrder) {
            setSelectedOrder((prev: any) => ({
                ...prev,
                status: newStatus
            }));
            
            // Đóng modal sau khi cập nhật thành công (tùy chọn)
            // setIsModalview(false);
        }
        
        // Refetch dữ liệu sau khi cập nhật
        setTimeout(() => {
            refetch();
        }, 500);
    };

    return (
        <div className="flex flex-col border py-6 px-6 lg:py-[40px] lg:px-[46px] rounded-[15px] border-border_color bg-white gap-[35px]">
            <div className="flex justify-between items-center">
                <h1 className="text-[24px] font-beausans font-bold">
                    {t('title')}
                </h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <input
                    type="text"
                    placeholder={t('enter-order-code')}
                    className="h-[42px] w-full rounded-[10px] border border-[#E1E1E1] outline-none px-5 py-2"
                    value={filters.orderCode}
                    onChange={(e) =>
                        setFilters((prev) => ({
                            ...prev,
                            orderCode: e.target.value
                        }))
                    }
                />
                <input
                    type="text"
                    placeholder={tProduct('enter-buyer-name')}
                    className="h-[42px] w-full rounded-[10px] border border-[#E1E1E1] outline-none px-5 py-2"
                    value={filters.buyerName}
                    onChange={(e) =>
                        setFilters((prev) => ({
                            ...prev,
                            buyerName: e.target.value
                        }))
                    }
                />
                <div className="w-full">
                    <CustomDropdown
                        selectedValue={filters.status}
                        onChange={(value: string) => {
                            setFilters((prev) => ({ ...prev, status: value }));
                            setSearchFilters((prev) => ({
                                ...prev,
                                status: value
                            }));
                            setPage(1);
                        }}
                    />
                </div>
                <Button
                    onClick={handleSearch}
                    type="submit"
                    className="h-[42px] w-full
                    px-4
                    py-2
                    text-sm
                    text-white 
                    rounded-[86px] md:rounded-[86px]"
                    style={{
                        background: 'var(--Primary-500, #33A959)'
                    }}
                >
                    {t('search-orders')}
                </Button>
            </div>
            <div className="content" style={tableStyles.tableContainer}>
                <div style={tableStyles.table}>
                    {loading ? (
                        <TableSkeleton />
                    ) : (
                        <Table columns={columns} data={transformedData} />
                    )}
                </div>
            </div>
            <Pagination
                page={page}
                limit={limit}
                setPage={setPage}
                total={
                    data?.getProductOrdersViewAggregate.aggregate?.count || 0
                }
            />

            {isModalview && selectedOrder && (
                <Modal  
                    isOpen={isModalview}
                    noButton
                    onClose={() => setIsModalview(false)}
                    title={`#${selectedOrder.orderCode}`}
                    width={'70%'}
                    children={
                        <ModalService 
                            testMode={false} 
                            orderData={{
                                orderId: selectedOrder.orderId || '',
                                orderCode: selectedOrder.orderCode || '',
                                quantity: selectedOrder.quantity || 0,
                                price: selectedOrder.price || 0,
                                item: selectedOrder.item || '',
                                buyer: selectedOrder.buyer || '',
                                orderDate: selectedOrder.saleDate ? new Date(selectedOrder.saleDate) : new Date(),
                                orderStatus: selectedOrder.status || '',
                                completeDate: selectedOrder.completeDateService ? new Date(selectedOrder.completeDateService) : new Date()
                            }}
                            onClose={() => setIsModalview(false)}
                            onStatusUpdate={handleOrderStatusUpdate}
                        />
                    }
                />
            )}
        </div>
    );
}
