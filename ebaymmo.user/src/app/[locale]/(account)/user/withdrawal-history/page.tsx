'use client';

import Button from '@/components/BaseUI/Button/button';
import Table from '@/components/BaseUI/Table';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    useGetWithdrawalsQuery,
    useWithdrawalStatusSubscription
} from '@/generated/graphql';
import { OrderBy } from '@/generated/graphql-request';
import { useStatusModal } from '@/contexts/StatusModalContext';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/BaseUI/Pagination';
import RequestWithdrawModal from '@/components/Payment/RequestWithdrawModal';
import { useTranslations } from 'next-intl';

type TableData = Record<string, string | number>;
interface Withdrawal {
    __typename?: string;
    withdrawalId: string;
    userId?: string;
    amount?: number;
    balanceAddress?: string | null;
    withdrawalStatus?: string;
    requestDate?: string;
    processedDate?: string | null;
    description?: string | null;
    createAt?: string;
    updateAt?: string;
    user?: {
        username?: string;
        email?: string;
    } | null;
}

const WithdrawalHistory = () => {
    const t = useTranslations('withdrawal-history');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [_1, setSelectedOrder] = useState<OrderBy | null>(null);
    const [_2, setModalContent] = useState<React.ReactNode>(null);
    const { showModal } = useStatusModal();
    const columns = [
        { header: t('requestDate'), accessor: 'requestDate', sortable: true },
        { header: t('transactionAmount'), accessor: 'amount', sortable: true },
        { header: t('status'), accessor: 'statusStyle', sortable: true },
        { header: t('description'), accessor: 'description' },
        { header: t('balanceAddress'), accessor: 'balanceAddress' }
    ];

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);

    useEffect(() => {
        if (status === 'authenticated') {
            setIsAuthenticated(true);
        } else if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const { limit, setPage, page, offset } = usePagination(
        '/user/withdrawal-history',
        5
    );

    const { data: withdrawalData, refetch } = useGetWithdrawalsQuery({
        variables: {
            where: {
                userId: { _eq: session?.user?.id }
            },
            limit: limit,
            offset: offset
        },
        skip: !session?.user?.id
    });

    useEffect(() => {
        refetch();
    }, [limit, offset, refetch]);

    const { data: latestWithdrawal } = useWithdrawalStatusSubscription({
        variables: {
            userId: session?.user?.id || ''
        },
        skip: !session?.user?.id
    });

    useEffect(() => {
        if (withdrawalData?.withdrawals) {
            setWithdrawals(withdrawalData.withdrawals);
        }
    }, [withdrawalData]);

    useEffect(() => {
        if (latestWithdrawal?.withdrawals) {
            setWithdrawals((prev) =>
                prev.map((w) => {
                    const updated = latestWithdrawal.withdrawals.find(
                        (nw) => nw.withdrawalId === w.withdrawalId
                    );
                    return updated ? { ...w, ...updated } : w;
                })
            );
        }
    }, [latestWithdrawal]);

    const totalCount =
        withdrawalData?.withdrawalsAggregate?.aggregate?.count || 0;

    const tableData: TableData[] =
        withdrawals.map((withdrawal) => ({
            requestDate: new Date(withdrawal.createAt || '').toLocaleDateString(
                'en-US'
            ),
            amount: Number(withdrawal.amount) || 0,
            statusStyle: withdrawal.withdrawalStatus || '',
            description: withdrawal.description || '',
            balanceAddress: withdrawal.balanceAddress || ''
        })) || [];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || isNaN(Number(amount))) {
            showModal('error', t('modal.missingFields'));
            return;
        }

        try {
            // TODO: Add your withdrawal mutation here
            // const response = await withdrawalMutation({ variables: { amount: Number(amount) }});

            showModal('success', t('modal.success'));
            setAmount('');
            handleCloseModal();
        } catch (error) {
            showModal('error', t('modal.error'));
        }
    };

    if (!session?.user?.id)
        return (
            <div className="p-6 border border-black-700 rounded-[15px]">
                <div className="mx-auto max-w-6xl w-full px-4 md:w-[940px]">
                    <div className="flex flex-col gap-6">
                        <div className="bg-white p-6">
                            {/* Header Skeleton */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                                <div className="h-10 w-40 bg-gray-200 rounded-[86px] animate-pulse" />
                            </div>

                            {/* Table Skeleton */}
                            <div className="space-y-4">
                                {/* Table Header */}
                                <div className="flex gap-4 mb-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className="h-8 flex-1 bg-gray-200 rounded animate-pulse"
                                        />
                                    ))}
                                </div>

                                {/* Table Rows */}
                                {[1, 2, 3, 4, 5].map((row) => (
                                    <div key={row} className="flex gap-4">
                                        {[1, 2, 3, 4].map((cell) => (
                                            <div
                                                key={cell}
                                                className="h-12 flex-1 bg-gray-100 rounded animate-pulse"
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Skeleton */}
                            <div className="flex justify-center mt-6">
                                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
        setModalContent(null);
        refetch();
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    return (
        <div className="border border-black-700 rounded-[15px]">
            <div className="w-full">
                <div className="flex flex-col gap-4 sm:gap-6">
                    <div className="bg-white p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                            <h1 className="text-[18px] sm:text-[24px] font-[700] font-beausans">
                                {t('title')}
                            </h1>
                            <Button
                                type="submit"
                                className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base text-white rounded-[86px] bg-[#33A959]"
                                onClick={() => handleOpenModal()}
                            >
                                {t('withdrawalRequest')}
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <Table columns={columns} data={tableData} />
                        </div>

                        <div className="mt-4 sm:mt-6">
                            <Pagination
                                total={totalCount}
                                limit={limit}
                                page={page}
                                setPage={setPage}
                            />
                        </div>
                    </div>

                    {isModalOpen && (
                        <RequestWithdrawModal
                            isOpen={isModalOpen}
                            onClose={handleCloseModal}
                            onSuccess={() => refetch()}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default WithdrawalHistory;
