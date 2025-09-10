'use client';
import SortableHeader from '@/components/Sort/SortableHeader';
import { useMemo, useState } from 'react';
import Plus from '@images/pluswhile.svg';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import {
    useGetStoreDetailQuery,
    useGetStoreManagementListQuery
} from '@/generated/graphql';
import PopupAddWarehouse from '@/components/PopupAddWarehouse/PopupAddWarehouse';
import PopupWarehouseManagement from '@/components/PopupWarehouseManagement/PopupWarehouseManagement';
import AddModalShop from '@/components/Seller/AddModalShop';
import Modal from '@/components/Modal/Modal';
import EditShopModal from '@/components/Seller/EditShopModal';
import { useTranslations } from 'next-intl';

interface Column {
    key: string;
    title: string;
}

export default function StoreManagement() {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const t = useTranslations('seller.store-management');
    const tAddModalShop = useTranslations('addModalShop');
    // Thêm hook query
    const { data, refetch, loading } = useGetStoreManagementListQuery({
        variables: {
            sellerId: userId
        },
        skip: !userId
    });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedShopForEdit, setSelectedShopForEdit] = useState<string>('');

    const { data: shopDetailData } = useGetStoreDetailQuery({
        variables: {
            storeId: selectedShopForEdit
        },
        skip: !selectedShopForEdit
    });
    const handleOpenEditShop = (storeId: string) => {
        setSelectedShopForEdit(storeId);
        setIsEditModalOpen(true);
    };

    const handleCloseEditShop = () => {
        setIsEditModalOpen(false);
        setSelectedShopForEdit('');
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc' | null;
    }>({ key: '', direction: null });

    const columns: Column[] = [
        { key: 'Actions', title: t('actions') },
        { key: 'ShopName', title: t('shop') },
        { key: 'Type', title: t('type') },
        { key: 'Duplicate', title: t('duplicate') },
        { key: 'Reseller', title: t('reseller') },
        { key: 'PreOrder', title: t('pre-order') },
        { key: 'Stock', title: t('stock') },
        { key: 'Status', title: t('status') }
    ];

    const handleSort = () => {};

    // Thêm state để quản lý modal
    const [isWarehouseManagementOpen, setIsWarehouseManagementOpen] =
        useState(false);
    const [isAddWarehouseOpen, setIsAddWarehouseOpen] = useState(false);
    const [selectedStoreName, setSelectedStoreName] = useState<string>('');
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [selectedStoreType, setSelectedStoreType] = useState<string | null>(
        null
    );
    const handleOpenWarehouseManagement = (storeId: string, type: string) => {
        setSelectedStoreId(storeId);
        setIsWarehouseManagementOpen(true);
        setSelectedStoreType(type);
    };

    const handleCloseWarehouseManagement = () => {
        setIsWarehouseManagementOpen(false);
    };

    const handleAddSuccess = () => {
        refetch(); // Refetch danh sách stores
    };

    // Lấy stores từ response
    const stores = useMemo(() => {
        return data?.stores || [];
    }, [data]);

    return (
        <>
            {loading ? (
                <div className="p-6 border-black-700 border-[1px] rounded-[15px]">
                    <div className="flex flex-col md:gap-[35px] gap-[20px]">
                        {/* Header skeleton */}
                        <div className="flex justify-between items-center">
                            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                            <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
                        </div>

                        {/* Note skeleton */}
                        <div className="flex gap-2">
                            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                        </div>

                        {/* Table skeleton */}
                        <div className="w-full overflow-x-auto">
                            <div className="min-w-[1000px]">
                                {/* Table header skeleton */}
                                <div className="flex bg-[#F7F7F7] p-4">
                                    {[...Array(7)].map((_, index) => (
                                        <div
                                            key={index}
                                            className="w-[180px] md:w-[230px] h-6 bg-gray-200 rounded animate-pulse mx-2"
                                        />
                                    ))}
                                </div>

                                {/* Table rows skeleton */}
                                {[...Array(3)].map((_, rowIndex) => (
                                    <div
                                        key={rowIndex}
                                        className="flex border-t border-gray-200 p-4"
                                    >
                                        {[...Array(7)].map((_, colIndex) => (
                                            <div
                                                key={colIndex}
                                                className="w-[180px] md:w-[230px] h-6 bg-gray-200 rounded animate-pulse mx-2"
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col border md:py-[40px] md:px-[46px] py-[20px] px-[24px] rounded-[15px] border-border_color bg-white md:gap-[35px] gap-[20px] w-full md:max-w-[55vw] mx-auto">
                    <div className="flex justify-between items-center">
                        <h1 className="flex-1 sm:text-[24px] text-[16px] font-[700] font-beausans">
                            {t('shop')}
                        </h1>
                        <div className="flex items-center justify-center">
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex gap-[10px] justify-center items-center mt-4 px-6 py-2 text-[20px] font-[550] bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                            >
                                {t('add-new')}
                                <div className="w-[20px] h-[20px] flex items-center justify-center cursor-pointer">
                                    <Image
                                        src={Plus}
                                        alt="Plus"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </button>
                        </div>
                    </div>
                    <p className="text-[20px] text-neutral-400">
                        <span className="text-secondary-500">
                            {t('note')}:{' '}
                        </span>
                        {t('require')}
                    </p>

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
                                            />
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {stores.length > 0 ? (
                                        stores.map((item) => (
                                            <tr
                                                key={item.storeId}
                                                className="border-t border-gray-200 flex"
                                            >
                                                <td className="py-[16px] px-[16px] text-[18px] font-btbeau font-[400] text-[#3F3F3F] text-center w-[180px] md:w-[230px] flex flex-col items-start">
                                                    <a
                                                        className="text-green_main underline cursor-pointer decoration-solid underline-offset-2 whitespace-nowrap"
                                                        onClick={() =>
                                                            handleOpenEditShop(
                                                                item.storeId
                                                            )
                                                        }
                                                    >
                                                        {t('editShop')}
                                                    </a>
                                                    <a
                                                        className="text-green_main underline cursor-pointer decoration-solid underline-offset-2 whitespace-nowrap"
                                                        onClick={() => {
                                                            setIsAddWarehouseOpen(
                                                                true
                                                            );
                                                            setSelectedStoreName(
                                                                item.storeName ||
                                                                    ''
                                                            );
                                                            setSelectedStoreId(
                                                                item.storeId
                                                            );
                                                            setSelectedStoreType(
                                                                item?.category
                                                                    ?.type ||
                                                                    null
                                                            );
                                                        }}
                                                    >
                                                        {item.category?.type ===
                                                        'service'
                                                            ? t('addService')
                                                            : t('addProduct')}
                                                    </a>
                                                    <a
                                                        onClick={() => {
                                                            handleOpenWarehouseManagement(
                                                                item.storeId,
                                                                item?.category
                                                                    ?.type || ''
                                                            );
                                                        }}
                                                        className="text-green_main underline cursor-pointer decoration-solid underline-offset-2 whitespace-nowrap"
                                                    >
                                                        {t(
                                                            'warehouseManagement'
                                                        )}
                                                    </a>
                                                </td>
                                                <td className="py-[16px] px-[16px] text-[18px] font-btbeau font-[400] text-[#3F3F3F] text-center w-[180px] md:w-[230px] justify-center flex items-center leading-[160%]">
                                                    {item.storeName}
                                                </td>
                                                <td className="py-[16px] px-[16px] text-[18px] font-btbeau font-[400] text-[#3F3F3F] text-center w-[180px] md:w-[230px] justify-center flex items-center leading-[160%]">
                                                    {item.category?.type}
                                                </td>
                                                <td className="py-[16px] px-[16px] text-[18px] font-btbeau font-[400] text-[#3F3F3F] text-center w-[180px] md:w-[230px] justify-center flex items-center leading-[160%]">
                                                    <Image
                                                        src={
                                                            item.duplicateProduct
                                                                ? '/images/green-check.svg'
                                                                : '/images/red-close.svg'
                                                        }
                                                        alt={
                                                            item.duplicateProduct
                                                                ? 'Allowed'
                                                                : 'Not Allowed'
                                                        }
                                                        width={24}
                                                        height={24}
                                                    />
                                                </td>
                                                <td className="py-[16px] px-[16px] text-[18px] font-btbeau font-[400] text-[#3F3F3F] text-center w-[180px] md:w-[230px] justify-center flex items-center leading-[160%]">
                                                    <Image
                                                        src={
                                                            item.allowReseller
                                                                ? '/images/green-check.svg'
                                                                : '/images/red-close.svg'
                                                        }
                                                        alt={
                                                            item.allowReseller
                                                                ? 'Allowed'
                                                                : 'Not Allowed'
                                                        }
                                                        width={24}
                                                        height={24}
                                                    />
                                                </td>
                                                <td className="py-[16px] px-[16px] text-[18px] font-btbeau font-[400] text-[#3F3F3F] text-center w-[180px] md:w-[230px] justify-center flex items-center leading-[160%]">
                                                    <Image
                                                        src={
                                                            item.allowPreOrder
                                                                ? '/images/green-check.svg'
                                                                : '/images/red-close.svg'
                                                        }
                                                        alt={
                                                            item.allowPreOrder
                                                                ? 'Allowed'
                                                                : 'Not Allowed'
                                                        }
                                                        width={24}
                                                        height={24}
                                                    />
                                                </td>
                                                <td className="py-[16px] px-[16px] text-[18px] font-btbeau font-[400] text-[#3F3F3F] text-center w-[180px] md:w-[230px] justify-center flex items-center leading-[160%]">
                                                    {item.totalStockCount}
                                                </td>
                                                <td className="py-[16px] px-[16px] text-[18px] font-btbeau font-[400] text-[#3F3F3F] text-center w-[180px] md:w-[230px] justify-center flex items-center leading-[160%]">
                                                    <span
                                                        className={`px-4 py-1 rounded-[4px] ${
                                                            item.status?.toLowerCase() ===
                                                            'pending'
                                                                ? 'bg-[#FFF8E7] text-[#FFB800]'
                                                                : item.status?.toLowerCase() ===
                                                                    'active'
                                                                  ? 'bg-[#E7FFE7] text-[#33A959]'
                                                                  : 'bg-[#FFE7E7] text-[#FF4B55]'
                                                        }`}
                                                    >
                                                        {item.status?.toLowerCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8}>
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
                </div>
            )}

            {isModalOpen && (
                <Modal
                    title={tAddModalShop('addShop')}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                >
                    <AddModalShop
                        onSubmit={() => {
                            setIsModalOpen(false);
                        }}
                        onSuccess={handleAddSuccess}
                    />
                </Modal>
            )}
            {/* Add Modal */}
            <PopupAddWarehouse
                isOpen={isAddWarehouseOpen}
                onClose={() => setIsAddWarehouseOpen(false)}
                storeName={selectedStoreName}
                storeId={selectedStoreId}
                type={selectedStoreType}
            />
            {/* Thêm Modal cho Warehouse Management */}
            <PopupWarehouseManagement
                isOpen={isWarehouseManagementOpen}
                onClose={handleCloseWarehouseManagement}
                onReopen={() => setIsWarehouseManagementOpen(true)}
                storeId={selectedStoreId}
                type={selectedStoreType}
            />
            {/* Edit Shop Modal */}
            {isEditModalOpen && shopDetailData?.storesByPk && (
                <Modal isOpen={isEditModalOpen} onClose={handleCloseEditShop}>
                    <EditShopModal
                        storeData={shopDetailData.storesByPk}
                        storeId={selectedShopForEdit}
                        onSubmit={handleCloseEditShop}
                        onSuccess={handleAddSuccess}
                    />
                </Modal>
            )}
        </>
    );
}
