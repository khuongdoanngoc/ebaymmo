'use client';

import Button from '@/components/BaseUI/Button/button';
import Table from '@/components/BaseUI/Table';
import React, { useState } from 'react';
import StatusBadge from '@/components/StatusProps/StatusBadge';
import {
    OrderBy,
    useGetProductOrdersQuery,
    useGetProductOrderViewQuery
} from '@/generated/graphql';
import { TableSkeleton } from '@/components/BaseUI/SkeletonTable/SkeletonTable';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/BaseUI/Pagination';
import { useUserInfo } from '@/contexts/UserInfoContext';
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
    discounted: { width: '120px' },
    total: { width: '100px' },
    refund: { width: '100px' },
    reseller: { width: '150px' },
    platform: { width: '120px' },
    status: { width: '120px' }
};

const PreOrders = () => {
    const { userInfo } = useUserInfo();
    const { page, limit, setPage, offset } = usePagination(
        '/seller/pre-orders',
        5
    );
    const t = useTranslations('seller.pre-orders');

    const [orderCodeFilter, setOrderCodeFilter] = useState('');
    const [searchOrderCode, setSearchOrderCode] = useState('');
    const { data, loading } = useGetProductOrderViewQuery({
        variables: {
            limit,
            offset,
            orderBy: [{ orderDate: OrderBy.Desc }],
            where: {
                isPreOrder: {
                    _eq: true
                },
                ...(searchOrderCode && {
                    orderCode: { _ilike: `%${searchOrderCode}%` }
                })
            }
        }
    });

    const handleSearch = () => {
        setSearchOrderCode(orderCodeFilter);
        setPage(1);
    };

    const transformedData =
        data?.getProductOrdersView.map((order) => ({
            orderCode: order.orderCode,
            saleDate: order.orderDate
                ? new Date(order.orderDate).toLocaleDateString()
                : '-',
            buyer: order.userUsername || '-',
            quantity: order.quantity,
            price: `${order.price}`,
            discounted: order.couponCode || '-',
            total: `${order.price}`,
            statusStyle: order.orderStatus,
            store: order.storeName || '-',
            item: order.productName || '-'
        })) || [];

    const columns = [
        {
            header: 'Order Code',
            accessor: 'orderCode',
            style: columnStyles.orderCode
        },
        {
            header: 'Sale Date',
            accessor: 'saleDate',
            style: columnStyles.saleDate
        },
        { header: 'Buyer', accessor: 'buyer', style: columnStyles.buyer },
        { header: 'Store', accessor: 'store', style: columnStyles.store },
        { header: 'Item', accessor: 'item', style: columnStyles.item },
        {
            header: 'Quantity',
            accessor: 'quantity',
            style: columnStyles.quantity
        },
        { header: 'Price', accessor: 'price', style: columnStyles.price },
        // {
        //     header: 'Discounted',
        //     accessor: 'discounted',
        //     style: columnStyles.discounted
        // },
        { header: 'Total', accessor: 'total', style: columnStyles.total },
        // { header: 'Refund', accessor: 'refund', style: columnStyles.refund },
        // {
        //     header: 'Reseller',
        //     accessor: 'reseller',
        //     style: columnStyles.reseller
        // },
        // {
        //     header: 'Platform',
        //     accessor: 'platform',
        //     style: columnStyles.platform
        // },
        {
            header: 'Status',
            accessor: 'statusStyle',
            style: columnStyles.status,
            cell: (data: any) => <StatusBadge status={data.statusStyle} />
        }
    ];

    return (
        <div className="flex flex-col border py-[40px] px-[46px] rounded-[15px] border-border_color bg-white gap-[35px]">
            <div className="flex justify-between items-center">
                <h1 className="text-[24px] font-beausans">{t('title')}</h1>
            </div>
            <div className="flex items-center gap-4 w-full">
                <input
                    type="text"
                    placeholder={t('enter-order-code')}
                    className="h-[42px] flex-grow rounded-[10px] border border-[#E1E1E1] outline-none px-5 py-2"
                    value={orderCodeFilter}
                    onChange={(e) => setOrderCodeFilter(e.target.value)}
                />
                <Button
                    onClick={handleSearch}
                    type="submit"
                    className="h-[42px] w-fit px-4 py-2 text-sm text-white rounded-[86px] md:rounded-[86px]"
                    style={{
                        background: 'var(--Primary-500, #33A959)'
                    }}
                >
                    {t('search-orders')}
                </Button>
            </div>
            <div style={tableStyles.tableContainer}>
                <div style={tableStyles.table}>
                    {loading ? (
                        <TableSkeleton />
                    ) : transformedData.length > 0 ? (
                        <Table columns={columns} data={transformedData} />
                    ) : (
                        <div className="text-center py-8 text-gray-600 text-lg">
                            {t('no-orders')}
                        </div>
                    )}
                </div>
            </div>
            <Pagination
                page={page}
                limit={limit}
                setPage={setPage}
                total={
                    data?.getProductOrdersViewAggregate?.aggregate?.count || 0
                }
            />
        </div>
    );
};

export default PreOrders;
