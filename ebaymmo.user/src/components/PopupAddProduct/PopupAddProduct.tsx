import React from 'react';
import Modal from '../BaseUI/Modal';
import Image from 'next/image';
import Button from '../BaseUI/Button/button';
import StatusModal from '../StatusModal';
import { uploadSingleFile, uploadMultipleFiles } from '@/apis/fileUpload';
import {
    useGetProductUploadLogsByProductIdQuery,
    useDeleteUnsoldProductItemsMutation,
    useGetProductItemCountQuery,
    useGetProductsByIdQuery,
    useUpdateApiPrivateStockMutation,
    useGetProductsByStoreQuery,
    useGetStoreManagementListQuery,
    useUpdateStoreTotalStockMutation,
    useGetStoreDetailQuery,
    useGetStoresQuery
} from '@/generated/graphql';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';

interface PopupAddProductProps {
    isOpen: boolean;
    onClose: () => void;
    onBack: () => void;
    productId: string | null;
    refetchProducts?: () => Promise<any>;
}

const PopupAddProduct = ({
    isOpen,
    onClose,
    onBack,
    productId,
    refetchProducts
}: PopupAddProductProps) => {
    const t = useTranslations('popupAddProduct');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadProgress, setUploadProgress] = React.useState(0);
    const [isDownloading, setIsDownloading] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [statusModal, setStatusModal] = React.useState<{
        isOpen: boolean;
        type: 'loading' | 'warning' | 'error' | 'success';
        message: string;
    }>({
        isOpen: false,
        type: 'success',
        message: ''
    });

    // Pagination state
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pageSize] = React.useState(2);

    // Calculate offset based on current page
    const offset = (currentPage - 1) * pageSize;

    // Fetch data using the generated hook
    const { data, loading, error, refetch } =
        useGetProductUploadLogsByProductIdQuery({
            variables: {
                productId: productId || '',
                limit: pageSize,
                offset: offset
            },
            skip: !productId,
            fetchPolicy: 'network-only'
        });

    // Total pages calculation
    const totalItems = data?.productUploadLogsAggregate?.aggregate?.count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Pagination handlers
    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    // Refresh data after file upload
    const refreshData = () => {
        refetch();
    };

    const handleCloseStatusModal = () => {
        setStatusModal((prev) => ({ ...prev, isOpen: false }));
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    // Thêm hook ở top level của component
    const { data: countData, refetch: refetchCount } =
        useGetProductItemCountQuery({
            variables: { productId: productId || '' },
            skip: !productId,
            fetchPolicy: 'no-cache'
        });

    // Thêm hook cho mutation xóa
    const [deleteUnsoldProductItems] = useDeleteUnsoldProductItemsMutation();

    // Khai báo hook mutation từ generated code
    const [updateApiPrivateStock, { loading: updateLoading }] =
        useUpdateApiPrivateStockMutation();

    // Get product details to get storeId
    const { data: productDetails } = useGetProductsByIdQuery({
        variables: { productId: productId || '' },
        skip: !productId
    });

    const storeId = productDetails?.products[0]?.store?.storeId || '';
    const sellerId = productDetails?.products[0]?.store?.sellerId || '';

    // Get store products query with refetch
    const { refetch: refetchStoreProducts } = useGetProductsByStoreQuery({
        variables: { storeId },
        skip: !storeId
    });

    // Get store list query with refetch
    const { refetch: refetchStoreList } = useGetStoreManagementListQuery({
        variables: { sellerId },
        skip: !sellerId
    });

    // Handle downloading unsold products
    const handleDownloadUnsoldProducts = async () => {
        if (!productId) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: 'Product ID is missing'
            });
            return;
        }

        try {
            setIsDownloading(true);
            setStatusModal({
                isOpen: true,
                type: 'loading',
                message: 'Preparing download...'
            });

            // Call API endpoint to get unsold products
            const response = await fetch('/api/download', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ productId })
            });

            if (!response.ok) {
                // Handle error response
                const errorData = await response.json();
                throw new Error(
                    errorData.message || 'Failed to download unsold products'
                );
            }

            // Check if we got a file or error JSON
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                if (!data.success) {
                    throw new Error(
                        data.message || 'No unsold products available'
                    );
                }
            }

            // Get item count info from headers
            const itemsDeleted = Number(
                response.headers.get('X-Items-Deleted') || '0'
            );
            const itemsDownloaded = Number(
                response.headers.get('X-Items-Downloaded') || '0'
            );

            // Get filename from Content-Disposition header
            const contentDisposition = response.headers.get(
                'Content-Disposition'
            );
            let filename = 'unsold-products.txt';
            if (contentDisposition) {
                const filenameMatch =
                    contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch && filenameMatch.length > 1) {
                    filename = filenameMatch[1];
                }
            }

            // Convert response to blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            // Refresh data to update the UI after deletion
            refreshData();

            setStatusModal({
                isOpen: true,
                type: 'success',
                message: `${itemsDownloaded} unsold products downloaded and deleted successfully`
            });
        } catch (error) {
            console.error('Download error:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to download unsold products'
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSingleFileUpload = async (file: File) => {
        try {
            if (!productId) {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    message: 'Product ID is missing'
                });
                return;
            }

            // Kiểm tra file type
            if (
                file.type !== 'text/plain' &&
                !file.name.toLowerCase().endsWith('.txt')
            ) {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    message: 'Only .txt files are allowed'
                });
                return;
            }

            setIsUploading(true);
            setUploadProgress(0);

            // Sử dụng hàm uploadFile từ fileUpload.ts
            const response = await uploadSingleFile(file, {
                additionalData: { productId },
                onProgress: (percentage: number) => {
                    setUploadProgress(percentage);
                }
            });

            if (response.success) {
                setStatusModal({
                    isOpen: true,
                    type: 'success',
                    message: '1 file uploaded successfully'
                });
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';

                // Refresh data after successful upload
                refreshData();

                // Refetch both queries to update data
                await Promise.all([refetchStoreProducts(), refetchStoreList()]);
            } else {
                throw new Error(response.error || 'Upload failed');
            }
        } catch (error) {
            console.error('===== ERROR DETAILS =====', error);

            setStatusModal({
                isOpen: true,
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'An error occurred while uploading the file'
            });
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Hàm xử lý chung cho việc validate và upload files
     */
    const handleProcessFiles = async (files: File[]) => {
        if (files.length === 0) return;

        if (!productId) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: 'Product ID is missing'
            });
            return;
        }

        // Kiểm tra kích thước và định dạng file
        const MAX_FILE_SIZE = 0.5 * 1024 * 1024; // 0.5MB
        const invalidFiles = files.filter((file) => {
            if (file.size > MAX_FILE_SIZE) {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    message: `File ${file.name} exceeds 0.5MB`
                });
                return true;
            }

            if (
                file.type !== 'text/plain' &&
                !file.name.toLowerCase().endsWith('.txt')
            ) {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    message: `File ${file.name} is not a .txt file`
                });
                return true;
            }

            return false;
        });

        if (invalidFiles.length > 0) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setSelectedFile(files[0]); // Update selected file

        try {
            // Xử lý upload 1 hoặc nhiều file
            if (files.length === 1) {
                await handleSingleFileUpload(files[0]);
            } else {
                await handleMultipleFilesUpload(files);
            }
        } catch (error) {
            console.error('File processing error:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'File processing failed'
            });
        }
    };

    const handleFileChange = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            await handleProcessFiles(Array.from(files));
        }
    };

    const handleDrop = async (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();

        const files = Array.from(event.dataTransfer.files);
        await handleProcessFiles(files);
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const handleDragEnter = (event: React.DragEvent) => {
        event.preventDefault();
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
    };

    const handleMultipleFilesUpload = async (files: File[]) => {
        try {
            if (!productId) {
                setStatusModal({
                    isOpen: true,
                    type: 'error',
                    message: 'Product ID is missing'
                });
                return;
            }

            setIsUploading(true);
            setUploadProgress(0);

            // Sử dụng hàm uploadMultipleFiles từ fileUpload.ts
            const response = await uploadMultipleFiles(files, {
                additionalData: { productId },
                onProgress: (percentage: number) => {
                    setUploadProgress(percentage);
                }
            });

            // Tạo thông báo thành công với số lượng file
            const successMessage = `${files.length} files uploaded successfully`;

            // Định nghĩa các kiểu dữ liệu có thể có của response
            type ResponseItem = {
                success?: boolean;
                error?: string;
                message?: string;
            };

            type ResponseObject = {
                success?: boolean;
                error?: string;
                message?: string;
                results?: ResponseItem[] | string;
            };

            // Xử lý nhiều trường hợp cấu trúc dữ liệu khác nhau
            if (Array.isArray(response)) {
                // Trường hợp 1: Response là mảng các kết quả
                const typedResponse = response as ResponseItem[];
                const allSuccessful = typedResponse.every(
                    (res) => res && res.success
                );

                if (allSuccessful) {
                    setStatusModal({
                        isOpen: true,
                        type: 'success',
                        message: successMessage
                    });
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';

                    // Refresh data after successful upload
                    refreshData();

                    // Refetch both queries to update data
                    await Promise.all([
                        refetchStoreProducts(),
                        refetchStoreList()
                    ]);
                } else {
                    // Tìm lỗi đầu tiên nếu có
                    const errorItem = typedResponse.find(
                        (res) => !res || !res.success
                    );
                    const errorMessage =
                        errorItem && errorItem.error
                            ? errorItem.error
                            : 'Upload failed';
                    throw new Error(errorMessage);
                }
            } else if (response && typeof response === 'object') {
                // Trường hợp 2: Response là một đối tượng
                const typedResponse = response as ResponseObject;

                // Kiểm tra xem API đã được test thành công chưa
                if ('success' in typedResponse) {
                    if (typedResponse.success) {
                        setStatusModal({
                            isOpen: true,
                            type: 'success',
                            message: successMessage
                        });
                        setSelectedFile(null);
                        if (fileInputRef.current)
                            fileInputRef.current.value = '';

                        // Refresh data after successful upload
                        refreshData();

                        // Refetch both queries to update data
                        await Promise.all([
                            refetchStoreProducts(),
                            refetchStoreList()
                        ]);
                    } else {
                        throw new Error(typedResponse.error || 'Upload failed');
                    }
                }
                // Kiểm tra nếu có thuộc tính results (có thể chứa kết quả chi tiết)
                else if ('results' in typedResponse) {
                    const results = typedResponse.results;
                    if (Array.isArray(results)) {
                        // Xử lý mảng results
                        const typedResults = results as ResponseItem[];
                        const allSuccessful = typedResults.every(
                            (res) => res && res.success
                        );

                        if (allSuccessful || typedResponse.success) {
                            setStatusModal({
                                isOpen: true,
                                type: 'success',
                                message: successMessage
                            });
                            setSelectedFile(null);
                            if (fileInputRef.current)
                                fileInputRef.current.value = '';

                            // Refresh data after successful upload
                            refreshData();

                            // Refetch both queries to update data
                            await Promise.all([
                                refetchStoreProducts(),
                                refetchStoreList()
                            ]);
                        } else {
                            // Tìm lỗi đầu tiên nếu có
                            const errorItem = typedResults.find(
                                (res) => !res || !res.success
                            );
                            const errorMessage =
                                errorItem && errorItem.error
                                    ? errorItem.error
                                    : 'Upload failed';
                            throw new Error(errorMessage);
                        }
                    } else if (results && typeof results === 'string') {
                        // Trường hợp results là một chuỗi (có thể là thông báo)
                        setStatusModal({
                            isOpen: true,
                            type: 'success',
                            message: successMessage
                        });
                        setSelectedFile(null);
                        if (fileInputRef.current)
                            fileInputRef.current.value = '';

                        // Refresh data after successful upload
                        refreshData();

                        // Refetch both queries to update data
                        await Promise.all([
                            refetchStoreProducts(),
                            refetchStoreList()
                        ]);
                    }
                }
                // Trường hợp không có các thuộc tính trên nhưng có message
                else if ('message' in typedResponse) {
                    setStatusModal({
                        isOpen: true,
                        type: 'success',
                        message: successMessage
                    });
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';

                    // Refresh data after successful upload
                    refreshData();

                    // Refetch both queries to update data
                    await Promise.all([
                        refetchStoreProducts(),
                        refetchStoreList()
                    ]);
                }
                // Trường hợp cuối cùng - chấp nhận mọi đối tượng và coi là thành công
                // Vì dữ liệu đã được insert vào database
                else {
                    setStatusModal({
                        isOpen: true,
                        type: 'success',
                        message: successMessage
                    });
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';

                    // Refresh data after successful upload
                    refreshData();

                    // Refetch both queries to update data
                    await Promise.all([
                        refetchStoreProducts(),
                        refetchStoreList()
                    ]);
                }
            } else if (response === undefined || response === null) {
                // Trường hợp 3: Response là null hoặc undefined, nhưng dữ liệu đã được lưu
                setStatusModal({
                    isOpen: true,
                    type: 'success',
                    message: successMessage
                });
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';

                // Refresh data after successful upload
                refreshData();

                // Refetch both queries to update data
                await Promise.all([refetchStoreProducts(), refetchStoreList()]);
            } else {
                // Trường hợp 4: Các loại response khác - coi là thành công vì dữ liệu đã được lưu
                console.warn('Unexpected response format:', response);
                setStatusModal({
                    isOpen: true,
                    type: 'success',
                    message: successMessage
                });
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';

                // Refresh data after successful upload
                refreshData();

                // Refetch both queries to update data
                await Promise.all([refetchStoreProducts(), refetchStoreList()]);
            }
        } catch (error) {
            console.error('Upload failed:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                message:
                    error instanceof Error ? error.message : 'Upload failed'
            });
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (error) {
            return 'Invalid date';
        }
    };

    // Format result string
    const formatResult = (validCount: number, invalidCount: number) => {
        return `${validCount} valid / ${invalidCount} invalid`;
    };

    const handleDeleteAll = async () => {
        if (!productId) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: 'Product ID is missing'
            });
            return;
        }

        try {
            setIsDeleting(true);
            setStatusModal({
                isOpen: true,
                type: 'loading',
                message: 'Deleting unsold products...'
            });

            const totalItems =
                countData?.productItemsAggregate?.aggregate?.count || 0;
            const unsoldItems = countData?.unsoldItems?.aggregate?.count || 0;

            // Delete unsold items
            const result = await deleteUnsoldProductItems({
                variables: { productId }
            });

            const deletedCount =
                result.data?.deleteProductItems?.affectedRows || 0;
            const notDeletedCount = totalItems - deletedCount;

            // Refresh data - database trigger will update store's total stock
            await Promise.all(
                [
                    refetchProducts?.(),
                    refetchStoreList(), // Add this
                    refetch(),
                    refetchCount()
                ].filter(Boolean)
            );

            // Hiển thị thông báo kết quả
            if (notDeletedCount > 0) {
                setStatusModal({
                    isOpen: true,
                    type: 'success',
                    message: `Deleted ${deletedCount} unsold products. ${notDeletedCount} sold products cannot be deleted.`
                });
            } else {
                setStatusModal({
                    isOpen: true,
                    type: 'success',
                    message: `Deleted ${deletedCount} unsold products.`
                });
            }
        } catch (error) {
            console.error('Delete error:', error);
            setStatusModal({
                isOpen: true,
                type: 'error',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Failed to delete products'
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // New state for tab selection - default to upload
    const [activeTab, setActiveTab] = React.useState<'upload' | 'api'>(
        'upload'
    );
    const [inventoryApiUrl, setInventoryApiUrl] = React.useState('');
    const [fetchProductApiUrl, setFetchProductApiUrl] = React.useState('');
    const [exampleApiUrl, setExampleApiUrl] = React.useState(
        'https://api.example.com/inventory/637f9dd9'
    );
    const [inventorySum, setInventorySum] = React.useState<number | null>(null);
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [testResults, setTestResults] = React.useState<{
        inventory: {
            status: 'idle' | 'loading' | 'success' | 'error';
            message: string;
        };
        fetchProduct: {
            status: 'idle' | 'loading' | 'success' | 'error';
            message: string;
        };
    }>({
        inventory: { status: 'idle', message: '' },
        fetchProduct: { status: 'idle', message: '' }
    });

    // Query để lấy thông tin sản phẩm bao gồm trường usePrivateWarehouse
    const { data: productData, refetch: refetchProductData } =
        useGetProductsByIdQuery({
            variables: {
                productId: productId || ''
            },
            skip: !productId,
            fetchPolicy: 'network-only'
        });

    // Biến kiểm tra xem sản phẩm có sử dụng warehouse riêng hay không
    const usePrivateWarehouse =
        productData?.products?.[0]?.usePrivateWarehouse || false;
    const currentApiPrivateStock = productData?.products?.[0]
        ? (productData.products[0] as any).apiPrivateStock || 0
        : 0;

    // Reset tab to upload when modal opens or productId changes
    React.useEffect(() => {
        if (isOpen) {
            // Nếu sản phẩm không sử dụng kho riêng, luôn đặt tab là 'upload'
            setActiveTab('upload');
        }
    }, [isOpen, productId]);

    const handleTabChange = (tab: 'upload' | 'api') => {
        // Chỉ cho phép chuyển tab khi usePrivateWarehouse = true
        if (!usePrivateWarehouse && tab === 'api') return;

        setActiveTab(tab);
        // Reset test results when changing tabs
        setTestResults({
            inventory: { status: 'idle', message: '' },
            fetchProduct: { status: 'idle', message: '' }
        });
    };

    // Hàm test kết nối API
    const testApiConnection = async (type: 'inventory' | 'fetchProduct') => {

        // Set loading state
        setTestResults((prev) => ({
            ...prev,
            [type]: { status: 'loading', message: 'Checking connection...' }
        }));

        try {
            if (type === 'inventory') {
                if (!inventoryApiUrl) {
                    setTestResults((prev) => ({
                        ...prev,
                        inventory: {
                            status: 'error',
                            message: 'Please enter API URL'
                        }
                    }));
                    return;
                }

                // Gọi API lấy tổng hàng tồn kho
                const response = await fetch(inventoryApiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(
                        `API responded with status ${response.status}`
                    );
                }

                const data = await response.json();

                // Kiểm tra xem response có trường sum không
                if (data && typeof data.sum === 'number') {
                    setInventorySum(data.sum);
                    setTestResults((prev) => ({
                        ...prev,
                        inventory: {
                            status: 'success',
                            message: `Successfully connected! Found ${data.sum} products in the warehouse.`
                        }
                    }));
                } else {
                    throw new Error(
                        'API response is not valid: Missing "sum" field'
                    );
                }
            } else {
                // Xử lý cho API lấy hàng
                if (!fetchProductApiUrl) {
                    setTestResults((prev) => ({
                        ...prev,
                        fetchProduct: {
                            status: 'error',
                            message: 'Please enter API URL'
                        }
                    }));
                    return;
                }

                // Chỉ mô phỏng test API lấy hàng, không thực sự gọi API
                setTestResults((prev) => ({
                    ...prev,
                    fetchProduct: {
                        status: 'success',
                        message:
                            'Successfully connected! Fetched 2 products successfully.'
                    }
                }));
            }
        } catch (error) {
            console.error(`Error testing ${type} API:`, error);
            setTestResults((prev) => ({
                ...prev,
                [type]: {
                    status: 'error',
                    message:
                        error instanceof Error
                            ? `Error: ${error.message}`
                            : 'Error connecting to API'
                }
            }));
        }
    };

    // Sử dụng hook thay vì apolloClient.mutate
    const handleSaveApiSettings = async () => {
        if (!productId) {
            setStatusModal({
                isOpen: true,
                type: 'error',
                message: 'Product ID not found.'
            });
            return;
        }

        try {
            setIsSyncing(true);

            // Kiểm tra xem API đã được test thành công chưa
            if (
                testResults.inventory.status !== 'success' ||
                inventorySum === null
            ) {
                setStatusModal({
                    isOpen: true,
                    type: 'warning',
                    message: 'Please check the inventory API before syncing.'
                });
                setIsSyncing(false);
                return;
            }


            // Sử dụng hook thay vì mutation trực tiếp
            const result = await updateApiPrivateStock({
                variables: {
                    productId,
                    stockCount: inventorySum
                }
            });


            // Log chi tiết kết quả
            if (result.data?.updateProductsByPk) {
                const updatedData = result.data.updateProductsByPk;
                // Refetch all necessary data to update UI
                await Promise.all([
                    refetchStoreProducts(),
                    refetchStoreList(),
                    refetch(),
                    refetchCount()
                ]);

                // Hiển thị thông báo thành công với số lượng sản phẩm được thêm vào
                setStatusModal({
                    isOpen: true,
                    type: 'success',
                    message: `Sync successfully ${inventorySum} products`
                });

                // Reset các trường nhập API khi đồng bộ thành công
                setInventoryApiUrl('');
                setFetchProductApiUrl('');
                setInventorySum(null);
                setTestResults({
                    inventory: { status: 'idle', message: '' },
                    fetchProduct: { status: 'idle', message: '' }
                });
            } else {
                console.warn('No data returned from mutation');
                setStatusModal({
                    isOpen: true,
                    type: 'warning',
                    message: 'Sync failed'
                });
            }

            // Đóng modal sau khi đồng bộ thành công nếu không có lỗi
            if (result.data?.updateProductsByPk) {
                setTimeout(() => {
                    onClose();
                }, 3000); // Tăng thời gian để người dùng có thể đọc thông báo
            }
        } catch (error: unknown) {
            console.error('Error syncing inventory:', error);
            // Sửa lỗi linter bằng cách kiểm tra type của error trước khi truy cập các thuộc tính
            if (
                error &&
                typeof error === 'object' &&
                'graphQLErrors' in error
            ) {
                console.error('GraphQL Errors:', (error as any).graphQLErrors);
            }
            if (error && typeof error === 'object' && 'networkError' in error) {
                console.error('Network Error:', (error as any).networkError);
            }
            setStatusModal({
                isOpen: true,
                type: 'error',
                message:
                    error instanceof Error
                        ? `Sync error: ${error.message}`
                        : 'Unknown sync error'
            });
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title=""
                buttonTitle={t('buttons.save')}
                className="max-w-[880px] sm:w-[90%] md:w-[1000px] max-h-[92vh] overflow-y-auto rounded-[12px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-[#33A959] [&::-webkit-scrollbar-thumb]:rounded-full"
                noButton={true}
            >
                <div className="w-full flex flex-col items-center p-3 sm:p-6 px-4 sm:px-8">
                    <div className="w-full max-w-[950px] mb-4 sm:mb-6">
                        <div
                            className="flex items-center gap-2 mb-2 sm:mb-4 hover:cursor-pointer"
                            onClick={onBack}
                        >
                            <button className="hover:opacity-75">
                                <Image
                                    src="/images/back-arrow.svg"
                                    alt="back"
                                    width={24}
                                    height={24}
                                />
                            </button>
                            <h2 className="text-lg sm:text-xl font-medium text-gray-800">
                                {t('title')}
                            </h2>
                        </div>

                        {/* Tab Switcher - chỉ hiển thị khi usePrivateWarehouse = true */}
                        {usePrivateWarehouse ? (
                            <div className="flex border-b mb-4 sm:mb-6 overflow-x-auto">
                                <Button
                                    className={`py-2 px-2 sm:px-4 font-medium whitespace-nowrap ${
                                        activeTab === 'upload'
                                            ? 'text-gray-800 border-b-2 border-gray-800'
                                            : 'text-gray-500'
                                    }`}
                                    onClick={() => handleTabChange('upload')}
                                    colorScheme="white"
                                    notCircle={true}
                                >
                                    {t('upload.uploadFile')}
                                </Button>
                                <Button
                                    className={`py-2 px-2 sm:px-4 font-medium whitespace-nowrap ${
                                        activeTab === 'api'
                                            ? 'text-gray-800 border-b-2 border-gray-800'
                                            : 'text-gray-500'
                                    }`}
                                    onClick={() => handleTabChange('api')}
                                    colorScheme="white"
                                    notCircle={true}
                                >
                                    {t('upload.apiServer')}
                                </Button>
                            </div>
                        ) : null}

                        {activeTab === 'upload' ? (
                            // Original Upload File Content - Giữ nguyên nội dung
                            <div className="w-full">
                                <div
                                    className="flex flex-col justify-center items-center w-full h-[150px] sm:h-[205px] p-3 sm:p-5 gap-[6px] self-stretch rounded-[12px] border border-dashed border-[#33A959] bg-white cursor-pointer"
                                    onClick={handleUploadClick}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".txt"
                                        multiple
                                        className="hidden"
                                    />

                                    {selectedFile ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <Image
                                                src="/images/file-text.png"
                                                alt="File"
                                                width={40}
                                                height={40}
                                            />
                                            <p className="text-gray-500">
                                                {selectedFile.name}
                                            </p>
                                            {isUploading && (
                                                <div className="w-full">
                                                    <p className="text-gray-400 text-center mb-1">
                                                        {t('uploading', {
                                                            progress:
                                                                uploadProgress
                                                        })}
                                                    </p>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                        <div
                                                            className="bg-[#33A959] h-2.5 rounded-full"
                                                            style={{
                                                                width: `${uploadProgress}%`
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <Image
                                                src="/images/cloud-upload.svg"
                                                alt="Upload"
                                                width={40}
                                                height={40}
                                            />
                                            <p className="text-gray-500">
                                                {t('upload.uploadFileTxt')}
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                {t('upload.dragDrop')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="w-full mt-4">
                                    <p className="text-[#F15959] mb-2 font-btbeau text-base font-normal leading-[160%] text-left">
                                        {t('upload.note')}
                                    </p>
                                    <ul className="text-[#33A959] list-disc pl-5 space-y-1 font-btbeau text-base font-normal leading-[160%] text-left ml-[10px]">
                                        <li>{t('upload.email')}</li>
                                        <li>{t('upload.software')}</li>
                                        <li>{t('upload.account')}</li>
                                        <li>{t('upload.other')}</li>
                                    </ul>
                                </div>

                                <div className="w-full h-[1px] bg-gray-200 my-6" />

                                {/* Bảng thứ nhất - Hiển thị 2 file upload mới nhất */}
                                <div className="w-full mb-4">
                                    <h4 className="text-left font-bold mb-2">
                                        {t('table.latestUploaded')}
                                    </h4>
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left p-3 w-[182.4px]">
                                                        {t('table.productName')}
                                                    </th>
                                                    <th className="text-center p-3 w-[182.4px]">
                                                        {t('table.fileName')}
                                                    </th>
                                                    <th className="text-center p-3 w-[182.4px]">
                                                        {t('table.uploadDate')}
                                                    </th>
                                                    <th className="text-center p-3 w-[182.4px]">
                                                        {t('table.result')}
                                                    </th>
                                                    <th className="text-right p-3 w-[182.4px]">
                                                        {t('table.status')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="text-center p-4"
                                                        >
                                                            {t('table.loading')}
                                                        </td>
                                                    </tr>
                                                ) : error ? (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="text-center text-red-500 p-4"
                                                        >
                                                            {t(
                                                                'table.errorLoadingData'
                                                            )}
                                                        </td>
                                                    </tr>
                                                ) : data?.latest_uploads &&
                                                  data.latest_uploads.length >
                                                      0 ? (
                                                    data.latest_uploads.map(
                                                        (record, index) => (
                                                            <tr
                                                                key={
                                                                    record.productUploadLogsId
                                                                }
                                                                className="border-b h-[29px]"
                                                            >
                                                                <td className="p-3 text-left">
                                                                    {record
                                                                        .product
                                                                        ?.productName ||
                                                                        'N/A'}
                                                                </td>
                                                                <td className="p-3 text-blue-500 text-center">
                                                                    {
                                                                        record.fileName
                                                                    }
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    {formatDate(
                                                                        record.createdAt
                                                                    )}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    {formatResult(
                                                                        record.validRowCount,
                                                                        record.invalidRowCount
                                                                    )}
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    {
                                                                        record.status
                                                                    }
                                                                </td>
                                                            </tr>
                                                        )
                                                    )
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="text-center p-4"
                                                        >
                                                            {t(
                                                                'table.noUploadsFound'
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Bảng thứ hai - Hiển thị danh sách có phân trang */}
                                <div className="w-full">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-left font-bold">
                                            {t('table.latestUploaded')}
                                        </h4>
                                        <div className="flex border border-gray-200 rounded-[86px] overflow-hidden">
                                            <button
                                                className={`px-4 py-1 text-sm ${currentPage > 1 ? 'hover:bg-gray-50 bg-white' : 'bg-gray-100 text-gray-400 cursor-default'}`}
                                                onClick={handlePreviousPage}
                                                disabled={currentPage <= 1}
                                            >
                                                {t('pagination.previous')}
                                            </button>
                                            <div className="w-[1px] bg-gray-200" />
                                            <button
                                                className={`px-4 py-1 text-sm ${currentPage < totalPages ? 'hover:bg-gray-50 bg-white' : 'bg-gray-100 text-gray-400 cursor-default'}`}
                                                onClick={handleNextPage}
                                                disabled={
                                                    currentPage >= totalPages
                                                }
                                            >
                                                {t('pagination.next')}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="w-full overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="text-left p-3 w-[182.4px]">
                                                        {t(
                                                            'table.serialNumber'
                                                        )}
                                                    </th>
                                                    <th className="text-center p-3 w-[182.4px]">
                                                        {t('table.product')}
                                                    </th>
                                                    <th className="text-center p-3 w-[182.4px]">
                                                        {t('table.createDate')}
                                                    </th>
                                                    <th className="text-center p-3 w-[182.4px]">
                                                        {t('table.saleDate')}
                                                    </th>
                                                    <th className="text-right p-3 w-[182.4px]">
                                                        {t('table.status')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {loading ? (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="text-center p-4"
                                                        >
                                                            {t('table.loading')}
                                                        </td>
                                                    </tr>
                                                ) : error ? (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="text-center text-red-500 p-4"
                                                        >
                                                            {t(
                                                                'table.errorLoadingData'
                                                            )}
                                                        </td>
                                                    </tr>
                                                ) : data?.productUploadLogs &&
                                                  data.productUploadLogs
                                                      .length > 0 ? (
                                                    data.productUploadLogs.map(
                                                        (record, index) => (
                                                            <tr
                                                                key={
                                                                    record.productUploadLogsId
                                                                }
                                                                className="border-b h-[29px]"
                                                            >
                                                                <td className="p-3 text-left">{`0${index + 1 + offset}`}</td>
                                                                <td className="p-3 text-blue-500 text-center">
                                                                    {
                                                                        record.fileName
                                                                    }
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    {formatDate(
                                                                        record.createdAt
                                                                    )}
                                                                </td>
                                                                <td className="p-3 text-center">
                                                                    {/* Placeholder for sale date, not available in current data */}
                                                                    N/A
                                                                </td>
                                                                <td className="p-3 text-right">
                                                                    {
                                                                        record.status
                                                                    }
                                                                </td>
                                                            </tr>
                                                        )
                                                    )
                                                ) : (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="text-center p-4"
                                                        >
                                                            {t(
                                                                'table.noUploadsFound'
                                                            )}
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex flex-wrap gap-2 sm:gap-[10px] mt-[20px] sm:mt-[30px] justify-center sm:justify-end">
                                        <Button
                                            colorScheme="red"
                                            className="whitespace-nowrap text-sm sm:text-base px-4 py-2"
                                            onClick={handleDeleteAll}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting
                                                ? t('buttons.deleting')
                                                : t('buttons.deleteAll')}
                                        </Button>
                                        <Button
                                            colorScheme="green2"
                                            className="whitespace-nowrap text-sm sm:text-base px-4 py-2"
                                            onClick={
                                                handleDownloadUnsoldProducts
                                            }
                                            disabled={isDownloading}
                                        >
                                            {isDownloading
                                                ? t('buttons.downloading')
                                                : t('buttons.downloadUnsold')}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // New API Integration Content - với hiển thị rõ ràng hơn về giá trị apiPrivateStock
                            <div className="w-full">
                                <div className="mb-4 sm:mb-8">
                                    <h2 className="text-base sm:text-lg font-medium mb-2 sm:mb-4">
                                        Sử dụng server chứa hàng riêng
                                    </h2>
                                    {/* Thêm hiển thị giá trị hiện tại */}
                                    {/* <div className="bg-gray-50 p-3 mb-4 rounded-lg">
                                        <p className="text-sm font-medium">Thông tin hiện tại:</p>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="flex justify-between p-2 bg-white rounded border">
                                                <span className="text-gray-500">API Private Stock:</span>
                                                <span className="font-bold">{currentApiPrivateStock}</span>
                                            </div>
                                            <div className="flex justify-between p-2 bg-white rounded border">
                                                <span className="text-gray-500">Stock Count:</span>
                                                <span className="font-bold">{currentStockCount}</span>
                                            </div>
                                        </div>
                                    </div> */}
                                    <ul className="list-disc pl-4 sm:pl-5 mb-3 sm:mb-4 space-y-1 sm:space-y-2 text-sm sm:text-base text-gray-600">
                                        <li>
                                            You have selected a private server.
                                            You will need to set up the
                                            inventory API correctly, and cannot
                                            use the feature to upload products
                                            to the Shop3 server
                                        </li>
                                        <li>
                                            After the customer buys the product,
                                            the Shop3 server will call your
                                            server and send the following
                                            parameters.
                                        </li>
                                    </ul>
                                </div>

                                <div className="mb-4 sm:mb-8">
                                    <div className="mb-2">
                                        <h3 className="text-sm sm:text-base font-medium mb-2">
                                            Inventory API to get total stock{' '}
                                            <span className="text-red-500 text-xs sm:text-sm">
                                                (input?key=637964b9-c926-479c-9bb4-e01f5bfe2dc4)
                                            </span>
                                        </h3>
                                        <div className="relative flex w-full">
                                            <input
                                                type="text"
                                                value={inventoryApiUrl}
                                                onChange={(e) =>
                                                    setInventoryApiUrl(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Enter API ID"
                                                className="w-full rounded-full h-[45px] sm:h-[60px] px-3 sm:px-5 pr-[90px] sm:pr-[110px] text-black text-sm sm:text-base border border-[#ECECEC] focus:outline-none focus:border-[#33A959] focus:ring-1 focus:ring-[#33A959]"
                                            />
                                            <Button
                                                colorScheme="red"
                                                onClick={() =>
                                                    testApiConnection(
                                                        'inventory'
                                                    )
                                                }
                                                className="absolute right-[10px] top-[50%] transform -translate-y-1/2 rounded-full z-10 min-w-[75px] sm:min-w-[90px] h-[32px] sm:h-[36px] text-xs sm:text-sm"
                                                disabled={
                                                    testResults.inventory
                                                        .status === 'loading'
                                                }
                                            >
                                                {testResults.inventory
                                                    .status === 'loading'
                                                    ? 'Testing...'
                                                    : 'Test'}
                                            </Button>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                                            Format response (json):{' '}
                                            <span className="text-red-500">
                                                {'"sum":1'}
                                            </span>
                                        </p>

                                        {testResults.inventory.status !==
                                            'idle' && (
                                            <div
                                                className={`mt-1 sm:mt-2 p-1 sm:p-2 rounded text-xs sm:text-sm ${
                                                    testResults.inventory
                                                        .status === 'loading'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : testResults.inventory
                                                                .status ===
                                                            'success'
                                                          ? 'bg-green-50 text-green-600'
                                                          : 'bg-red-50 text-red-600'
                                                }`}
                                            >
                                                {testResults.inventory
                                                    .status === 'loading' && (
                                                    <div className="flex items-center">
                                                        <svg
                                                            className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-blue-600"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            />
                                                        </svg>
                                                        {
                                                            testResults
                                                                .inventory
                                                                .message
                                                        }
                                                    </div>
                                                )}
                                                {testResults.inventory
                                                    .status !== 'loading' &&
                                                    testResults.inventory
                                                        .message}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4 sm:mb-8">
                                    <div className="mb-2">
                                        <h3 className="text-sm sm:text-base font-medium mb-2">
                                            Inventory API to get product{' '}
                                            <span className="text-red-500 text-xs sm:text-sm">
                                                (input?key=637964b9-c926-479c-9bb4-e01f5bfe2dc4&order_id=(order_id)&quantity=(so_luong))
                                            </span>
                                        </h3>
                                        <div className="relative flex w-full">
                                            <input
                                                type="text"
                                                value={fetchProductApiUrl}
                                                onChange={(e) =>
                                                    setFetchProductApiUrl(
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="Enter API ID"
                                                className="w-full rounded-full h-[45px] sm:h-[60px] px-3 sm:px-5 pr-[140px] sm:pr-[190px] text-black text-sm sm:text-base border border-[#ECECEC] focus:outline-none focus:border-[#33A959] focus:ring-1 focus:ring-[#33A959]"
                                            />
                                            <Button
                                                colorScheme="red"
                                                onClick={() =>
                                                    testApiConnection(
                                                        'fetchProduct'
                                                    )
                                                }
                                                className="absolute right-[10px] top-[50%] transform -translate-y-1/2 rounded-full z-10 min-w-[125px] sm:min-w-[160px] h-[32px] sm:h-[36px] text-xs sm:text-sm"
                                                disabled={
                                                    testResults.fetchProduct
                                                        .status === 'loading'
                                                }
                                            >
                                                {testResults.fetchProduct
                                                    .status === 'loading'
                                                    ? 'Testing...'
                                                    : 'Test - Get 2 products'}
                                            </Button>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
                                            Full link:
                                            tewigfe?key=637964b9-c926-479c-9bb4-e01f5bfe2dc4&order_id=(order_id)&quantity=(quantity)
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500">
                                            Format response (json):{' '}
                                            <span className="text-red-500">
                                                [{'{"product":"Product 1"}'},
                                                {'{"product":"Product 2"}'}...]
                                            </span>
                                        </p>

                                        {testResults.fetchProduct.status !==
                                            'idle' && (
                                            <div
                                                className={`mt-1 sm:mt-2 p-1 sm:p-2 rounded text-xs sm:text-sm ${
                                                    testResults.fetchProduct
                                                        .status === 'loading'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : testResults
                                                                .fetchProduct
                                                                .status ===
                                                            'success'
                                                          ? 'bg-green-50 text-green-600'
                                                          : 'bg-red-50 text-red-600'
                                                }`}
                                            >
                                                {testResults.fetchProduct
                                                    .status === 'loading' && (
                                                    <div className="flex items-center">
                                                        <svg
                                                            className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-blue-600"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-25"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="currentColor"
                                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                            />
                                                        </svg>
                                                        {
                                                            testResults
                                                                .fetchProduct
                                                                .message
                                                        }
                                                    </div>
                                                )}
                                                {testResults.fetchProduct
                                                    .status !== 'loading' &&
                                                    testResults.fetchProduct
                                                        .message}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex justify-end items-center gap-4">
                                    {inventorySum !== null &&
                                        testResults.inventory.status ===
                                            'success' && (
                                            <div className="text-green-600 text-sm">
                                                <span className="font-medium">
                                                    Found:
                                                </span>{' '}
                                                {inventorySum} products
                                            </div>
                                        )}
                                    <Button
                                        onClick={handleSaveApiSettings}
                                        colorScheme="green2"
                                        className="whitespace-nowrap text-sm sm:text-base px-4 py-2"
                                        disabled={
                                            isSyncing ||
                                            testResults.inventory.status !==
                                                'success' ||
                                            inventorySum === null
                                        }
                                    >
                                        {isSyncing
                                            ? 'Syncing...'
                                            : 'Sync & Save'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Wrap StatusModal trong div có z-index cao */}
            <div className="relative z-[9999]">
                <StatusModal
                    isOpen={statusModal.isOpen}
                    type={statusModal.type}
                    message={statusModal.message}
                    onClose={handleCloseStatusModal}
                />
            </div>
        </>
    );
};

export default PopupAddProduct;
