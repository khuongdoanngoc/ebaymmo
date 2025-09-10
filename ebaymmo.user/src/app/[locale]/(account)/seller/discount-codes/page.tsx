'use client';
import SortableHeader from '@/components/Sort/SortableHeader';
import { useMemo, useState } from 'react';
import Image from 'next/image';
import Button from '@/components/BaseUI/Button/button';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/BaseUI/Pagination';
import { useStatusModal } from '@/contexts/StatusModalContext';
import Switch from '@/components/BaseUI/Switch';
import AddDiscountModal from '@/components/Seller/AddDiscountModal';
import {
    OrderBy,
    useGetDiscountCodeQuery,
    useUpdatedCouponsMutation
} from '@/generated/graphql';
import { useSession } from 'next-auth/react';
import { jwtDecode } from 'jwt-decode';
import { IDataTokenDecode } from '@/types/global.type';
import { formatDate } from '@/libs/datetime';
import { useTranslations } from 'next-intl';

interface Column {
    key: string;
    title: string;
}

const columns = (t: any): Column[] => [
    { key: 'No.', title: t('seller.discount-codes.table.no') },
    { key: 'DiscountCode', title: t('seller.discount-codes.table.code') },
    { key: 'Store', title: t('seller.discount-codes.table.store') },
    { key: 'Start', title: t('seller.discount-codes.table.start') },
    { key: 'End', title: t('seller.discount-codes.table.end') },
    { key: 'DiscountRate', title: t('seller.discount-codes.table.rate') },
    { key: 'MaxDiscount', title: t('seller.discount-codes.table.maxDiscount') },
    { key: 'DiscountAmount', title: t('seller.discount-codes.table.amount') },
    { key: 'UsageCount', title: t('seller.discount-codes.table.usage') },
    { key: 'Status', title: t('seller.discount-codes.table.status') }
];

