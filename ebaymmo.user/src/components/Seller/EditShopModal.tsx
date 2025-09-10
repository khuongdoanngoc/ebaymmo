import Input from '@/components/BaseUI/Input';
import Select from '@/components/BaseUI/Select/select';
import Button from '@/components/BaseUI/Button/button';
import Checkbox from '@/components/BaseUI/Checkbox';
import CloudUpload from '@images/seller/cloud-upload.2.svg';
import Image from 'next/image';
import Editor from '@/components/BaseUI/Editor';
import { useState, useMemo, useRef, useEffect } from 'react';
import InputWrapper from '@/components/BaseUI/InputWrapper';
import {
    useGetCategoriesQuery,
    useUpdateStoreMutation,
    useGetDiscountedProductTypesQuery
} from '@/generated/graphql';
import { useSession } from 'next-auth/react';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { BasicStoreFragmentFragment } from '@/generated/graphql-request';

interface EditShopModalProps {
    storeData: BasicStoreFragmentFragment;
    storeId: string;
    onSubmit: () => void;
    onSuccess?: () => void;
}

// Constants for validation
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_DIMENSIONS = {
    maxWidth: 1920,
    maxHeight: 1080,
    minWidth: 100,
    minHeight: 100
};

const SHOP_NAME_MAX_LENGTH = 50;
const SHORT_DESC_MAX_LENGTH = 200;
const SHORT_DESC_MIN_LENGTH = 10;

