'use client';

import Table from '@/components/BaseUI/Table';
import React, { useState } from 'react';
import StatusBadge from '@/components/StatusProps/StatusBadge';
import Modal from '@/components/BaseUI/Modal';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
    OrderBy,
    useGetResellerProductsQuery,
    useUpdatedResellerMutation
} from '@/generated/graphql';
import { ResellerInfoFragment } from '@/generated/graphql-request';
import { ResellerStatus } from '@/constants/enum';
import StatusModal from '@/components/StatusModal';
import Pagination from '@/components/BaseUI/Pagination';
import usePagination from '@/hooks/usePagination';

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
    action: { width: '80px' },
    store: { width: '120px' },
    resellerName: { width: '120px' },
    commissionRate: { width: '150px' },
    requestDate: { width: '150px' },
    introduction: { width: '550px' },
    status: { width: '120px' }
};

const IntroductionCell = ({ data }: { data: any }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const introduction = data.introduction || '';
    const t = useTranslations('seller.reseller-list');

    return (
        <>
            <div className="w-[360px]">
                <div className="break-words whitespace-normal line-clamp-3">
                    {introduction}
                </div>
                {introduction.length > 350 && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="text-green_main text-xs hover:underline mt-1"
                    >
                        {t('actions.seeMore')}
                    </button>
                )}
            </div>

            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title={t('modal.introduction')}
                    noButton={true}
                    width="600px"
                >
                    <div className="whitespace-normal break-words text-justify p-4 border rounded-md bg-gray-100">
                        {introduction}
                    </div>
                </Modal>
            )}
        </>
    );
};

const TableSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded mb-4" />
        {[...Array(3)].map((_, index) => (
            <div key={index} className="h-[120px] bg-gray-200 rounded mb-2" />
        ))}
    </div>
);

