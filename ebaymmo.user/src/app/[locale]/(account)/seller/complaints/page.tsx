'use client';

import Button from '@/components/BaseUI/Button/button';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import Table from '@/components/BaseUI/Table';
import Pagination from '@/components/BaseUI/Pagination';
import { useGetComplainOrderQuery } from '@/generated/graphql';
import usePagination from '@/hooks/usePagination';
import { useRouter } from 'next/navigation';
import CustomDropdown from '../product-orders/CustomDropdown';
import { useTranslations } from 'next-intl';

const TableSkeleton = () => (
    <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded mb-4" />
        {[...Array(3)].map((_, index) => (
            <div key={index} className="h-[120px] bg-gray-200 rounded mb-2" />
        ))}
    </div>
);

const ImageModal = ({
    isOpen,
    onClose,
    imageUrl
}: {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string;
}) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            onClick={onClose}
        >
            <div className="relative max-w-[90vw] max-h-[90vh]">
                <img
                    src={imageUrl}
                    alt="Zoomed Image"
                    className="max-w-full max-h-[90vh] object-contain"
                    onClick={(e) => e.stopPropagation()}
                />
                <button
                    className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2"
                    onClick={onClose}
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default function ComplaintOrder() {
    const t = useTranslations('seller.complaints');
    const d = useTranslations('custom-dropdown');
    const columnStyles = {
        action: { width: '250px' },
        dateComplaint: { width: '120px' },
        code: { width: '130px' },
        store: { width: '300px' },
        buyer: { width: '300px' },
        quantity: { width: '100px' },
        total: { width: '100px' },
        content: { width: '200px' },
        status: { width: '120px' }
    };

    const { data: session, status } = useSession();
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const { page, limit, setPage, offset } = usePagination(
        '/seller/complaints',
        5
    );

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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');

    const { data, loading } = useGetComplainOrderQuery({
        variables: {
            limit,
            offset,
            where: {
                ownerId: {
                    _eq: session?.user?.id
                },
                ...(searchFilters.orderCode && {
                    orderCode: { _ilike: `%${searchFilters.orderCode}%` }
                }),
                ...(searchFilters.buyerName && {
                    username: { _ilike: `%${searchFilters.buyerName}%` }
                }),
                ...(searchFilters.status !== 'All' && {
                    status: { _eq: searchFilters.status.toLowerCase() }
                })
            }
        },
        skip: !userId
    });

    const ComplaintOrders = useMemo(() => {
        return data?.complainView || [];
    }, [data]);

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return { bg: '#FFF7E5', text: '#FFA800' }; // Yellow
            case 'processing':
                return { bg: '#E8F7FF', text: '#0095FF' }; // Blue
            case 'refund':
                return { bg: '#E6F8E9', text: '#36B555' }; // Green
            case 'cancelled':
                return { bg: '#FFE5E5', text: '#FF4242' }; // Red
            default:
                return { bg: '#F5F5F5', text: '#6B7280' }; // Gray
        }
    };

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.id) {
            setUserId(session.user.id);
        }
    }, [session, status]);

    const transformedData =
        ComplaintOrders?.map((complaint) => {
            const statusColor = getStatusColor(complaint?.status || '');
            return {
                chat: (
                    <span
                        onClick={() =>
                            router.push(
                                `/chatbox?chatto=${complaint?.username}`,
                                {
                                    scroll: false
                                }
                            )
                        }
                        className="text-primary-500 hover:underline cursor-pointer"
                    >
                        {t('chat-with', {
                            username: complaint?.username || ''
                        })}
                    </span>
                ),
                dateComplaint: complaint?.createdAt
                    ? new Date(complaint.createdAt).toLocaleDateString()
                    : '-',
                content: complaint?.content || '-',
                image: (
                    <>
                        {complaint?.image ? (
                            <img
                                src={complaint?.image || ''}
                                alt="Complaint Image"
                                className="w-full h-auto object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                    setSelectedImage(complaint?.image || '');
                                    setIsModalOpen(true);
                                }}
                            />
                        ) : (
                            <img
                                alt="Complaint"
                                className="w-full h-auto object-cover rounded opacity-60"
                            />
                        )}
                    </>
                ),
                code: complaint?.orderCode || '',
                store: complaint?.storeName || '-',
                buyer: complaint?.username || '-',
                quantity: complaint?.quantity || 0,
                total: `${complaint?.totalAmount || 0}`,

                status: (
                    <div
                        className="px-3 py-1 rounded-full text-center text-sm"
                        style={{
                            backgroundColor: statusColor.bg,
                            color: statusColor.text
                        }}
                    >
                        {complaint.status}
                    </div>
                )
            };
        }) || [];

    const columns = [
        {
            header: t('table.chat'),
            accessor: 'chat',
            style: columnStyles.action
        },
        {
            header: t('table.dateComplaint'),
            accessor: 'dateComplaint',
            style: columnStyles.dateComplaint
        },
        {
            header: t('table.image'),
            accessor: 'image',
            style: { width: '120px' }
        },
        {
            header: t('table.content'),
            accessor: 'content',
            style: columnStyles.content
        },
        {
            header: t('table.code'),
            accessor: 'code',
            style: columnStyles.code
        },
        {
            header: t('table.store'),
            accessor: 'store',
            style: columnStyles.store
        },
        {
            header: t('table.buyer'),
            accessor: 'buyer',
            style: columnStyles.buyer
        },
        {
            header: t('table.quantity'),
            accessor: 'quantity',
            style: columnStyles.quantity
        },
        {
            header: t('table.total'),
            accessor: 'total',
            style: columnStyles.total
        },
        {
            header: t('table.status'),
            accessor: 'status',
            style: columnStyles.status
        }
    ];

    const handleSearch = () => {
        setSearchFilters(filters); // Cập nhật searchFilters với giá trị hiện tại của filters
        setPage(1); // Reset về trang 1 khi search
    };

    return (
        <>
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
                            options={[
                                d('all'),
                                d('pending'),
                                d('refund'),
                                d('cancelled')
                            ]}
                            selectedValue={filters.status}
                            onChange={(value: string) => {
                                setFilters((prev) => ({
                                    ...prev,
                                    status: value
                                }));
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
                        {t('search-complaints')}
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <div
                        className="content"
                        style={{
                            minWidth: '1720px'
                        }}
                    >
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
                    total={data?.complainViewAggregate?.aggregate?.count || 0}
                />
            </div>
            <ImageModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                imageUrl={selectedImage}
            />
        </>
    );
}