export default function DiscountCodes() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isAppearing, setIsAppearing] = useState(false);
    const { page, limit, setPage } = usePagination(
        '/seller/discount-codes',
        10
    );
    const { showModal } = useStatusModal();
    const [sortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc' | null;
    }>({ key: '', direction: null });
    const [updateCoupon] = useUpdatedCouponsMutation();
    const t = useTranslations();

    // event handlers
    // const handleAdd = () => {
    //     showModal('warning', 'Add discount');
    // };
    const handleSort = () => {};
    const handleCheck = (discountCode: string) => {
        showModal('warning', `Do check discount: ${discountCode}`);
    };

    // action data
    const actionsColumn = {
        key: 'Actions',
        title: t('seller.discount-codes.table.actions')
    };
    const actionsValue = (discountCode: string, isChecked: boolean) => (
        <div className="flex gap-2">
            <button
                onClick={() => handleDelete(discountCode)}
                className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            >
                Delete
            </button>
        </div>
    );

    // Handle modal opening with animation
    const handleModalOpen = () => {
        setIsModalOpen(true);
        // Start appearing animation after a tiny delay to ensure DOM is ready
        setTimeout(() => {
            setIsAppearing(true);
        }, 10);
    };

    // Handle modal closing with animation
    const handleModalClose = () => {
        setIsClosing(true);
        setIsAppearing(false);
        setTimeout(() => {
            setIsModalOpen(false);
            setIsClosing(false);
        }, 300); // Match this duration with the CSS animation duration
    };

    const handleCloseModal = () => {
        handleModalClose(); // Use animated close
        refetch(); // Refetch lại dữ liệu
    };

    //intergrate data

    const { data: session } = useSession();
    const decoded = jwtDecode<IDataTokenDecode>(
        session?.user.accessToken as string
    );
    const sellerId =
        decoded['https://hasura.io/jwt/claims']['X-Hasura-User-Id'];
    const { data, loading, error, refetch } = useGetDiscountCodeQuery({
        variables: {
            where: {
                sellerId: {
                    _eq: sellerId
                },
                deleted: {
                    _eq: false
                }
            },
            orderBy: {
                storeName: OrderBy.Asc
            },
            limit: 10,
            offset: 0
        }
    });

    // Replace the loading and error handling with the skeleton UI
    if (error) return <div>Error: {error.message}</div>;

    //delete coupon
    const handleDelete = async (discountCode: string) => {
        await updateCoupon({
            variables: {
                where: {
                    couponCode: {
                        _eq: discountCode
                    }
                },
                _set: {
                    deleted: true
                }
            }
        });
        refetch();

        showModal('success', `Delete discount: ${discountCode}`);
    };

    // Render skeleton UI during loading
    const renderSkeleton = () => (
        <div className="flex flex-col border md:py-[40px] md:px-[46px] py-[20px] px-[24px] rounded-[15px] border-border_color bg-white md:gap-[35px] gap-[20px] w-full md:max-w-[55vw] mx-auto">
            <div className="flex justify-between items-center">
                <div className="h-8 w-40 bg-gray-200 animate-pulse rounded" />
                <div className="h-10 w-28 bg-gray-200 animate-pulse rounded" />
            </div>

            <div className="flex flex-col justify-center w-full">
                <div className="w-full overflow-x-auto scrollbar scrollbar-thin scrollbar-thumb-green max-h-[600px]">
                    <table className="w-full min-w-[1000px] border-collapse bg-white shadow-md rounded-lg">
                        <thead className="bg-[#F7F7F7]">
                            <tr className="flex">
                                {Array(11)
                                    .fill(0)
                                    .map((_, index) => (
                                        <th
                                            key={index}
                                            className="py-[16px] px-[16px] text-[14px] font-[700] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center"
                                        >
                                            <div className="h-6 w-full bg-gray-200 animate-pulse rounded" />
                                        </th>
                                    ))}
                            </tr>
                        </thead>
                        <tbody>
                            {Array(5)
                                .fill(0)
                                .map((_, rowIndex) => (
                                    <tr
                                        key={rowIndex}
                                        className="border-t border-gray-200 flex"
                                    >
                                        {Array(11)
                                            .fill(0)
                                            .map((_, colIndex) => (
                                                <td
                                                    key={colIndex}
                                                    className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center"
                                                >
                                                    <div className="h-6 w-full bg-gray-200 animate-pulse rounded" />
                                                </td>
                                            ))}
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-center mt-4">
                    <div className="h-10 w-64 bg-gray-200 animate-pulse rounded" />
                </div>
            </div>
        </div>
    );

    if (loading) return renderSkeleton();

    return (
        <>
            <div className="flex flex-col border md:py-[40px] md:px-[46px] py-[20px] px-[24px] rounded-[15px] border-border_color bg-white md:gap-[35px] gap-[20px] w-full md:max-w-[55vw] mx-auto">
                <div className="flex justify-between items-center">
                    <h1 className="flex-1 sm:text-[24px] text-[16px] font-[700] font-beausans">
                        {t('seller.discount-codes.title')}
                    </h1>
                    <Button
                        onClick={handleModalOpen}
                        width="fit-content"
                        className="transition-all duration-300 hover:shadow-lg active:scale-95 hover:translate-y-[-2px] active:translate-y-[1px]"
                    >
                        {t('seller.discount-codes.addNew')}
                    </Button>
                </div>

                <div className="flex flex-col justify-center w-full">
                    <div className="w-full overflow-x-auto scrollbar scrollbar-thin scrollbar-thumb-green max-h-[600px]">
                        <table className="w-full min-w-[1000px] border-collapse bg-white shadow-md rounded-lg">
                            <thead className="bg-[#F7F7F7]">
                                <tr className="flex">
                                    {/* actions */}
                                    <SortableHeader
                                        column={actionsColumn}
                                        sortConfig={sortConfig}
                                        onSort={handleSort}
                                    />

                                    {/* columns */}
                                    {columns(t).map((column, index) => (
                                        <SortableHeader
                                            key={index}
                                            column={column}
                                            sortConfig={sortConfig}
                                            onSort={handleSort}
                                        />
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data?.couponsView &&
                                data.couponsView.length > 0 ? (
                                    data.couponsView.map((item, index) => (
                                        <tr
                                            key={index}
                                            className="border-t border-gray-200 flex"
                                        >
                                            <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {actionsValue(
                                                    item.couponCode || '',
                                                    item.isActive || false
                                                )}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {index + 1}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {item.couponCode || 'N/A'}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {item.storeName || 'N/A'}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {item.startDate
                                                    ? formatDate(item.startDate)
                                                    : 'N/A'}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {item.endDate
                                                    ? formatDate(item.endDate)
                                                    : 'N/A'}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {item.discountRate !== null &&
                                                item.discountRate !== undefined
                                                    ? `${item.discountRate}%`
                                                    : 'N/A'}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {item.maximumAmount !== null &&
                                                item.maximumAmount !== undefined
                                                    ? item.maximumAmount
                                                    : 'N/A'}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {item.discountValue !== null &&
                                                item.discountValue !== undefined
                                                    ? item.discountValue
                                                    : 'N/A'}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                {item.usageLimit !== null &&
                                                item.usageLimit !== undefined
                                                    ? item.usageLimit
                                                    : 'N/A'}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[14px] font-[400] text-gray-700 text-left w-[180px] md:w-[230px] justify-center flex items-center">
                                                <span
                                                    className={`px-4 py-1 rounded-[4px] ${item.isActive ? 'bg-primary-300' : 'bg-secondary-300'}`}
                                                >
                                                    {item.isActive
                                                        ? t(
                                                              'seller.discount-codes.status.active'
                                                          )
                                                        : t(
                                                              'seller.discount-codes.status.inactive'
                                                          )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr className="flex">
                                        <td
                                            colSpan={11}
                                            className="py-[16px] px-[16px] text-center w-full"
                                        >
                                            <div className="text-start text-[18px] font-[400] text-gray-700 py-[20px]">
                                                {t(
                                                    'seller.discount-codes.noData'
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination
                        page={page}
                        limit={limit}
                        setPage={setPage}
                        total={data?.couponsView.length}
                    />
                </div>
            </div>
            {isModalOpen && (
                <div
                    className={`fixed inset-0 bg-black/50 flex items-center justify-center z-[5] transition-opacity duration-300 ${isClosing ? 'opacity-0' : isAppearing ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleModalClose}
                >
                    <div
                        className={`relative max-w-[1062px] mx-auto w-[90%] bg-white bg-gradient-to-b lg:py-[40px] lg:px-[60px] px-[30px] py-[20px] from-[#B2FFCB] via-transparent to-white rounded-[35px] max-h-[95vh] overflow-y-auto overflow-x-hidden shadow-lg custom-thin-scrollbar scrollbar scrollbar-thumb-red scrollbar-track-transparent transition-all duration-300 ${isClosing ? 'scale-95 opacity-0' : isAppearing ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={handleModalClose} // Use animated close
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <div className="absolute right-[15px] top-[15px]">
                                <Image
                                    src="/images/close.svg"
                                    width={40}
                                    height={40}
                                    alt="close"
                                    className="w-[40px] h-[40px] object-cover text-black"
                                />
                            </div>
                        </button>

                        {/* Content */}
                        <div className="flex flex-col items-center justify-center w-full gap-[35px] rounded-[35px]">
                            <h2 className="text-[24px] font-bold text-center py-[10px]">
                                {t('seller.discount-codes.modal.title')}
                            </h2>
                            <AddDiscountModal onClose={handleCloseModal} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
