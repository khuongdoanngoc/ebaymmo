'use client';
import Input from '@/components/BaseUI/Input';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useGetOrderByIdQuery, OrderBy } from '@/generated/graphql';
import Pagination from '@/components/BaseUI/Pagination';
import usePagination from '@/hooks/usePagination';
import { formatDate } from '@/libs/datetime';
import { useState, useEffect, useMemo } from 'react';
import SortableHeader from '@/components/Sort/SortableHeader';
import StoreItemSkeleton from '@/components/Skeleton/StoreItemSkeleton';
import { useTranslations } from 'next-intl';

// Thêm interface cho columns
interface Column {
    key: string;
    title: string;
}

// Định nghĩa các cột có thể sort
const SORTABLE_COLUMNS = ['amount', 'transactionDate'];

export default function TransactionHistory() {
    const t = useTranslations('transaction-history');
    const [total, setTotal] = useState(0);
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc' | null;
    }>({ key: '', direction: null });
    const [searchTerm, setSearchTerm] = useState('');

    // Đặt limit cố định để test
    const TEST_LIMIT = 5; // 5 dòng mỗi trang

    const { page, limit, setPage, setLimit, offset } = usePagination(
        '/user/transaction-history',
        TEST_LIMIT
    );

    // Query để lấy tổng số records
    const { data: totalData } = useGetOrderByIdQuery({
        skip: !session?.user?.accessToken,
        variables: {
            limit: 999999, // Lấy tất cả để đếm tổng
            offset: 0
        },
        pollInterval: 5000 // Poll mỗi 5 giây
    });

    const columns: Column[] = [
        { key: 'transactionDate', title: t('columns.transactionDate') },
        { key: 'transactionCode', title: t('columns.transactionCode') },
        { key: 'amount', title: t('columns.amount') },
        { key: 'orderStatus', title: t('columns.orderStatus') }
    ];

    // Query để lấy data theo trang và sort
    const { data, loading, error } = useGetOrderByIdQuery({
        skip: !session?.user?.accessToken,
        variables: {
            limit: TEST_LIMIT,
            offset: offset
        },
        pollInterval: 5000 // load lại datat mỗi 5 giây ,
    });

    // Cập nhật tổng số records
    useEffect(() => {
        if (totalData?.users[0]?.orders) {
            setTotal(totalData.users[0].orders.length);
        }
    }, [totalData]);

    useEffect(() => {
        setLimit(TEST_LIMIT); // Đồng bộ limit với hook
    }, [setLimit]);

    // Lọc và sắp xếp dữ liệu ở client side
    const filteredAndSortedTransactions = useMemo(() => {
        let items = [...(data?.users[0]?.orders || [])];

        // Lọc theo search term
        if (searchTerm && items.length > 0) {
            items = items.filter((transaction) => {
                const searchValue = searchTerm.toLowerCase();
                return (
                    transaction.orderDate
                        ?.toLowerCase()
                        .includes(searchValue) ||
                    transaction.orderCode
                        ?.toLowerCase()
                        .includes(searchValue) ||
                    transaction.totalAmount?.toString().includes(searchValue) ||
                    transaction.orderStatus?.toLowerCase().includes(searchValue)
                );
            });
        }

        // Sort data
        if (sortConfig.key && sortConfig.direction && items.length > 0) {
            items.sort((a, b) => {
                if (sortConfig.key === 'amount') {
                    return sortConfig.direction === 'asc'
                        ? (a.totalAmount || 0) - (b.totalAmount || 0)
                        : (b.totalAmount || 0) - (a.totalAmount || 0);
                }

                if (sortConfig.key === 'transactionDate') {
                    const dateA = new Date(a.orderDate || '').getTime();
                    const dateB = new Date(b.orderDate || '').getTime();
                    return sortConfig.direction === 'asc'
                        ? dateA - dateB
                        : dateB - dateA;
                }

                return 0;
            });
        }

        return items;
    }, [data, sortConfig, searchTerm]);

    if (status === 'unauthenticated') {
        router.replace('/login');
        return null;
    }

    if (status !== 'authenticated') {
        return null;
    }

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' | null = 'asc';

        if (sortConfig.key === key) {
            if (sortConfig.direction === 'asc') direction = 'desc';
            else if (sortConfig.direction === 'desc') direction = 'asc';
        }

        setSortConfig({ key, direction });
    };

    if (loading)
        return (
            <div
                className="flex flex-col border md:py-[40px] md:px-[46px] py-[20px] px-[24px] rounded-[15px] border-border_color bg-white md:gap-[35px] gap-[20px] w-full mx-auto"
                style={{ maxWidth: 'var(--transaction-container-width, 55vw)' }}
            >
                <div className="flex flex-col gap-4 w-full">
                    <div className="w-full overflow-x-auto scrollbar scrollbar-thin scrollbar-thumb-green">
                        <div className="w-full min-w-[1000px]">
                            {[1, 2, 3].map((i) => (
                                <StoreItemSkeleton key={i} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );

    if (error) return <div>Error: {error.message}</div>;

    return (
        <div
            className="flex flex-col border md:py-[40px] md:px-[46px] py-[20px] px-[24px] rounded-[15px] border-border_color bg-white md:gap-[35px] gap-[20px] w-full mx-auto"
            // style={{ maxWidth: 'var(--transaction-container-width, 55vw)' }}
        >
            <div className="flex justify-between items-center">
                <h1 className="sm:text-[24px] text-[16px] font-[700] font-beausans">
                    {t('title')}
                </h1>
            </div>

            <div className="flex w-full sm:flex-row flex-col">
                <Input
                    display="inherit"
                    type="search"
                    className="rounded-[86px] w-full"
                    placeHolder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex justify-center w-full">
                <div className="w-full overflow-x-auto scrollbar scrollbar-thin scrollbar-thumb-green max-h-[600px]">
                    <table className="w-full min-w-[1000px] border-collapse bg-white shadow-md rounded-lg">
                        <thead className="bg-[#F7F7F7]">
                            <tr className="flex">
                                {columns.map((column) => (
                                    <SortableHeader
                                        key={column.key}
                                        column={column}
                                        sortConfig={sortConfig}
                                        onSort={handleSort}
                                        sortable={SORTABLE_COLUMNS}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAndSortedTransactions.length > 0 ? (
                                filteredAndSortedTransactions.map(
                                    (transaction) => (
                                        <tr
                                            key={transaction.orderId}
                                            className="border-t border-gray-200 flex flex-wrap"
                                        >
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {formatDate(
                                                    transaction.orderDate,
                                                    'DD/MM/YYYY'
                                                )}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {transaction.orderCode}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {transaction.totalAmount}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {transaction.orderStatus}
                                            </td>
                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="text-center text-[18px] font-[400] text-gray-700 py-[20px]">
                                            {t('noTransactions')}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                    {t('showingEntries', {
                        from: offset + 1,
                        to: Math.min(offset + limit, total),
                        total: total
                    })}
                </div>
                <Pagination
                    total={total}
                    limit={limit}
                    page={page}
                    setPage={setPage}
                />
            </div>
        </div>
    );
}
