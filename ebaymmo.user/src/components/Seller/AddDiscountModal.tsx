import Input from '@/components/BaseUI/Input';
import Select from '@/components/BaseUI/Select/select';
import Button from '@/components/BaseUI/Button/button';
import { UploadImage } from '@/components/BaseUI/UploadImage';
import Checkbox from '@/components/BaseUI/Checkbox';
import CloudUpload from '@images/seller/cloud-upload.2.svg';
import Image from 'next/image';
import TinyEditor from '@/components/BaseUI/Editor';
import { useMemo, useState } from 'react';
import InputWrapper from '@/components/BaseUI/InputWrapper';
import CustomDatePicker from '../BaseUI/DatePicker/date';
import { Switch } from '@headlessui/react';
import {
    useAddDiscountedMutation,
    useCheckCouponCodeLazyQuery,
    useCheckCouponCodeQuery,
    useGetStoresQuery
} from '@/generated/graphql';
import { useSession } from 'next-auth/react';
import { useStatusModal } from '@/contexts/StatusModalContext';

interface AddDiscountModalProps {
    onClose: () => void;
}

export default function AddDiscountModal({ onClose }: AddDiscountModalProps) {
    const { showModal, closeModal } = useStatusModal();
    const [formState, setFormState] = useState({
        description: '',
        discountCode: '',
        store: '9f6c4e44-2f83-4b0b-8cfc-0d3f836c93fc',
        startDate: null as Date | null,
        endDate: null as Date | null,
        discountType: 'Percentage discount',
        discountRate: 0,
        maximumAmount: 0,
        discountAmount: 0,
        unlimitedUse: false,
        totalUses: 0
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    //intergrate data store
    const { data: session } = useSession();
    const userId = session?.user?.id || '';

    // Thêm hook query
    const { data, loading, error } = useGetStoresQuery({
        variables: {
            where: {
                user: {
                    userId: { _eq: userId }
                }
            }
        },
        skip: !userId
    });

    const dataStores = useMemo(() => {
        return data?.stores || [];
    }, [data]);

    const handleChange = (field: string, value: any) => {
        setFormState((prevState) => ({
            ...prevState,
            [field]: value
        }));
    };

    const [addDiscountedMutation] = useAddDiscountedMutation();

    const [checkCouponCode, { data: couponData }] =
        useCheckCouponCodeLazyQuery();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        // Gọi query kiểm tra mã

        const { data } = await checkCouponCode({
            variables: {
                where: {
                    couponCode: {
                        _ilike: formState.discountCode
                    },
                    storeId: {
                        _eq: formState.store
                    }
                }
            },
            fetchPolicy: 'network-only'
        });

        if ((data?.coupons?.length ?? 0) > 0) {
            setErrors({
                discountCode: 'Discount code already exists in this store'
            });
            return;
        }

        //validate input
        const newErrors: { [key: string]: string } = {};

        const MAX_CODE_LENGTH = 32;

        if (!formState.discountCode) {
            newErrors.discountCode = 'Please enter a discount code';
        } else if (/\s/.test(formState.discountCode)) {
            newErrors.discountCode = 'Discount Code cannot contain spaces.';
        } else if (formState.discountCode.length > MAX_CODE_LENGTH) {
            newErrors.discountCode = `Discount Code exceeds the maximum length of ${MAX_CODE_LENGTH} characters.`;
        }

        if (!formState.store) newErrors.store = 'Please select a store';
        if (!formState.description.trim())
            newErrors.description = 'Please enter your description';
        if (!formState.startDate) {
            newErrors.startDate = 'Please select a start date';
        }
        if (!formState.endDate) newErrors.endDate = 'Please select an end date';
        else if (
            formState.startDate !== null &&
            formState.endDate !== null &&
            new Date(formState.endDate).getTime() <
                new Date(formState.startDate).getTime()
        ) {
            newErrors.endDate = 'End date must be after start date';
        }

        if (!formState.discountType)
            newErrors.discountType = 'Please select a discount type';
        if (!formState.discountRate) {
            newErrors.discountRate = 'Please select a discount rate';
        } else if (isNaN(Number(formState.discountRate))) {
            newErrors.discountRate = 'Discount Rate must be a number.';
        } else if (Number(formState.discountRate) <= 0) {
            newErrors.discountRate = 'Discount Rate must be a positive value.';
        } else if (Number(formState.discountRate) >= 100) {
            newErrors.discountRate = 'Discount Rate must be less than 100.';
        }

        if (
            formState.discountType === 'Percentage discount' &&
            !formState.maximumAmount
        ) {
            newErrors.maximumAmount = 'Please enter the maximum amount';
        } else if (
            formState.discountType === 'Percentage discount' &&
            isNaN(Number(formState.maximumAmount))
        ) {
            newErrors.maximumAmount = 'Maximum amount must be a number.';
        } else if (
            formState.discountType === 'Percentage discount' &&
            Number(formState.maximumAmount) <= 0
        ) {
            newErrors.maximumAmount =
                'Maximum amount must be a positive value.';
        }

        if (
            formState.discountType === 'Fixed amount discount' &&
            !formState.discountAmount
        ) {
            newErrors.discountAmount = 'Please enter the discount amount';
        } else if (
            formState.discountType === 'Fixed amount discount' &&
            isNaN(Number(formState.discountAmount))
        ) {
            newErrors.discountAmount = 'Discount amount must be a number.';
        } else if (
            formState.discountType === 'Fixed amount discount' &&
            Number(formState.discountAmount) <= 0
        ) {
            newErrors.discountAmount =
                'Discount amount must be a positive value.';
        }

        if (!formState.unlimitedUse && !formState.totalUses) {
            newErrors.totalUses = 'Please enter total uses';
        } else if (
            !formState.unlimitedUse &&
            (isNaN(Number(formState.totalUses)) ||
                !Number.isInteger(Number(formState.totalUses)))
        ) {
            newErrors.totalUses = 'Total uses must be an integer.';
        } else if (
            !formState.unlimitedUse &&
            Number(formState.totalUses) <= 0
        ) {
            newErrors.totalUses =
                'Total uses must be a positive integer greater than 0.';
        }

        const MAX_DESCRIPTION_LENGTH = 255;

        if (!formState.description) {
            newErrors.description = 'Please enter a description';
        } else if (formState.description.length > MAX_DESCRIPTION_LENGTH) {
            newErrors.description = `Description exceeds the maximum length of ${MAX_DESCRIPTION_LENGTH} characters.`;
        }

        setErrors(newErrors);

        //Insert data
        if (Object.keys(newErrors).length === 0) {
            if (formState.unlimitedUse) {
                formState.totalUses = 1;
            }

            //
            try {
                await addDiscountedMutation({
                    variables: {
                        objects: {
                            description: formState.description,
                            couponCode: formState.discountCode,
                            storeId: formState.store,
                            startDate: formState.startDate,
                            endDate: formState.endDate,
                            discountType: formState.discountType,
                            discountRate: formState.discountRate,
                            maximumAmount: formState.maximumAmount,
                            discountValue: formState.discountAmount,
                            unlimitedUse: formState.unlimitedUse,
                            usageLimit: formState.totalUses
                        }
                    }
                });

                showModal('success', 'Added successful discount');
                onClose();
            } catch (error) {
                showModal('error', 'Added failed discount');
            }
        }
    };

    return (
        <div className="flex flex-col  items-start gap-[40px] w-full  ">
            <form
                onSubmit={handleSubmit}
                className="flex flex-col items-start gap-[30px] w-full"
            >
                <div className="flex flex-col  items-start gap-[30px] self-stretch w-full">
                    <div className="flex lg:flex-row flex-col items-start w-full gap-[20px] self-stretch">
                        <div className="flex flex-col w-full self-stretch items-start">
                            <Input
                                label="Discount code"
                                placeHolder="e.g., Discount code 30%"
                                display="100%"
                                onChange={(event) =>
                                    handleChange(
                                        'discountCode',
                                        event.target.value
                                    )
                                }
                            />
                            {errors.discountCode && (
                                <label className="text-[#FF0000] font-[500] text-[16px]">
                                    {errors.discountCode}
                                </label>
                            )}
                        </div>
                        <div className="flex flex-col w-full self-stretch items-star">
                            {' '}
                            <Select
                                label="Store"
                                options={[
                                    {
                                        label: 'Select one store',
                                        value: ''
                                    },
                                    ...dataStores.map((store) => ({
                                        label: store.storeName ?? '',
                                        value: store.storeId
                                    }))
                                ]}
                                placeholder="All"
                                display="100%"
                                value={formState.store} // <-- Giá trị được chọn là giá trị của formState
                                onChange={(event) =>
                                    handleChange('store', event.target.value)
                                }
                            />
                            {errors.store && (
                                <label className="text-[#FF0000] font-[500] text-[16px]">
                                    {errors.store}
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="flex lg:flex-row flex-col items-start self-stretch gap-[4px] w-full ">
                        <div className="flex flex-col w-full self-stretch items-start ">
                            {' '}
                            <Input
                                type="textarea"
                                label="Description"
                                placeHolder="Enter your description"
                                display="100%"
                                className="h-[58px]"
                                onChange={(event) =>
                                    handleChange(
                                        'description',
                                        event.target.value
                                    )
                                }
                            />
                            {errors.description && (
                                <label className="text-[#FF0000] font-[500] text-[16px]">
                                    {errors.description}
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="flex lg:flex-row flex-col   items-center w-full gap-[20px] self-stretch  ">
                        <div className="flex flex-col items-start w-full  self-stretch ">
                            <CustomDatePicker
                                id="start-date"
                                label="Start Date"
                                display="100%"
                                placeholder="Select start date"
                                onChange={(date) =>
                                    handleChange('startDate', date)
                                }
                                selectedDate={formState.startDate}
                                minDate={new Date()}
                            />
                            {errors.startDate && (
                                <label className="text-[#FF0000] font-[500] text-[16px]">
                                    {errors.startDate}
                                </label>
                            )}
                        </div>
                        <div className="flex  flex-col items-start w-full self-stretch ">
                            <CustomDatePicker
                                id="end-date"
                                label="End Date"
                                display="100%"
                                placeholder="Select end date"
                                onChange={(date) =>
                                    handleChange('endDate', date)
                                }
                                selectedDate={formState.endDate}
                                minDate={formState.startDate ?? new Date()}
                            />
                            {errors.endDate && (
                                <label className="text-[#FF0000] font-[500] text-[16px]">
                                    {errors.endDate}
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="flex lg:flex-row flex-col  items-start w-full gap-[20px] self-stretch  ">
                        <div className="flex flex-col items-start w-full self-stretch">
                            <Select
                                label="Discount Type"
                                options={[
                                    {
                                        label: 'Percentage discount',
                                        value: 'Percentage discount'
                                    },
                                    {
                                        label: 'Fixed amount discount',
                                        value: 'Fixed amount discount'
                                    }
                                ]}
                                placeholder="Discount Type"
                                display="100%"
                                onChange={(event) =>
                                    handleChange(
                                        'discountType',
                                        event.target.value
                                    )
                                }
                            />
                            {/* {errors.discountType && (
                            <label className="text-[#FF0000] font-[500] text-[16px]">
                                {errors.discountType}
                            </label>
                        )} */}
                        </div>

                        <div className="flex flex-col w-full self-stretch items-start">
                            <Input
                                label="Discount Rate"
                                placeHolder="Select discount rate"
                                display="100%"
                                onChange={(event) =>
                                    handleChange(
                                        'discountRate',
                                        event.target.value
                                    )
                                }
                            />
                            {errors.discountRate && (
                                <label className="text-[#FF0000] font-[500] text-[16px]">
                                    {errors.discountRate}
                                </label>
                            )}
                        </div>

                        {formState.discountType === 'Percentage discount' && (
                            <div className="flex flex-col w-full self-stretch items-start">
                                <Input
                                    label="Maximum Amount"
                                    placeHolder="Enter maximum amount"
                                    display="100%"
                                    onChange={(event) =>
                                        handleChange(
                                            'maximumAmount',
                                            event.target.value
                                        )
                                    }
                                />
                                {errors.maximumAmount && (
                                    <label className="text-[#FF0000] font-[500] text-[16px]">
                                        {errors.maximumAmount}
                                    </label>
                                )}
                            </div>
                        )}

                        {formState.discountType === 'Fixed amount discount' && (
                            <div className="flex flex-col w-full self-stretch items-start">
                                <Input
                                    label="Discount Amount"
                                    placeHolder="Enter discount amount"
                                    display="100%"
                                    onChange={(event) =>
                                        handleChange(
                                            'discountAmount',
                                            event.target.value
                                        )
                                    }
                                />
                                {errors.discountAmount && (
                                    <label className="text-[#FF0000] font-[500] text-[16px]">
                                        {errors.discountAmount}
                                    </label>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="limited flex gap-[20px] items-center ">
                        <p className="text-medium text-neutural-400">
                            Unlimited uses
                        </p>
                        <Switch
                            checked={formState.unlimitedUse}
                            onChange={(value) =>
                                handleChange('unlimitedUse', value)
                            }
                            className={`${
                                formState.unlimitedUse
                                    ? 'bg-green-500'
                                    : 'bg-gray-200'
                            } relative inline-flex h-6 w-11 items-center rounded-full`}
                        >
                            <span
                                className={`${
                                    formState.unlimitedUse
                                        ? 'translate-x-6'
                                        : 'translate-x-1'
                                } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                            />
                        </Switch>
                    </div>
                    {!formState.unlimitedUse && (
                        <div className="flex flex-col items-start self-stretch gap-[4px] w-full">
                            <Input
                                label="Total uses"
                                placeHolder="Enter total uses"
                                display="100%"
                                onChange={(event) =>
                                    handleChange(
                                        'totalUses',
                                        event.target.value
                                    )
                                }
                            />
                            {errors.totalUses && (
                                <label className="text-[#FF0000] font-[500] text-[16px]">
                                    {errors.totalUses}
                                </label>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-cente w-full ">
                    <Button className="!w-full" type="submit">
                        Add New
                    </Button>
                </div>
            </form>
        </div>
    );
}