export default function EditShopModal({
    storeData,
    storeId,
    onSubmit,
    onSuccess
}: EditShopModalProps) {
    const { showModal } = useStatusModal();
    const [description, setDescription] = useState(storeData.description || '');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        storeData.category?.categoryId || null
    );
    const [selectedBusinessType, setSelectedBusinessType] = useState<
        string | null
    >(storeData.category?.type?.toLowerCase() || null);
    const [selectedDiscountType, setSelectedDiscountType] = useState<
        string | null
    >(null);
    const [previewImage, setPreviewImage] = useState<string | null>(
        storeData.avatar || null
    );
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [storeName, setStoreName] = useState(storeData.storeName || '');
    const [shortDesc, setShortDesc] = useState(
        storeData.shortDescription || ''
    );
    const [refundRating, setRefundRating] = useState(
        storeData.refundRating ? storeData.refundRating.toString() : ''
    );
    const [isDuplicate, setIsDuplicate] = useState(
        storeData.duplicateProduct || false
    );
    const [isPrivate, setIsPrivate] = useState(
        storeData.privateWarehouse || false
    );
    const [allowResell, setAllowResell] = useState(
        storeData.allowReseller || false
    );
    const [allowPreOrder, setAllowPreOrder] = useState(
        storeData.allowPreOrder || false
    );
    const [selectedTag, setSelectedTag] = useState<string | null>(
        storeData.storeTag || null
    );

    const { data: session } = useSession();
    const [updateStore] = useUpdateStoreMutation();
    const { uploadAvatar } = useUploadAvatar();

    // Query for shop types (parent categories)
    const { data: categoriesData } = useGetCategoriesQuery({
        variables: {
            where: {
                _and: [
                    { parentCategoryId: { _isNull: true } },
                    { type: { _eq: selectedBusinessType } }
                ]
            },
            limit: 100,
            offset: 0
        },
        skip: !selectedBusinessType
    });

    // Query for tags (sub categories)
    const { data: subCategoriesData } = useGetCategoriesQuery({
        variables: {
            where: {
                parentCategoryId: { _eq: selectedCategory }
            },
            limit: 100,
            offset: 0
        },
        fetchPolicy: 'cache-first',
        skip: !selectedCategory
    });

    // Query for discounted product types
    const { data: discountedTypesData } = useGetDiscountedProductTypesQuery({
        variables: {
            where: {
                categoryId: { _eq: selectedCategory }
            },
            limit: 100,
            offset: 0
        },
        skip: !selectedCategory
    });

    // Transform data to options for discounted types
    const discountedTypeOptions = useMemo(() => {
        const defaultOption = [
            { label: 'Select discounted product type', value: '' }
        ];

        if (!selectedCategory || !discountedTypesData?.discountedProductType) {
            return defaultOption;
        }

        return [
            ...defaultOption,
            ...discountedTypesData.discountedProductType.map((type) => ({
                label: `${type.typeName} (${type.discountPercentage}%)`,
                value: type.discountedProductTypeId
            }))
        ];
    }, [discountedTypesData, selectedCategory]);

    // Options for tags
    const tagOptions = useMemo(() => {
        if (!selectedCategory || !subCategoriesData?.categories?.length) {
            return [{ label: 'Select tag', value: '' }];
        }

        return [
            { label: 'Select tag', value: '' },
            ...subCategoriesData.categories.map((category) => ({
                label: category.categoryName || 'Unnamed Tag',
                value: category.categoryId?.toString() || ''
            }))
        ];
    }, [subCategoriesData, selectedCategory]);

    // Shop type options
    const shopTypeOptions = useMemo(() => {
        if (!categoriesData?.categories)
            return [{ label: 'Select shop type', value: '' }];

        return [
            { label: 'Select shop type', value: '' },
            ...categoriesData.categories.map((category) => ({
                label: category.categoryName || '',
                value: category.categoryId?.toString() || ''
            }))
        ];
    }, [categoriesData]);

    const businessTypeOptions = [
        { label: 'Select business type', value: '' },
        { label: 'Product', value: 'product' },
        { label: 'Service', value: 'service' }
    ];

    // Validate image dimensions
    const validateImageDimensions = (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);

            img.onload = () => {
                URL.revokeObjectURL(img.src);
                const valid =
                    img.width >= ALLOWED_DIMENSIONS.minWidth &&
                    img.width <= ALLOWED_DIMENSIONS.maxWidth &&
                    img.height >= ALLOWED_DIMENSIONS.minHeight &&
                    img.height <= ALLOWED_DIMENSIONS.maxHeight;
                resolve(valid);
            };
        });
    };

    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Check file format
        if (!file.type.startsWith('image/')) {
            showModal('error', 'Please upload an image file');
            return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            showModal('error', 'File size must be less than 5MB');
            return;
        }

        // Check image dimensions
        const isValidDimensions = await validateImageDimensions(file);
        if (!isValidDimensions) {
            showModal(
                'error',
                `Image dimensions must be between ${ALLOWED_DIMENSIONS.minWidth}x${ALLOWED_DIMENSIONS.minHeight} and ${ALLOWED_DIMENSIONS.maxWidth}x${ALLOWED_DIMENSIONS.maxHeight} pixels`
            );
            return;
        }

        // If it passes all validations, set preview
        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
        setSelectedFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        // Check file format
        if (!file.type.startsWith('image/')) {
            showModal('error', 'Please upload an image file');
            return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            showModal('error', 'File size must be less than 5MB');
            return;
        }

        // Check image dimensions
        const isValidDimensions = await validateImageDimensions(file);
        if (!isValidDimensions) {
            showModal(
                'error',
                `Image dimensions must be between ${ALLOWED_DIMENSIONS.minWidth}x${ALLOWED_DIMENSIONS.minHeight} and ${ALLOWED_DIMENSIONS.maxWidth}x${ALLOWED_DIMENSIONS.maxHeight} pixels`
            );
            return;
        }

        // If it passes all validations, set preview
        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
        setSelectedFile(file);
    };

    // Track if user has attempted to submit
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

    // Validation states
    const [shopNameError, setShopNameError] = useState('');
    const [shortDescError, setShortDescError] = useState('');

    // Validate shop name
    const handleShopNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setStoreName(value);

        if (value.length > SHOP_NAME_MAX_LENGTH) {
            setShopNameError(
                `Shop name must be less than ${SHOP_NAME_MAX_LENGTH} characters`
            );
        } else {
            setShopNameError('');
        }
    };

    // Validate short description
    const handleShortDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setShortDesc(value);

        if (value.length < SHORT_DESC_MIN_LENGTH) {
            setShortDescError(
                `Short description must be at least ${SHORT_DESC_MIN_LENGTH} characters`
            );
        } else if (value.length > SHORT_DESC_MAX_LENGTH) {
            setShortDescError(
                `Short description must be less than ${SHORT_DESC_MAX_LENGTH} characters`
            );
        } else {
            setShortDescError('');
        }
    };

    const handleUpdateStore = async () => {
        // Mark as attempted submit to show all errors
        setHasAttemptedSubmit(true);

        // Validate required fields
        if (shopNameError || shortDescError) {
            return;
        }

        if (!storeName) {
            return;
        }

        if (!shortDesc) {
            return;
        }

        if (!selectedCategory) {
            return;
        }

        if (!selectedBusinessType) {
            return;
        }

        if (!session?.user?.id) {
            return;
        }

        try {
            let avatarUrl = storeData.avatar || '';

            // Upload image if a new file was selected
            if (selectedFile) {
                avatarUrl = await uploadAvatar(selectedFile, session.user.id);
            }

            const response = await updateStore({
                variables: {
                    storeId: storeId,
                    input: {
                        storeName: storeName,
                        description: description,
                        categoryId: selectedCategory,
                        shortDescription: shortDesc,
                        refundRating: parseFloat(refundRating),
                        duplicateProduct: isDuplicate,
                        privateWarehouse: isPrivate,
                        allowReseller: allowResell,
                        allowPreOrder: allowPreOrder,
                        avatar: avatarUrl,
                        storeTag: selectedTag
                    }
                }
            });

            if (response.data?.updateStoresByPk) {
                showModal('success', 'Shop updated successfully');
                onSubmit();
                onSuccess?.();
            }
        } catch (error) {
            console.error('Failed to update store:', error);
            showModal('error', 'Failed to update shop');
        }
    };

    // Clean up preview URL when component unmounts
    useEffect(() => {
        return () => {
            if (previewImage && previewImage !== storeData.avatar) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage, storeData.avatar]);

    return (
        <div className="flex flex-col">
            <h2 className="text-2xl font-bold mb-6">Edit Shop</h2>
            <div
                className="overflow-y-auto pr-6 custom-thin-scrollbar scrollbar scrollbar-thumb-red scrollbar-track-transparent"
                style={{ maxHeight: 'calc(700px - 100px)' }}
            >
                <div>
                    <div className="w-[450px]">
                        <Input
                            label="Shop Name"
                            placeholder="Enter your shop name"
                            value={storeName}
                            onChange={handleShopNameChange}
                        />
                        {shopNameError && (
                            <span className="text-red-500 text-sm mt-1">
                                {shopNameError}
                            </span>
                        )}
                        {hasAttemptedSubmit && !storeName && !shopNameError && (
                            <span className="text-red-500 text-sm mt-1">
                                Shop name is required
                            </span>
                        )}
                    </div>

                    <div className="mt-[40px] w-[450px]">
                        <Select
                            label="Business Type"
                            options={businessTypeOptions}
                            placeholder="Select business type"
                            className="w-[450px]"
                            onChange={(e) =>
                                setSelectedBusinessType(e.target.value)
                            }
                            value={selectedBusinessType || ''}
                        />
                        {hasAttemptedSubmit && !selectedBusinessType && (
                            <span className="text-red-500 text-sm mt-1">
                                Business type is required
                            </span>
                        )}
                    </div>

                    <div className="mt-[40px] w-[450px]">
                        <Select
                            label="Shop Type"
                            options={shopTypeOptions}
                            placeholder="Select shop type"
                            className="w-[450px]"
                            onChange={(e) =>
                                setSelectedCategory(e.target.value)
                            }
                            value={selectedCategory || ''}
                        />
                        {hasAttemptedSubmit && !selectedCategory && (
                            <span className="text-red-500 text-sm mt-1">
                                Shop type is required
                            </span>
                        )}
                    </div>

                    <div className="mt-[40px] w-[450px]">
                        <Select
                            label="Discounted Product Type"
                            options={discountedTypeOptions}
                            placeholder="Select discounted product type"
                            className="w-[450px]"
                            onChange={(e) =>
                                setSelectedDiscountType(e.target.value)
                            }
                            value={selectedDiscountType || ''}
                        />
                    </div>

                    <div className="mt-[40px] ">
                        <Input
                            label="Refund Rating (%)"
                            placeholder="Add refund rating"
                            value={refundRating}
                            onChange={(e) => setRefundRating(e.target.value)}
                            type="number"
                        />
                        {hasAttemptedSubmit && !refundRating && (
                            <span className="text-red-500 text-sm mt-1">
                                Refund rating is required
                            </span>
                        )}
                    </div>

                    <div className="mt-[40px] ">
                        <Select
                            label="Tag"
                            options={tagOptions}
                            placeholder="Select tag"
                            className="w-[450px]"
                            value={selectedTag || ''}
                            onChange={(e) => setSelectedTag(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 my-[40px]">
                        <Checkbox
                            content="Duplicate Product"
                            checked={isDuplicate}
                            onChange={setIsDuplicate}
                        />
                        <Checkbox
                            content="Use private stock"
                            checked={isPrivate}
                            onChange={setIsPrivate}
                        />
                        <Checkbox
                            content="Allow resellers to sell"
                            checked={allowResell}
                            onChange={setAllowResell}
                        />
                        <Checkbox
                            content="Allow pre-order"
                            checked={allowPreOrder}
                            onChange={setAllowPreOrder}
                        />
                    </div>

                    <div className="mt-[40px]">
                        <Input
                            label="Short Description"
                            placeholder="Enter your description"
                            value={shortDesc}
                            onChange={handleShortDescChange}
                        />
                        {shortDescError && (
                            <span className="text-red-500 text-sm mt-1">
                                {shortDescError}
                            </span>
                        )}
                        {hasAttemptedSubmit &&
                            !shortDesc &&
                            !shortDescError && (
                                <span className="text-red-500 text-sm mt-1">
                                    Short description is required
                                </span>
                            )}
                    </div>

                    <div className="mt-[40px] ">
                        <InputWrapper label="Detailed Description">
                            <Editor
                                value={description}
                                onChange={(content: string) =>
                                    setDescription(content)
                                }
                            />
                        </InputWrapper>
                        {hasAttemptedSubmit && !description && (
                            <span className="text-red-500 text-sm mt-1">
                                Detailed description is required
                            </span>
                        )}
                    </div>

                    <div className="mb-[40px]" />

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Shop Avatar
                        </label>
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*"
                        />
                        <div
                            className="border-dashed rounded-lg p-8 text-center h-[200px] flex items-center justify-center cursor-pointer relative"
                            style={{ border: '0.5px dashed #33A959' }}
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            {previewImage ? (
                                <div className="relative w-full h-full">
                                    <Image
                                        src={previewImage}
                                        alt="Preview"
                                        fill
                                        className="object-contain"
                                        style={{
                                            maxWidth: '100%',
                                            maxHeight: '100%'
                                        }}
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewImage(null);
                                            setSelectedFile(null);
                                        }}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 z-10"
                                    >
                                        ×
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Image
                                        src={CloudUpload}
                                        alt="Cloud Upload"
                                        className="w-[48px] h-auto text-gray-400"
                                    />
                                    <span className="text-[#1C1C1C] text-center text-base font-normal leading-[25.6px] font-beausans">
                                        Click to upload avatar, or drag and drop
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bottom-0 left-0 right-0 bg-white mt-[25px]">
                <div className="py-[25px] px-0">
                    <Button
                        onClick={handleUpdateStore}
                        className="!w-full h-[48px] bg-[#36B555] hover:bg-[#2EA349] text-white text-[20px] font-medium"
                    >
                        Update Shop
                    </Button>
                </div>
            </div>
        </div>
    );
}
