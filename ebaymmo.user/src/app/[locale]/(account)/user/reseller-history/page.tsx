'use client';

import Table from '@/components/BaseUI/Table';
import TooltipDropdown from '@/components/ToolTipDropDown/TooltipDropdown';
import Image from 'next/image';
import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    useGetResellerHistoryQuery,
    useGetResellerStoreLinksQuery
} from '@/generated/graphql';
import { OrderBy } from '@/generated/graphql-request';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/BaseUI/Pagination';
import Modal from '@/components/BaseUI/Modal';
import { TableSkeleton } from '@/components/BaseUI/SkeletonTable/SkeletonTable';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

const StoreCellRenderer = ({ data }: { data: any }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const t = useTranslations('reseller-history');

    return (
        <>
            <div className="w-[200px]">
                <div className="break-words whitespace-normal line-clamp-1">
                    {data.resellerStore}
                </div>
                {data?.resellerStore?.length > 5 && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-green_main text-xs hover:underline mt-1"
                    >
                        {t('seeMore')}
                    </button>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t('store')}
                noButton={true}
                width="600px"
            >
                <div className="whitespace-normal break-words text-justify p-4 border rounded-md bg-gray-100">
                    {data.resellerStore}
                </div>
            </Modal>
        </>
    );
};

// Tạo component riêng cho Reseller Link cell
const ResellerLinkCellRenderer = ({ data }: { data: any }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const t = useTranslations('reseller-history');
    const fullLink = `${window.location.origin}${data.resellerLink}`;

    return (
        <>
            <div className="w-[330px]">
                <div className="break-words whitespace-normal line-clamp-1">
                    <Link href={fullLink} target="_blank" className="text-blue-500 hover:text-blue-700">
                        {fullLink}
                    </Link>
                </div>
                {fullLink.length > 30 && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-green_main text-xs hover:underline mt-1"
                    >
                        {t('seeMore')}
                    </button>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={t('resellerLink')}
                noButton={true}
                width="600px"
            >
                <Link href={fullLink} target="_blank" className="whitespace-normal break-words text-justify p-4 border rounded-md bg-gray-100">
                    {fullLink}
                </Link>
            </Modal>
        </>
    );
};

const ResellerHistory = () => {
    const t = useTranslations('reseller-history');
    const [activeTab, setActiveTab] = useState('product');
    const { status, data: session } = useSession();
    const [_, setIsAuthenticated] = useState(false);
    const router = useRouter();
    const userId = session?.user?.id;

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        } else if (status === 'authenticated') {
            setIsAuthenticated(true);
        }
    }, [status, router]);

    const { limit, setPage, page } = usePagination(
        '/user/reseller-history',
        5,
        1
    );

    const { data, loading, error } = useGetResellerStoreLinksQuery({
        variables: {
            where: { userId: { _eq: userId } },
            limit,
            offset: (page - 1) * limit,
            orderBy: [{ resellerId: OrderBy.Desc }]
        }
    });

    const { data: historyData, loading: historyLoading } =
        useGetResellerHistoryQuery({
            variables: {
                limit,
                offset: (page - 1) * limit,
                orderBy: [
                    {
                        createAt: OrderBy.Desc
                    }
                ]
            }
        });

    const totalCount = useMemo(() => {
        return data?.resellerStoreLinks.length || 0;
    }, [data?.resellerStoreLinks.length]);

    const totalHistoryCount = useMemo(() => {
        return historyData?.resellerOrdersViewAggregate?.aggregate?.count || 0;
    }, [historyData?.resellerOrdersViewAggregate?.aggregate?.count]);

    const productColumns = [
        {
            header: t('store'),
            accessor: 'resellerStore',
            customCell: true,
            cell: (data: any) => <StoreCellRenderer data={data} />
        },
        {
            header: t('resellerLink'),
            accessor: 'resellerLink',
            customCell: true,
            cell: (data: any) => <ResellerLinkCellRenderer data={data} />
        },
        {
            header: t('commission'),
            accessor: 'commissionPercentage',
            sortable: true
        },
        {
            header: t('status'),
            accessor: 'statusStyle'
        }
    ];

    const productData =
        data?.resellerStoreLinks?.map((item) => ({
            resellerStore: item.storeName,
            resellerLink: item.shareLink,
            commissionPercentage: item.commissionRate
                ? `${item.commissionRate}%`
                : '',
            statusStyle: item.status
        })) || [];

    const transformedHistoryData =
        historyData?.resellerOrdersView?.map((item) => ({
            orderId: item.orderId,
            purchaseDate: new Date(item.createAt).toLocaleDateString(),
            store: item.storeName || 'N/A',
            quantity: item.quantity || 0,
            unitPrice: item.unitPrice || 0,
            totalAmount: item.totalAmount || 0,
            commission: item.commissionRate || 0,
            commissionAccount: item.commissionAmount || 0,
            statusStyle: item.status || t('statuses.pending')
        })) || [];

    const historyColumns = [
        { header: t('orderId'), accessor: 'orderId', sortable: true },
        { header: t('purchaseDate'), accessor: 'purchaseDate', sortable: true },
        { header: t('store'), accessor: 'store' },
        { header: t('quantity'), accessor: 'quantity', sortable: true },
        { header: t('unitPrice'), accessor: 'unitPrice' },
        { header: t('totalAmount'), accessor: 'totalAmount', sortable: true },
        { header: t('commission'), accessor: 'commission' },
        { header: t('commissionAccount'), accessor: 'commissionAccount' },
        { header: t('status'), accessor: 'statusStyle' }
    ];

    if (loading || historyLoading)
        return (
            <div className="flex flex-col border py-4 md:py-[40px] px-4 md:px-[46px] rounded-[15px] border-border_color bg-white gap-[20px] md:gap-[35px] mx-auto w-[940px] max-w-[100%]">
                <TableSkeleton />
            </div>
        );
    if (error) return <div>Error: {error.message}</div>;

    return (
        <div className="flex flex-col border py-4 md:py-[40px] px-4 md:px-[46px] rounded-[15px] border-border_color bg-white gap-[20px] md:gap-[35px] mx-auto w-[940px] max-w-[100%]">
            <div className="flex items-center">
                <h1 className="sm:text-[24px] text-[16px] font-[700] font-beausans">
                    {t('title')}
                </h1>
                {activeTab === 'history' && (
                    <TooltipDropdown>
                        <span className="flex items-center ml-1 cursor-pointer p-2">
                            <Image
                                src="/images/tiptool.svg"
                                alt="tiptool"
                                width={16}
                                height={16}
                                className="md:w-[20px] md:h-[20px]"
                            />
                        </span>
                        <div className="p-2 md:p-3">
                            <p className="text-[14px] md:text-[16px]">
                                <span className="text-red-500">
                                    {t('tooltip.note')}
                                </span>
                                {t('tooltip.content')}
                            </p>
                        </div>
                    </TooltipDropdown>
                )}
            </div>

            <div className="flex border-b border-border_color text-[16px] md:text-[18px]">
                <button
                    className={`px-4 md:px-6 py-2 ${
                        activeTab === 'product'
                            ? 'text-primary-300 border-b-2 border-primary-400'
                            : 'text-gray-500'
                    }`}
                    onClick={() => setActiveTab('product')}
                >
                    {t('storeList')}
                </button>
                <button
                    className={`px-4 md:px-6 py-2 ${
                        activeTab === 'history'
                            ? 'text-primary-300 border-b-2 border-primary-400'
                            : 'text-gray-500'
                    }`}
                    onClick={() => setActiveTab('history')}
                >
                    {t('history')}
                </button>
            </div>

            <div className="overflow-auto max-h-[400px] md:max-h-[600px]">
                {activeTab === 'product' ? (
                    <Table columns={productColumns} data={productData} />
                ) : (
                    <Table
                        columns={historyColumns}
                        data={transformedHistoryData}
                    />
                )}
            </div>

            <Pagination
                total={activeTab === 'product' ? totalCount : totalHistoryCount}
                page={page}
                limit={limit}
                setPage={setPage}
            />
        </div>
    );
};

export default ResellerHistory;
