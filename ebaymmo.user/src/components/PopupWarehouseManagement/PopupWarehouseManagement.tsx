import React from 'react';
import Modal from '../BaseUI/Modal';
import PopupAddProduct from '../PopupAddProduct/PopupAddProduct';
import { useQuery, useMutation } from '@apollo/client';
import {
    useGetProductsByStoreQuery,
    useUpdateProductStatusMutation,
    useDeleteProductMutation,
    useDeleteProductItemsMutation,
    useDeleteProductUploadLogsMutation,
    useUpdateProductMutation,
    useCheckProductInOrdersQuery,
    useUpdateProductEnabledMutation
} from '@/generated/graphql';
import StatusModal from '../StatusModal';
import Switch from '../BaseUI/Switch';
import { useTranslations } from 'next-intl';

interface PopupWarehouseManagementProps {
    isOpen: boolean;
    onClose: () => void;
    onReopen: () => void;
    storeId: string;
    type: string | null;
}

interface WarehouseItem {
    productName: string;
    price: number;
    status: boolean;
    stockCount: number;
}

const PopupWarehouseManagement = ({
    isOpen,
    onClose,
    onReopen,
    storeId,
    type
}: PopupWarehouseManagementProps) => {
    const t = useTranslations();
    const [isAddProductOpen, setIsAddProductOpen] = React.useState<{
        isOpen: boolean;
        productId: string | null;
    }>({
        isOpen: false,
        productId: null
    });

    // Query products của store
    const {
        data,
        loading,
        error,
        refetch: refetchProducts
    } = useGetProductsByStoreQuery({
        variables: { storeId },
        skip: !storeId
    });

    const [statusModal, setStatusModal] = React.useState<{
        isOpen: boolean;
        type: 'loading' | 'warning' | 'error' | 'success';
        message: string;
    }>({
        isOpen: false,
        type: 'success',
        message: ''
    });

    const [localStatuses, setLocalStatuses] = React.useState<{
        [key: string]: boolean;
    }>({});

    // Thêm state cho confirm modal
    const [confirmModal, setConfirmModal] = React.useState<{
        isOpen: boolean;
        productId: string | null;
        productName: string;
    }>({
        isOpen: false,
        productId: null,
        productName: ''
    });

    // Thêm state cho edit modal
    const [editModal, setEditModal] = React.useState<{
        isOpen: boolean;
        productId: string | null;
        productName: string;
        price: number;
        status: string;
        isService: boolean;
        priceError: string;
    }>({
        isOpen: false,
        productId: null,
        productName: '',
        price: 0,
        status: 'active',
        isService: false,
        priceError: ''
    });

    // Khởi tạo localStatuses khi data được load
    React.useEffect(() => {
        if (data?.products) {
            const initialStatuses = data.products.reduce(
                (acc, product) => ({
                    ...acc,
                    [product.productId]: product.status === 'active'
                }),
                {}
            );
            setLocalStatuses(initialStatuses);
        }
    }, [data?.products]);

    const handleOpenAddProduct = (productId: string) => {
        onClose();
        setIsAddProductOpen({
            isOpen: true,
            productId
        });
    };

    const handleCloseAddProduct = () => {
        setIsAddProductOpen({
            isOpen: false,
            productId: null
        });
    };

    const handleBackToWarehouse = () => {
        setIsAddProductOpen({
            isOpen: false,
            productId: null
        });
        onReopen();
    };

    const handleCloseStatusModal = () => {
        setStatusModal((prev) => ({ ...prev, isOpen: false }));
    };

    const [updateStatus] = useUpdateProductStatusMutation({
        onCompleted: () => {
            setStatusModal({
                isOpen: true,
                type: 'success',
                message: t('warehouse.statusUpdateSuccess')
            });
            refetchProducts();
        },
        onError: (error) => {
            console.error('Failed to update status:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: t('warehouse.statusUpdateError')
            });
        }
    });

    // Thêm delete mutation
    const [deleteProductItems] = useDeleteProductItemsMutation();
    const [deleteProductUploadLogs] = useDeleteProductUploadLogsMutation();
    const [deleteProduct] = useDeleteProductMutation();

    // Thêm mutation hook để cập nhật product - sử dụng updateProduct thay vì updateProductStatus
    const [updateProduct] = useUpdateProductMutation({
        onCompleted: () => {
            setStatusModal({
                isOpen: true,
                type: 'success',
                message: t(
                    type === 'product'
                        ? 'warehouse.productUpdateSuccess'
                        : 'warehouse.serviceUpdateSuccess'
                )
            });
            refetchProducts();
        },
        onError: (error: any) => {
            console.error('Failed to update product:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : t(
                              type === 'product'
                                  ? 'warehouse.productUpdateError'
                                  : 'warehouse.serviceUpdateError'
                          )
            });
        }
    });

    const handleStatusToggle = async (
        productId: string,
        currentStatus: string | null | undefined
    ) => {
        try {
            setLocalStatuses((prev) => ({
                ...prev,
                [productId]: !prev[productId]
            }));

            const newStatus =
                currentStatus === 'active' ? 'inactive' : 'active';
            await updateStatus({
                variables: {
                    productId: productId,
                    status: newStatus
                }
            });
        } catch (error) {
            setLocalStatuses((prev) => ({
                ...prev,
                [productId]: !prev[productId]
            }));
            console.error('Error updating status:', error);
        }
    };

    const handleDeleteClick = (productId: string, productName: string) => {
        setConfirmModal({
            isOpen: true,
            productId,
            productName
        });
    };

    const { data: checkProductInOrdersData } = useCheckProductInOrdersQuery({
        variables: {
            productId: confirmModal.productId || ''
        },
        skip: !confirmModal.productId
    });

    const [updateProductEnabled] = useUpdateProductEnabledMutation();

    const handleConfirmDelete = async () => {
        if (!confirmModal.productId) return;

        try {
            // 1. Kiểm tra xem product có trong orders không
            const hasOrdersData =
                checkProductInOrdersData &&
                checkProductInOrdersData.orders &&
                checkProductInOrdersData.orders.length > 0;

            // 2. Xóa product upload logs
            await deleteProductUploadLogs({
                variables: {
                    productId: confirmModal.productId
                }
            });

            // 3. Xóa product items
            await deleteProductItems({
                variables: {
                    productId: confirmModal.productId
                }
            });

            // 4. Nếu product có trong orders, chỉ set isEnabled = false
            if (hasOrdersData) {
                await updateProductEnabled({
                    variables: {
                        productId: confirmModal.productId,
                        isEnabled: false
                    }
                });
            } else {
                // 5. Nếu không có trong orders, xóa product hoàn toàn
                await deleteProduct({
                    variables: {
                        productId: confirmModal.productId
                    }
                });
            }

            setStatusModal({
                isOpen: true,
                type: 'success',
                message: hasOrdersData
                    ? 'Product has been disabled and related data deleted successfully'
                    : 'Product and related data deleted successfully'
            });

            refetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to delete product'
            });
        } finally {
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
    };

    const handleCancelDelete = () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    };

    const handleOpenEditModal = (product: any) => {
        setEditModal({
            isOpen: true,
            productId: product.productId,
            productName: product.productName || '',
            price: product.price || 0,
            status: product.status || 'active',
            isService: product.is_service || false,
            priceError: ''
        });
    };

    const handleCloseEditModal = () => {
        setEditModal((prev) => ({ ...prev, isOpen: false }));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editModal.productId) return;

        // Validate price before submitting
        if (editModal.price < 0) {
            setEditModal((prev) => ({
                ...prev,
                priceError: 'Price cannot be negative'
            }));
            return;
        }

        if (editModal.price > 1000000) {
            setEditModal((prev) => ({
                ...prev,
                priceError: 'Price cannot exceed 1,000,000 USDT'
            }));
            return;
        }

        try {
            // Sử dụng updateProduct mutation để cập nhật nhiều trường
            await updateProduct({
                variables: {
                    productId: editModal.productId,
                    productName: editModal.productName,
                    price: editModal.price,
                    status: editModal.status
                }
            });

            handleCloseEditModal();

            setStatusModal({
                isOpen: true,
                type: 'success',
                message: t(
                    type === 'product'
                        ? 'warehouse.productUpdateSuccess'
                        : 'warehouse.serviceUpdateSuccess'
                )
            });
        } catch (error: any) {
            console.error('Error updating product:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : t(
                              type === 'product'
                                  ? 'warehouse.productUpdateError'
                                  : 'warehouse.serviceUpdateError'
                          )
            });
        }
    };

    const validatePrice = (value: string) => {
        const numValue = parseFloat(value);
        if (numValue < 0) {
            return t('warehouse.priceNegativeError');
        } else if (numValue > 1000000) {
            return t('warehouse.priceExceedsLimitError');
        }
        return '';
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numValue = parseFloat(value);
        const error = validatePrice(value);

        setEditModal((prev) => ({
            ...prev,
            price: isNaN(numValue) ? 0 : numValue,
            priceError: error
        }));
    };

    if (loading)
        return (
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={t('warehouse.title')}
                className="w-[95%] h-[80vh] sm:h-auto sm:w-[80%] md:w-[70%] lg:max-w-[1200px]"
                noButton
            >
                <div className="w-full px-2 sm:px-6">
                    <div className="max-h-[60vh] sm:max-h-[550px] overflow-y-auto">
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed whitespace-nowrap">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="pl-2 sm:pl-[15px] text-left w-[180px]">
                                            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse" />
                                        </th>
                                        <th className="py-3 text-center w-[100px] hidden sm:table-cell">
                                            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
                                        </th>
                                        <th className="py-3 text-center w-[100px] hidden sm:table-cell">
                                            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
                                        </th>
                                        <th className="py-3 text-center w-[100px] hidden sm:table-cell">
                                            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
                                        </th>
                                        <th className="pr-2 sm:pr-[15px] text-right w-[120px] hidden sm:table-cell">
                                            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse ml-auto" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...Array(5)].map((_, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="py-3 pl-2 sm:pl-[15px]">
                                                <div className="flex flex-col sm:hidden gap-2">
                                                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                                                    <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                                                    <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
                                                    <div className="flex gap-2 mt-2">
                                                        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                                                        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                                                        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                                                    </div>
                                                </div>
                                                <div className="hidden sm:block">
                                                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
                                                </div>
                                            </td>
                                            <td className="py-3 text-center hidden sm:table-cell">
                                                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse mx-auto" />
                                            </td>
                                            <td className="py-3 hidden sm:table-cell">
                                                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse mx-auto" />
                                            </td>
                                            <td className="py-3 text-center hidden sm:table-cell">
                                                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
                                            </td>
                                            <td className="py-3 pr-2 sm:pr-[15px] hidden sm:table-cell">
                                                <div className="flex flex-col gap-1 items-end">
                                                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                                                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                                                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </Modal>
        );
    if (error)
        return (
            <div>
                {t('common.statuses.error')}: {error.message}
            </div>
        );

    const products = data?.products || [];

    // Thay đổi button Edit để kích hoạt modal
    const renderEditButton = (item: any) => (
        <div className="relative group">
            <button
                className="text-[#33A959] font-btbeau text-[16px] sm:text-[18px] font-[400] underline decoration-solid underline-offset-2"
                onClick={() => handleOpenEditModal(item)}
            >
                {t('common.buttons.edit')}
            </button>
        </div>
    );

    return (
        <>
            <div className="relative">
                <Modal
                    isOpen={isOpen}
                    onClose={onClose}
                    title={t('warehouse.title')}
                    className="w-[95%] h-[80vh] sm:h-auto sm:w-[80%] md:w-[70%] lg:max-w-[1200px]"
                    noButton
                >
                    <div className="w-full px-2 sm:px-6">
                        <div
                            className="max-h-[60vh] sm:max-h-[550px] overflow-y-auto 
                            [&::-webkit-scrollbar]:w-2
                            [&::-webkit-scrollbar]:h-full
                            [&::-webkit-scrollbar-track]:bg-gray-100
                            [&::-webkit-scrollbar-thumb]:bg-[#33A959]
                            [&::-webkit-scrollbar-thumb]:rounded-full
                            [&::-webkit-scrollbar-thumb]:max-h-[20%]"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full table-fixed whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="pl-2 sm:pl-[15px] text-left w-[180px] text-[16px] sm:text-[18px] font-[700] leading-[160%] text-[#3F3F3F]">
                                                <span className="sm:hidden">
                                                    {t('warehouse.listProduct')}
                                                </span>
                                                <span className="hidden sm:block">
                                                    {t('warehouse.productName')}
                                                </span>
                                            </th>
                                            <th className="py-3 text-center w-[100px] text-[16px] sm:text-[18px] font-[700] leading-[160%] text-[#3F3F3F] hidden sm:table-cell">
                                                {t('product.details.price')}
                                            </th>
                                            <th className="py-3 text-center w-[100px] text-[16px] sm:text-[18px] font-[700] leading-[160%] text-[#3F3F3F] hidden sm:table-cell">
                                                {t('warehouse.status')}
                                            </th>
                                            {type === 'product' && (
                                                <th className="py-3 text-center w-[100px] text-[16px] sm:text-[18px] font-[700] leading-[160%] text-[#3F3F3F] hidden sm:table-cell">
                                                    {t('product.details.stock')}
                                                </th>
                                            )}
                                            <th className="pr-2 sm:pr-[15px] text-right w-[120px] text-[16px] sm:text-[18px] font-[700] leading-[160%] text-[#3F3F3F] hidden sm:table-cell">
                                                {t('warehouse.action')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((item, index) => (
                                            <tr
                                                key={item.productId}
                                                className="border-b"
                                            >
                                                <td className="py-3 pl-2 sm:pl-[15px] text-left text-[#1C1C1C] font-btbeau text-[16px] sm:text-[18px] font-[400] leading-[160%]">
                                                    <div className="flex flex-col sm:hidden border-b pb-2 mb-2">
                                                        <span className=" w-full max-w-[300px] whitespace-normal break-words overflow-hidden">
                                                            {item.productName}
                                                        </span>
                                                        <span className="text-[14px] text-gray-600">
                                                            {t(
                                                                'product.details.price'
                                                            )}
                                                            : {item.price} USDT
                                                        </span>
                                                        {type === 'product' && (
                                                            <span className="text-[14px] text-gray-600">
                                                                {t(
                                                                    'product.details.stock'
                                                                )}
                                                                :{' '}
                                                                {
                                                                    item.stockCount
                                                                }
                                                            </span>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-1 sm:hidden">
                                                            <span className="text-[14px] text-gray-600">
                                                                {t(
                                                                    'warehouse.status'
                                                                )}
                                                                :
                                                            </span>
                                                            <div className="flex justify-center [&_.peer-focus\:ring-4]:ring-0 [&_.peer-focus\:outline-none]:outline-none [&_.peer]:focus:outline-none">
                                                                <Switch
                                                                    checked={
                                                                        localStatuses[
                                                                            item
                                                                                .productId
                                                                        ] ??
                                                                        false
                                                                    }
                                                                    onChange={() =>
                                                                        handleStatusToggle(
                                                                            item.productId,
                                                                            item.status ??
                                                                                ''
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 mt-2">
                                                            {renderEditButton(
                                                                item
                                                            )}
                                                            {type ===
                                                                'product' && (
                                                                <button
                                                                    className="text-[#33A959] text-[14px] underline decoration-solid underline-offset-2"
                                                                    onClick={() =>
                                                                        handleOpenAddProduct(
                                                                            item.productId
                                                                        )
                                                                    }
                                                                >
                                                                    {t(
                                                                        'warehouse.addItem'
                                                                    )}
                                                                </button>
                                                            )}
                                                            <button
                                                                className="text-[#33A959] text-[14px] underline decoration-solid underline-offset-2"
                                                                onClick={() =>
                                                                    handleDeleteClick(
                                                                        item.productId ||
                                                                            '',
                                                                        item.productName ||
                                                                            ''
                                                                    )
                                                                }
                                                            >
                                                                {type ===
                                                                'product'
                                                                    ? t(
                                                                          'warehouse.deleteProduct'
                                                                      )
                                                                    : t(
                                                                          'warehouse.deleteService'
                                                                      )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="hidden sm:block w-full max-w-[300px] whitespace-normal break-words overflow-hidden">
                                                        {item.productName}
                                                    </div>
                                                </td>
                                                <td className="py-3 text-center text-[#1C1C1C] font-btbeau text-[16px] sm:text-[18px] font-[400] leading-[160%] hidden sm:table-cell">
                                                    {item.price} USDT
                                                </td>
                                                <td className="py-3 hidden sm:table-cell">
                                                    <div className="flex justify-center [&_.peer-focus\:ring-4]:ring-0 [&_.peer-focus\:outline-none]:outline-none [&_.peer]:focus:outline-none">
                                                        <Switch
                                                            checked={
                                                                localStatuses[
                                                                    item
                                                                        .productId
                                                                ] ?? false
                                                            }
                                                            onChange={() =>
                                                                handleStatusToggle(
                                                                    item.productId,
                                                                    item.status ??
                                                                        ''
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                </td>
                                                {type === 'product' && (
                                                    <td className="py-3 text-center text-[#1C1C1C] font-btbeau text-[16px] sm:text-[18px] font-[400] leading-[160%] hidden sm:table-cell">
                                                        {item.stockCount}
                                                    </td>
                                                )}
                                                <td className="py-3 pr-2 sm:pr-[15px] text-right hidden sm:table-cell">
                                                    <div className="flex flex-col gap-1 items-end">
                                                        {renderEditButton(item)}
                                                        {type === 'product' && (
                                                            <button
                                                                className="text-[#33A959] font-btbeau text-[16px] sm:text-[18px] font-[400] underline decoration-solid underline-offset-2"
                                                                onClick={() =>
                                                                    handleOpenAddProduct(
                                                                        item.productId
                                                                    )
                                                                }
                                                            >
                                                                {t(
                                                                    'warehouse.addItem'
                                                                )}
                                                            </button>
                                                        )}
                                                        <button
                                                            className="text-[#33A959] font-btbeau text-[16px] sm:text-[18px] font-[400] underline decoration-solid underline-offset-2"
                                                            onClick={() =>
                                                                handleDeleteClick(
                                                                    item.productId ||
                                                                        '',
                                                                    item.productName ||
                                                                        ''
                                                                )
                                                            }
                                                        >
                                                            {type === 'product'
                                                                ? t(
                                                                      'warehouse.deleteProduct'
                                                                  )
                                                                : t(
                                                                      'warehouse.deleteService'
                                                                  )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </Modal>

                {/* Confirm Delete Modal */}
                <Modal
                    isOpen={confirmModal.isOpen}
                    onClose={handleCancelDelete}
                    title={t('warehouse.confirmDelete')}
                    className="max-w-[880px] sm:w-[90%]"
                    noButton
                >
                    <div className="p-4 text-center">
                        <p className="mb-4 text-[16px] text-gray-600">
                            {t('warehouse.deleteConfirmation', {
                                name: confirmModal.productName
                            })}
                        </p>
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={handleCancelDelete}
                                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-100"
                            >
                                {t('common.buttons.cancel')}
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
                            >
                                {t('warehouse.delete')}
                            </button>
                        </div>
                    </div>
                </Modal>

                {/* Edit Modal */}
                <Modal
                    isOpen={editModal.isOpen}
                    onClose={handleCloseEditModal}
                    title={t(
                        type === 'product'
                            ? 'warehouse.editProduct'
                            : 'warehouse.editService'
                    )}
                    className="max-w-[600px] sm:w-[90%]"
                    noButton
                >
                    <div className="p-4">
                        <form onSubmit={handleEditSubmit}>
                            <div className="mb-4">
                                <label
                                    htmlFor="productName"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    {t(
                                        type === 'product'
                                            ? 'warehouse.productName'
                                            : 'warehouse.serviceName'
                                    )}
                                </label>
                                <input
                                    type="text"
                                    id="productName"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#33A959]"
                                    value={editModal.productName}
                                    onChange={(e) =>
                                        setEditModal((prev) => ({
                                            ...prev,
                                            productName: e.target.value
                                        }))
                                    }
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label
                                    htmlFor="productPrice"
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    {t('warehouse.priceUsdt')}
                                </label>
                                <input
                                    type="number"
                                    id="productPrice"
                                    className={`w-full p-2 border ${editModal.priceError ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#33A959]`}
                                    value={editModal.price}
                                    onChange={handlePriceChange}
                                    min="0"
                                    max="1000000"
                                    step="0.01"
                                    required
                                />
                                {editModal.priceError && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {editModal.priceError}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    {t('warehouse.priceRange')}
                                </p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('warehouse.status')}
                                </label>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="statusActive"
                                            name="status"
                                            value="active"
                                            className="mr-2"
                                            checked={
                                                editModal.status === 'active'
                                            }
                                            onChange={() =>
                                                setEditModal((prev) => ({
                                                    ...prev,
                                                    status: 'active'
                                                }))
                                            }
                                        />
                                        <label htmlFor="statusActive">
                                            {t('store.status.active')}
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="statusInactive"
                                            name="status"
                                            value="inactive"
                                            className="mr-2"
                                            checked={
                                                editModal.status === 'inactive'
                                            }
                                            onChange={() =>
                                                setEditModal((prev) => ({
                                                    ...prev,
                                                    status: 'inactive'
                                                }))
                                            }
                                        />
                                        <label htmlFor="statusInactive">
                                            {t('store.status.inactive')}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCloseEditModal}
                                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100"
                                >
                                    {t('common.buttons.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-[#33A959] rounded-md hover:bg-[#2d9850]"
                                >
                                    {t('common.buttons.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>

                <PopupAddProduct
                    isOpen={isAddProductOpen.isOpen}
                    onClose={handleCloseAddProduct}
                    onBack={handleBackToWarehouse}
                    productId={isAddProductOpen.productId}
                    refetchProducts={refetchProducts}
                />
            </div>

            {/* Status Modal - Đặt bên ngoài div.relative và thêm style cho container */}
            <div className="fixed inset-0 z-[9999] pointer-events-none">
                <div className="w-full h-full flex items-center justify-center">
                    <div className="pointer-events-auto">
                        <StatusModal
                            isOpen={statusModal.isOpen}
                            type={statusModal.type}
                            message={statusModal.message}
                            onClose={handleCloseStatusModal}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default PopupWarehouseManagement;
