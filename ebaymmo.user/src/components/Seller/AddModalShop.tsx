import Input from '@/components/BaseUI/Input';
import Select from '@/components/BaseUI/Select/select';
import Button from '@/components/BaseUI/Button/button';
import Checkbox from '@/components/BaseUI/Checkbox';
import CloudUpload from '@images/seller/cloud-upload.2.svg';
import Image from 'next/image';
import Editor from '@/components/BaseUI/Editor';
import { useState, useMemo, useRef, useEffect } from 'react';
import { useStatusModal } from '@/contexts/StatusModalContext';
import InputWrapper from '@/components/BaseUI/InputWrapper';
import {
    useGetCategoriesQuery,
    useCreateStoreMutation,
    useGetDiscountedProductTypesQuery,
    useGetStoreManagementListQuery,
    useInsertNotificationsMutation
} from '@/generated/graphql';
import { useSession } from 'next-auth/react';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { useTranslations } from 'next-intl';
import { notification } from 'antd';

interface AddModalShopProps {
    onSubmit: (data: any) => void;
    onSuccess?: () => void;
}
// Thêm constants cho giới hạn
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_DIMENSIONS = {
    maxWidth: 1920,
    maxHeight: 1080,
    minWidth: 100,
    minHeight: 100
};

// Thêm constants cho validation
const SHOP_NAME_MAX_LENGTH = 50;
const SHORT_DESC_MAX_LENGTH = 200;
const SHORT_DESC_MIN_LENGTH = 10;

// Add validation constants
const REFUND_RATING_MIN = 0;
const REFUND_RATING_MAX = 100;

// Add validation constant
const DESCRIPTION_MIN_LENGTH = 20;

