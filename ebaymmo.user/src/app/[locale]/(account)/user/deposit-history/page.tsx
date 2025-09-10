'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/BaseUI/Modal';
import Button from '@/components/BaseUI/Button/button';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/BaseUI/Pagination';
import { useGetDepositsQuery } from '@/generated/graphql';
import { useTranslations, useLocale } from 'next-intl';

export default function DepositHistory() {
    const t = useTranslations('deposit-history');
    const locale = useLocale();
    const { page, limit, setPage } = usePagination('/user/deposit-history', 5);
    const [selectedDeposit, setSelectedDeposit] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Sử dụng hook GraphQL
    const { data, loading, error, refetch } = useGetDepositsQuery();

    // Refetch data when locale changes
    useEffect(() => {
        refetch();
    }, [locale, refetch]);

    // Tính toán phân trang
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const deposits = data?.deposits || [];
    const displayedDeposits = deposits.slice(startIndex, endIndex);

    const handleViewDetails = (deposit: any) => {
        setSelectedDeposit(deposit);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedDeposit(null);
    };

    if (loading)
        return (
            <div className="flex flex-col border md:py-[40px] md:px-[46px] py-[20px] px-[24px] rounded-[15px] border-border_color bg-white md:gap-[35px] gap-[20px]">
                <div className="flex justify-between items-center">
                    <div className="h-[24px] w-[200px] bg-gray-200 animate-pulse rounded" />
                </div>

                <div className="w-full">
                    <div className="w-full overflow-x-auto">
                        <table className="w-full table-fixed border-collapse bg-white shadow-md rounded-lg">
                            <thead className="bg-[#F7F7F7]">
                                <tr>
                                    <th
                                        className="py-4 px-6"
                                        style={{ width: '150px' }}
                                    >
                                        <div className="h-[20px] bg-gray-200 animate-pulse rounded" />
                                    </th>
                                    <th
                                        className="py-4 px-6"
                                        style={{ width: '300px' }}
                                    >
                                        <div className="h-[20px] bg-gray-200 animate-pulse rounded" />
                                    </th>
                                    <th
                                        className="py-4 px-6"
                                        style={{ width: '300px' }}
                                    >
                                        <div className="h-[20px] bg-gray-200 animate-pulse rounded" />
                                    </th>
                                    <th
                                        className="py-4 px-6"
                                        style={{ width: '150px' }}
                                    >
                                        <div className="h-[20px] bg-gray-200 animate-pulse rounded" />
                                    </th>
                                    <th
                                        className="py-4 px-6"
                                        style={{ width: '150px' }}
                                    >
                                        <div className="h-[20px] bg-gray-200 animate-pulse rounded" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(5)].map((_, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className="border-t border-gray-200"
                                    >
                                        <td
                                            className="py-4 px-6"
                                            style={{ width: '150px' }}
                                        >
                                            <div className="h-[20px] bg-gray-200 animate-pulse rounded" />
                                        </td>
                                        <td
                                            className="py-4 px-6"
                                            style={{ width: '300px' }}
                                        >
                                            <div className="h-[20px] bg-gray-200 animate-pulse rounded" />
                                        </td>
                                        <td
                                            className="py-4 px-6"
                                            style={{ width: '300px' }}
                                        >
                                            <div className="h-[20px] bg-gray-200 animate-pulse rounded" />
                                        </td>
                                        <td
                                            className="py-4 px-6"
                                            style={{ width: '150px' }}
                                        >
                                            <div className="h-[20px] bg-gray-200 animate-pulse rounded" />
                                        </td>
                                        <td
                                            className="py-4 px-6"
                                            style={{ width: '150px' }}
                                        >
                                            <div className="h-[20px] bg-gray-200 animate-pulse rounded" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );

    if (error) return <div>{t('errorLoading')}</div>;

    return (
        <div className="flex flex-col border md:py-[40px] md:px-[46px] py-[20px] px-[24px] rounded-[15px] border-border_color bg-white md:gap-[35px] gap-[20px]">
            <div className="flex justify-between items-center">
                <h1 className="sm:text-[24px] text-[16px] font-[700] font-beausans">
                    {t('title')}
                </h1>
            </div>

            <div className="w-full">
                <div className="w-full overflow-x-auto scrollbar scrollbar-thin scrollbar-track-gray-200 scrollbar-thumb-green_main">
                    <table className="w-full table-fixed border-collapse bg-white shadow-md rounded-lg">
                        <thead className="bg-[#F7F7F7]">
                            <tr>
                                <th
                                    className="py-4 px-6 text-center whitespace-nowrap"
                                    style={{ width: '150px' }}
                                >
                                    {t('table.amount')}
                                </th>
                                <th
                                    className="py-4 px-6 text-center whitespace-nowrap"
                                    style={{ width: '300px' }}
                                >
                                    {t('table.description')}
                                </th>
                                <th
                                    className="py-4 px-6 text-center whitespace-nowrap"
                                    style={{ width: '300px' }}
                                >
                                    {t('table.depositAt')}
                                </th>
                                <th
                                    className="py-4 px-6 text-center whitespace-nowrap"
                                    style={{ width: '150px' }}
                                >
                                    {t('table.status')}
                                </th>
                                <th
                                    className="py-4 px-6 text-center whitespace-nowrap"
                                    style={{ width: '150px' }}
                                >
                                    {t('table.actions')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedDeposits.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="py-8 text-center text-gray-500"
                                    >
                                        {t('noData')}
                                    </td>
                                </tr>
                            ) : (
                                displayedDeposits.map((deposit) => (
                                    <tr
                                        key={deposit.depositId}
                                        className="border-t border-gray-200"
                                    >
                                        <td className="py-4 px-6 text-center whitespace-nowrap truncate">
                                            {deposit.amount} USDT
                                        </td>
                                        <td className="py-4 px-6 text-center whitespace-nowrap truncate">
                                            {deposit.description}
                                        </td>
                                        <td className="py-4 px-6 text-center whitespace-nowrap truncate">
                                            {new Date(
                                                deposit.depositDate ||
                                                    deposit.createAt
                                            ).toLocaleString()}
                                        </td>
                                        <td className="py-4 px-6 text-center whitespace-nowrap truncate">
                                            <span
                                                className={`inline-block w-[120px] px-3 py-1 rounded-[5px] text-center font-semibold ${
                                                    deposit.depositStatus ===
                                                    'completed'
                                                        ? 'bg-[#6EEC97] text-[#2C995E]'
                                                        : 'bg-[#FFF5D1] text-[#E8B321]'
                                                }`}
                                            >
                                                {deposit.depositStatus}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center whitespace-nowrap truncate">
                                            <a
                                                onClick={() =>
                                                    handleViewDetails(deposit)
                                                }
                                                className="text-[#37C04C] underline cursor-pointer"
                                            >
                                                {t('table.viewDetails')}
                                            </a>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                page={page}
                limit={5}
                setPage={setPage}
                total={deposits.length}
            />

            {isModalOpen && selectedDeposit && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={t('modal.title')}
                    width="800px"
                    noButton={true}
                >
                    <div className="p-4">
                        <h3 className="text-xl font-bold mb-4">
                            {t('modal.depositLogs')}
                        </h3>
                        <div className="overflow-x-auto">
                            <div
                                className="max-h-[400px] overflow-y-auto 
                                [&::-webkit-scrollbar]:w-[6px]
                                [&::-webkit-scrollbar-track]:bg-[#F5F5F5]
                                [&::-webkit-scrollbar-thumb]:bg-[#6EEC97]
                                [&::-webkit-scrollbar-thumb]:rounded-[10px]"
                            >
                                <table className="w-full table-auto border-collapse">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr>
                                            <th className="py-2 px-4 text-center">
                                                {t('table.amount')}
                                            </th>
                                            <th className="py-2 px-4 text-center">
                                                {t('modal.processedAt')}
                                            </th>
                                            <th className="py-2 px-4 text-center">
                                                {t('table.status')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedDeposit.depositLogs.map(
                                            (log: any) => (
                                                <tr
                                                    key={log.logId}
                                                    className="border-t border-gray-200"
                                                >
                                                    <td className="py-2 px-4 text-center truncate">
                                                        {log.amount} USDT
                                                    </td>
                                                    <td className="py-2 px-4 text-center truncate">
                                                        {new Date(
                                                            log.processedAt
                                                        ).toLocaleString()}
                                                    </td>
                                                    <td className="py-2 px-4 text-center truncate">
                                                        <span
                                                            className={`inline-block w-[120px] px-3 py-1 rounded-[5px] text-center font-semibold ${
                                                                log.status ===
                                                                'completed'
                                                                    ? 'bg-[#6EEC97] text-[#2C995E]'
                                                                    : 'bg-[#FFF5D1] text-[#E8B321]'
                                                            }`}
                                                        >
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