const PageResellerList = () => {
    const t = useTranslations('seller.reseller-list');
    const { data: session } = useSession();
    const sellerId = session?.user?.id;
    const { page, limit, setPage, offset } = usePagination(
        '/seller/reseller-list',
        5
    );

    const { data, loading, error, refetch } = useGetResellerProductsQuery({
        variables: {
            where: {
                store: {
                    sellerId: {
                        _eq: sellerId
                    }
                }
            },
            orderBy: {
                requestDate: OrderBy.Desc
            },
            limit: limit,
            offset: offset
        }
    });
    const [updateReseller] = useUpdatedResellerMutation();

    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: 'loading' as 'loading' | 'success' | 'error',
        message: ''
    });

    if (loading)
        return (
            <div className="flex flex-col border py-[40px] px-[46px] rounded-[15px] border-border_color bg-white gap-[35px]">
                <div className="flex justify-between items-center">
                    <h1 className="text-[24px] font-[500]">{t('title')}</h1>
                </div>
                <TableSkeleton />
            </div>
        );
    if (error) return <div>Error: {error.message}</div>;

    const actionButtons = (reseller: ResellerInfoFragment) => (
        <div className="flex flex-col space-y-2">
            <button
                className={`text-sm px-3 ${
                    reseller.status === ResellerStatus.Approved
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-[#36B555] hover:underline'
                }`}
                onClick={async () => {
                    if (reseller.status === ResellerStatus.Approved) return;
                    try {
                        setStatusModal({
                            isOpen: true,
                            type: 'loading',
                            message: t('modal.processing')
                        });

                        await updateReseller({
                            variables: {
                                where: {
                                    resellerId: {
                                        _eq: reseller.resellerId
                                    }
                                },
                                _set: {
                                    status: ResellerStatus.Approved,
                                    approvalDate: new Date().toISOString(),
                                    link: `/products/${reseller.store?.slug}?ref=${reseller.user?.referralCode}`
                                }
                            }
                        });

                        await refetch();

                        setStatusModal({
                            isOpen: true,
                            type: 'success',
                            message: t('modal.approveSuccess')
                        });
                    } catch (error) {
                        setStatusModal({
                            isOpen: true,
                            type: 'error',
                            message: t('modal.approveError')
                        });
                        console.error('Error updating reseller:', error);
                    }
                }}
                disabled={reseller.status === ResellerStatus.Approved}
            >
                {t('actions.accept')}
            </button>
            <button
                className={`text-sm px-3 ${
                    reseller.status === ResellerStatus.Approved
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-[#36B555] hover:underline'
                }`}
                onClick={async () => {
                    if (reseller.status === ResellerStatus.Approved) return;
                    try {
                        setStatusModal({
                            isOpen: true,
                            type: 'loading',
                            message: t('modal.processing')
                        });

                        await updateReseller({
                            variables: {
                                where: {
                                    resellerId: {
                                        _eq: reseller.resellerId
                                    }
                                },
                                _set: {
                                    status: ResellerStatus.Rejected,
                                    approvalDate: new Date().toISOString()
                                }
                            }
                        });

                        await refetch();

                        setStatusModal({
                            isOpen: true,
                            type: 'success',
                            message: t('modal.rejectSuccess')
                        });
                    } catch (error) {
                        setStatusModal({
                            isOpen: true,
                            type: 'error',
                            message: t('modal.rejectError')
                        });
                        console.error('Error updating reseller:', error);
                    }
                }}
                disabled={reseller.status === ResellerStatus.Approved}
            >
                {t('actions.cancel')}
            </button>
        </div>
    );
    const transformedData =
        data?.resellers.map((item) => {
            return {
                action: actionButtons(item),
                store: item.store?.storeName,
                resellerName: item.user?.username,
                commissionRate: `${item.commissionRate}%`,
                requestDate: new Date(item.requestDate).toLocaleDateString(
                    'en-GB',
                    {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }
                ),
                introduction: item.notes,
                statusStyle: item.status
            };
        }) || [];

    const columns = [
        {
            header: t('table.action'),
            accessor: 'action',
            style: columnStyles.action
        },
        {
            header: t('table.store'),
            accessor: 'store',
            style: columnStyles.store
        },
        {
            header: t('table.resellerName'),
            accessor: 'resellerName',
            style: columnStyles.resellerName
        },
        {
            header: t('table.commissionRate'),
            accessor: 'commissionRate',
            style: columnStyles.commissionRate
        },
        {
            header: t('table.requestDate'),
            accessor: 'requestDate',
            style: columnStyles.requestDate
        },
        {
            header: t('table.introduction'),
            accessor: 'introduction',
            style: columnStyles.introduction,
            customCell: true,
            cell: (data: any) => <IntroductionCell data={data} />
        },
        {
            header: t('table.status'),
            accessor: 'statusStyle',
            style: columnStyles.status,
            cell: (data: any) => <StatusBadge status={data.status} />
        }
    ];

    return (
        <>
            <div className="flex flex-col border py-6 px-6 lg:py-[40px] lg:px-[46px] rounded-[15px] border-border_color bg-white gap-[35px]">
                <div className="flex justify-between items-center">
                    <h1 className="text-[24px] font-[500]">{t('title')}</h1>
                </div>
                <div style={tableStyles.tableContainer}>
                    <div style={tableStyles.table}>
                        <Table columns={columns} data={transformedData} />
                    </div>
                </div>
                {data?.resellers && data.resellers.length > 5 && (
                    <div className="flex justify-center mt-4">
                        <Pagination
                            total={data?.resellers.length || 0}
                            limit={limit}
                            page={page}
                            setPage={setPage}
                        />
                    </div>
                )}
            </div>
            <StatusModal
                isOpen={statusModal.isOpen}
                type={statusModal.type}
                message={statusModal.message}
                onClose={() =>
                    setStatusModal({ ...statusModal, isOpen: false })
                }
            />
        </>
    );
};

export default PageResellerList;