export default function AddModalShop({
    onSubmit,
    onSuccess
}: AddModalShopProps) {
    const t = useTranslations('addModalShop');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        null
    );
    const [selectedBusinessType, setSelectedBusinessType] = useState<
        string | null
    >(null);
    const [selectedDiscountType, setSelectedDiscountType] = useState<
        string | null
    >(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [storeName, setStoreName] = useState('');
    const [shortDesc, setShortDesc] = useState('');
    const [refundRating, setRefundRating] = useState('');
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [isPrivate, setIsPrivate] = useState(false);
    const [allowResell, setAllowResell] = useState(false);
    const [allowPreOrder, setAllowPreOrder] = useState(false);

    const { data: session } = useSession();
    const [createStore] = useCreateStoreMutation();

    const [createNotification] = useInsertNotificationsMutation();
    const { uploadAvatar } = useUploadAvatar();

    const { showModal } = useStatusModal();

    // Query cho shop types (parent categories)
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
        fetchPolicy: 'cache-first',
        skip: !selectedBusinessType
    });
    //console.log('categoriesData', categoriesData);
    // Query cho tags (sub categories)
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
    //console.log('subCategoriesData', subCategoriesData);

    // Query cho discounted product types
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
    //console.log('discountedTypesData', discountedTypesData);

    // Transform data thành options cho discounted types
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

    // Options cho tags
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

    // Thêm options mặc định
    const defaultShopTypeOptions = [{ label: 'Select shop type', value: '' }];

    // Sửa lại useMemo
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

    // Hàm kiểm tra kích thước ảnh
    const validateImageDimensions = (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            const img = document.createElement('img'); // Thay đổi cách tạo Image
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

        // Kiểm tra định dạng file
        if (!file.type.startsWith('image/')) {
            showModal('error', t('pleaseUploadImageFile'));
            return;
        }

        // Kiểm tra dung lượng file
        if (file.size > MAX_FILE_SIZE) {
            showModal('error', t('fileSizeLessThan5MB'));
            return;
        }

        // Kiểm tra kích thước ảnh
        const isValidDimensions = await validateImageDimensions(file);
        if (!isValidDimensions) {
            showModal(
                'error',
                t('imageDimensionsRequirement', {
                    minWidth: ALLOWED_DIMENSIONS.minWidth,
                    minHeight: ALLOWED_DIMENSIONS.minHeight,
                    maxWidth: ALLOWED_DIMENSIONS.maxWidth,
                    maxHeight: ALLOWED_DIMENSIONS.maxHeight
                })
            );
            return;
        }

        // Nếu pass hết validation thì mới set preview
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

        // Kiểm tra định dạng file
        if (!file.type.startsWith('image/')) {
            showModal('error', t('pleaseUploadImageFile'));
            return;
        }

        // Kiểm tra dung lượng file
        if (file.size > MAX_FILE_SIZE) {
            showModal('error', t('fileSizeLessThan5MB'));
            return;
        }

        // Kiểm tra kích thước ảnh
        const isValidDimensions = await validateImageDimensions(file);
        if (!isValidDimensions) {
            showModal(
                'error',
                t('imageDimensionsRequirement', {
                    minWidth: ALLOWED_DIMENSIONS.minWidth,
                    minHeight: ALLOWED_DIMENSIONS.minHeight,
                    maxWidth: ALLOWED_DIMENSIONS.maxWidth,
                    maxHeight: ALLOWED_DIMENSIONS.maxHeight
                })
            );
            return;
        }

        // Nếu pass hết validation thì mới set preview
        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
        setSelectedFile(file);
    };

    // Add form validation state
    const [formErrors, setFormErrors] = useState({
        storeName: '',
        businessType: '',
        shopType: '',
        refundRating: '',
        shortDesc: '',
        description: '',
        avatar: ''
    });

    // Validate all fields before submission
    const validateForm = (): boolean => {
        const errors = {
            storeName: '',
            businessType: '',
            shopType: '',
            refundRating: '',
            shortDesc: '',
            description: '',
            avatar: ''
        };

        // Validate store name
        if (!storeName) {
            errors.storeName = t('shopNameRequired');
        } else if (storeName.length > SHOP_NAME_MAX_LENGTH) {
            errors.storeName = t('shopNameLengthError', {
                maxLength: SHOP_NAME_MAX_LENGTH
            });
        }

        // Validate business type
        if (!selectedBusinessType) {
            errors.businessType = t('businessTypeRequired');
        }

        // Validate shop type
        if (!selectedCategory) {
            errors.shopType = t('shopTypeRequired');
        }
        if (!description) {
            errors.description = t('detailedDescriptionRequired');
        } else if (description.length < DESCRIPTION_MIN_LENGTH) {
            errors.description = t('detailedDescriptionMinLength', {
                minLength: DESCRIPTION_MIN_LENGTH
            });
        }

        // Validate refund rating
        const refundRatingNum = parseFloat(refundRating);
        if (!refundRating) {
            errors.refundRating = t('refundRatingRequired');
        } else if (
            isNaN(refundRatingNum) ||
            refundRatingNum < REFUND_RATING_MIN ||
            refundRatingNum > REFUND_RATING_MAX
        ) {
            errors.refundRating = t('refundRatingRange', {
                min: REFUND_RATING_MIN,
                max: REFUND_RATING_MAX
            });
        }

        // Validate short description
        if (!shortDesc) {
            errors.shortDesc = t('shortDescriptionRequired');
        } else if (shortDesc.length < SHORT_DESC_MIN_LENGTH) {
            errors.shortDesc = t('shortDescriptionMinLength', {
                minLength: SHORT_DESC_MIN_LENGTH
            });
        } else if (shortDesc.length > SHORT_DESC_MAX_LENGTH) {
            errors.shortDesc = t('shortDescriptionMaxLength', {
                maxLength: SHORT_DESC_MAX_LENGTH
            });
        }

        // Validate avatar
        if (!selectedFile) {
            errors.avatar = t('shopAvatarRequired');
        }

        setFormErrors(errors);

        // Return true if no errors (all values in errors object are empty strings)
        return Object.values(errors).every((error) => error === '');
    };

    // Add this query to get the seller's current stores
    const { data: storesData } = useGetStoreManagementListQuery({
        variables: {
            sellerId: session?.user?.id
        },
        skip: !session?.user?.id
    });

    const handleCreateStore = async () => {
        if (!validateForm()) {
            // Tạo danh sách các lỗi để hiển thị
            showModal('error', t('fillAllRequiredFields'));
            return;
        }

        if (!selectedCategory || !storeName || !session?.user?.id) {
            return;
        }

        // Check if the seller already has 5 stores
        if (storesData?.stores && storesData.stores.length >= 5) {
            showModal('error', t('maxStore'));
            return;
        }

        try {
            let avatarUrl = '';

            // Upload ảnh nếu có file được chọn
            if (selectedFile) {
                avatarUrl = await uploadAvatar(selectedFile, session.user.id);
            }

            const response = await createStore({
                variables: {
                    input: [
                        {
                            storeName: storeName,
                            description: description,
                            categoryId: selectedCategory,
                            shortDescription: shortDesc,
                            refundRating: parseFloat(refundRating),
                            duplicateProduct: isDuplicate,
                            privateWarehouse: isPrivate,
                            allowReseller: allowResell,
                            allowPreOrder: allowPreOrder,
                            sellerId: session.user.id,
                            status: 'pending',
                            avatar: avatarUrl // Sử dụng URL sau khi upload
                        }
                    ]
                }
            });

            const responseNotification = await createNotification({
                variables: {
                    objects: [
                        {
                            notificationType: 'Store Request',
                            sentDate: new Date().toISOString(),
                            userId: session.user.id,
                            content: `${session.user.name} has requested to create store ${storeName}`,
                            isRead: false,
                            createAt: new Date().toISOString()
                        }
                    ]
                }
            });

            if (response.data?.insertStores?.returning[0]) {
                onSubmit(response.data.insertStores.returning[0]);
                onSuccess?.();
            }
            showModal('success', t('addStoreSuccess'));
        } catch (error) {
            console.error('Failed to create store:', error);
        }
    };

    // Clean up preview URL when component unmounts
    useEffect(() => {
        return () => {
            if (previewImage) {
                URL.revokeObjectURL(previewImage);
            }
        };
    }, [previewImage]);

    // Thêm validation states
    const [shopNameError, setShopNameError] = useState('');
    const [shortDescError, setShortDescError] = useState('');

    // Validate shop name
    const handleShopNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setStoreName(value);

        if (value.length > SHOP_NAME_MAX_LENGTH) {
            setShopNameError(
                t('shopNameLengthError', { maxLength: SHOP_NAME_MAX_LENGTH })
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
                t('shortDescriptionMinLength', {
                    minLength: SHORT_DESC_MIN_LENGTH
                })
            );
        } else if (value.length > SHORT_DESC_MAX_LENGTH) {
            setShortDescError(
                t('shortDescriptionMaxLength', {
                    maxLength: SHORT_DESC_MAX_LENGTH
                })
            );
        } else {
            setShortDescError('');
        }
    };

    return (
        <div className="flex flex-col max-w-[90%] mx-auto mt-0">
            <div
                className="overflow-y-auto pr-6 custom-thin-scrollbar scrollbar scrollbar-thumb-red scrollbar-track-transparent"
                style={{ maxHeight: 'calc(700px - 100px)' }}
            >
                <div>
                    <div className="w-full]">
                        <Input
                            label={t('shopName')}
                            placeholder={t('enterShopName')}
                            value={storeName}
                            onChange={handleShopNameChange}
                            className="md:h-[48px] h-[40px]"
                        />
                        {formErrors.storeName && (
                            <span className="text-red-500 text-sm mt-1">
                                {formErrors.storeName}
                            </span>
                        )}
                    </div>

                    <div className="mt-[40px] w-full]">
                        <Select
                            label={t('businessType')}
                            options={businessTypeOptions}
                            placeholder={t('selectBusinessType')}
                            className="w-full md:h-[60px] h-[40px]"
                            onChange={(e) =>
                                setSelectedBusinessType(e.target.value)
                            }
                        />
                        {formErrors.businessType && (
                            <span className="text-red-500 text-sm mt-1">
                                {formErrors.businessType}
                            </span>
                        )}
                    </div>

                    <div className="mt-[40px] w-full]">
                        <Select
                            label={t('shopType')}
                            options={shopTypeOptions}
                            placeholder={t('selectShopType')}
                            className="w-[450px]"
                            onChange={(e) =>
                                setSelectedCategory(e.target.value)
                            }
                        />
                        {formErrors.shopType && (
                            <span className="text-red-500 text-sm mt-1">
                                {formErrors.shopType}
                            </span>
                        )}
                    </div>

                    <div className="mt-[40px] w-full]">
                        <Select
                            label={t('discountedProductType')}
                            options={discountedTypeOptions}
                            placeholder={t('selectDiscountedProductType')}
                            className="w-full"
                            onChange={(e) =>
                                setSelectedDiscountType(e.target.value)
                            }
                        />
                    </div>

                    <div className="mt-[40px] ">
                        <Input
                            label={t('refundRating')}
                            placeholder={t('addRefundRating')}
                            value={refundRating}
                            onChange={(e) => setRefundRating(e.target.value)}
                            type="number"
                        />
                        {formErrors.refundRating && (
                            <span className="text-red-500 text-sm mt-1">
                                {formErrors.refundRating}
                            </span>
                        )}
                    </div>

                    <div className="mt-[40px] ">
                        <Select
                            label={t('tag')}
                            options={tagOptions}
                            placeholder={t('selectTag')}
                            className="w-[450px]"
                        />
                    </div>

                    <div className="space-y-2 my-[40px]">
                        <Checkbox
                            content={t('duplicateProduct')}
                            checked={isDuplicate}
                            onChange={setIsDuplicate}
                        />
                        <Checkbox
                            content={t('usePrivateStock')}
                            checked={isPrivate}
                            onChange={setIsPrivate}
                        />
                        <Checkbox
                            content={t('allowResellers')}
                            checked={allowResell}
                            onChange={setAllowResell}
                        />
                        <Checkbox
                            content={t('allowPreOrder')}
                            checked={allowPreOrder}
                            onChange={setAllowPreOrder}
                        />
                    </div>

                    <div className="mt-[40px]">
                        <Input
                            label={t('shortDescription')}
                            placeholder={t('enterShortDescription')}
                            value={shortDesc}
                            onChange={handleShortDescChange}
                        />
                        {formErrors.shortDesc && (
                            <span className="text-red-500 text-sm mt-1">
                                {formErrors.shortDesc}
                            </span>
                        )}
                    </div>

                    <div className="mt-[40px] ">
                        <InputWrapper label={t('detailedDescription')}>
                            <Editor
                                value={description}
                                onChange={(content: string) =>
                                    setDescription(content)
                                }
                            />
                        </InputWrapper>
                        {formErrors.description && (
                            <span className="text-red-500 text-sm mt-1">
                                {formErrors.description}
                            </span>
                        )}
                    </div>

                    <div className="mb-[100px]" />

                    <input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                    />
                    <div
                        className="border-dashed rounded-lg p-8 text-center h-[200px] flex items-center justify-center cursor-pointer relative"
                        style={{
                            border: formErrors.avatar
                                ? '0.5px dashed #FF4D4F'
                                : '0.5px dashed #33A959'
                        }}
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
                                    {t('clickToUploadAvatar')}
                                </span>
                            </div>
                        )}
                    </div>
                    {formErrors.avatar && (
                        <span className="text-red-500 text-sm mt-1">
                            {formErrors.avatar}
                        </span>
                    )}
                </div>
                <div className="bottom-0 left-0 right-0 bg-white mt-[25px]">
                    <div className="py-[25px] px-0">
                        <Button
                            onClick={handleCreateStore}
                            className="!w-full h-[48px] bg-[#36B555] hover:bg-[#2EA349] text-white text-[20px] font-medium"
                        >
                            {t('addNew')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
