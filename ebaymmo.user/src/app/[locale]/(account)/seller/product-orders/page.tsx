'use client';

import Button from '@/components/BaseUI/Button/button';
import Table from '@/components/BaseUI/Table';
import React, { useState, useEffect } from 'react';
import CustomDropdown from './CustomDropdown';
import StatusBadge from '@/components/StatusProps/StatusBadge';
import { useGetProductOrderViewQuery } from '@/generated/graphql';
import { useSession } from 'next-auth/react';
import { IDataTokenDecode } from '@/types/global.type';
import { jwtDecode } from 'jwt-decode';
import { TableSkeleton } from '@/components/BaseUI/SkeletonTable/SkeletonTable';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/BaseUI/Pagination';
import { useTranslations } from 'next-intl';

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

const columnStyles = {
    orderCode: { width: '120px' },
    saleDate: { width: '120px' },
    buyer: { width: '150px' },
    store: { width: '150px' },
    item: { width: '150px' },
    quantity: { width: '100px' },
    price: { width: '100px' },
    total: { width: '100px' },
    status: { width: '120px' }
};

const PageOrders = () => {
    const { data: session } = useSession();
    const t = useTranslations('seller.product-order');
    const tDropdown = useTranslations('custom-dropdown');

    const decoded = jwtDecode<IDataTokenDecode>(
        session?.user.accessToken as string
    );

    const { page, limit, setPage, offset } = usePagination(
        '/seller/product-orders',
        5
    );

    const [filters, setFilters] = useState({
        orderCode: '',
        buyerName: '',
        status: tDropdown('all')
    });

    const [searchFilters, setSearchFilters] = useState({
        orderCode: '',
        buyerName: '',
        status: tDropdown('all')
    });


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

    const { data, loading } = useGetProductOrderViewQuery({
        variables: {
            limit: limit,
            offset: offset,
            where: {
                isService: {
                    _eq: false
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
    //console.log(data);

    const transformedData =
        data?.getProductOrdersView.map((order) => ({
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
            item: order.productName || 'N/A'
        })) || [];

    const columns = [
        {
            header: t('order-code'),
            accessor: 'orderCode',
            style: columnStyles.orderCode
        },
        {
            header: t('Sale Date'),
            accessor: 'saleDate',
            style: columnStyles.saleDate
        },
        { header: t('buyer'), accessor: 'buyer', style: columnStyles.buyer },
        { header: t('store'), accessor: 'store', style: columnStyles.store },
        { header: t('item'), accessor: 'item', style: columnStyles.item },
        {
            header: t('Quantity'),
            accessor: 'quantity',
            style: columnStyles.quantity
        },
        { header: t('price'), accessor: 'price', style: columnStyles.price },
        { header: t('total'), accessor: 'total', style: columnStyles.total },
        {
            header: t('status'),
            accessor: 'statusStyle',
            style: columnStyles.status,
            cell: (data: any) => <StatusBadge status={data.status} />
        }
    ];

    return (
        <div className="flex flex-col border py-[40px] px-[46px] rounded-[15px] border-border_color bg-white gap-[35px]">
            <div className="flex justify-between items-center">
                <h1 className="text-[24px] font-beausans">
                    {t('product-order')}
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
                    placeholder={t('enter-buyer-name')}
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
                    className="h-[42px] w-full px-4 py-2 text-sm text-white rounded-[86px] md:rounded-[86px]"
                    style={{
                        background: 'var(--Primary-500, #33A959)'
                    }}
                >
                    {t('search-order')}
                </Button>
            </div>
            <div style={tableStyles.tableContainer}>
                <div style={tableStyles.table}>
                    {loading ? (
                        <TableSkeleton />
                    ) : transformedData.length > 0 ? (
                        <Table columns={columns} data={transformedData} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <p className="mt-4 text-lg font-medium text-gray-500">
                                {t('no-orders')}
                            </p>
                        </div>
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
        </div>
    );
};

export default PageOrders;
