'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    useInsertStoreRegistrationMutation,
    useCheckUserTwoFactorEnabledQuery,
    useVerify2FaCodeMutation,
    useInsertNotificationsMutation
} from '@/generated/graphql';
import Button from '../BaseUI/Button/button';
import Input from '../BaseUI/Input';
import Modal from '../BaseUI/Modal';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SaleRegistrationFeature from './SaleRegistrationIFeature';
import UploadInformation from '../UploadInformation/UploadInformation';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { useUserInfo } from '@/contexts/UserInfoContext';
import { useTranslations } from 'next-intl';
// Update schema validation to remove bankAccountName
const schema = yup.object().shape({
    phoneNumber: yup
        .string()
        .required('Please enter your phone number')
        .matches(/^[0-9]+$/, 'Phone number must contain only numbers')
        .min(10, 'Phone number must be at least 10 digits')
        .max(11, 'Phone number cannot exceed 11 digits')
});

export default function SaleRegistration() {
    const { userInfo } = useUserInfo();
    const { data: session } = useSession();
    const router = useRouter();
    const { showModal } = useStatusModal();
    const [show2FAWarning, setShow2FAWarning] = useState(false);
    const [verifyCode, setVerifyCode] = useState('');
    const [idCardImage, setIdCardImage] = useState('');
    const [portraitPhoto, setPortraitPhoto] = useState('');
    const [insertStoreRegistration] = useInsertStoreRegistrationMutation();
    const [insertNotification] = useInsertNotificationsMutation();
    const [isLoading, setIsLoading] = useState(true);

    const { data: twoFactorData, refetch: refetchTwoFactorStatus } =
        useCheckUserTwoFactorEnabledQuery({
            variables: {
                userId: session?.user?.id || ''
            },
            skip: !session?.user?.id
        });

    const [verify2FACode] = useVerify2FaCodeMutation();

    // Effect riêng biệt để xử lý twoFactorData khi nó thay đổi
    useEffect(() => {
        if (twoFactorData) {
            const is2FAEnabled = !!twoFactorData.usersByPk?.twoFactorEnabled; // Convert null/undefined to false

            if (!is2FAEnabled) {
                setShow2FAWarning(true);
            } else {
                setShow2FAWarning(false);
            }
        }
    }, [twoFactorData]); // Dependency đối với twoFactorData

    // Effect xử lý session và gọi refetch
    useEffect(() => {
        const check2FAStatus = async () => {
            if (!session) {
                // Session đang tải hoặc không có, không làm gì cả
                setIsLoading(true);
                return;
            }

            setIsLoading(false);

            if (session?.user?.id) {
                await refetchTwoFactorStatus();
            } else {
                router.push('/login');
            }
        };

        check2FAStatus();
    }, [session?.user?.id, refetchTwoFactorStatus]);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data: any) => {
        if (!session?.user?.id) {
            showModal('error', 'Please login');
            return;
        }

        if (userInfo?.sellerSince) {
            showModal('error', 'You have already registered');
            return;
        }

        if (!twoFactorData?.usersByPk?.twoFactorEnabled) {
            setShow2FAWarning(true);
            return;
        }

        if (!verifyCode) {
            showModal('error', 'Please enter 2FA code');
            return;
        }

        try {
            const { data: verifyResult } = await verify2FACode({
                variables: {
                    twoFactorToken: verifyCode
                }
            });

            if (!verifyResult?.verify2FACode?.status) {
                showModal('error', '2FA code is incorrect');
                return;
            }

            const result = await insertStoreRegistration({
                variables: {
                    userId: session.user.id,
                    phoneNumber: data.phoneNumber,
                    idCardImage: idCardImage,
                    portraitPhoto: portraitPhoto
                }
            });

            const responseNotification = await insertNotification({
                variables: {
                    objects: [
                        {
                            notificationType: 'Seller Registration',
                            content: `User ${session?.user?.name} has registered as a seller`,
                            isRead: false,
                            createAt: new Date().toISOString(),
                            userId: session?.user?.id,
                            sentDate: new Date().toISOString()
                        }
                    ]
                }
            });

            if (result.data) {
                showModal('success', 'Registration successful!');
                setTimeout(() => {
                    router.push('/');
                }, 2000);
            }
        } catch (error: any) {
            showModal('error', `Registration failed: ${error.message}`);
        }
    };

    const t = useTranslations('saleRegistration');

    return (
        <>
            <div className="section-sale-registration mt-[10px] lg:mt-[30px] font-beausans bg-modal-content-bg p-4">
                <div className="container mx-auto max-w-[1420px] items-center justify-evenly mt-[20px] grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2">
                    {/* left */}
                    <div className="item-left lg:order-1 order-2 max-w-[500px] w-[100%] mx-auto mt-[10px] flex flex-col items-start gap-y-[35px]">
                        <h2 className="title text-[#3F3F3F] font-bold text-2xl leading-[33.6px]">
                            {t('title')}
                        </h2>
                        <div className="content flex flex-col gap-[30px] text-[16px] items-start">
                            <SaleRegistrationFeature />
                        </div>
                    </div>

                    {/* right */}
                    <div className="item-right lg:order-2 order-1 lg:mt-[80px] justify-center max-w-[580px] sm:max-w-[580px] w-full md:max-w-[580px] lg:max-w-[580px] mx-auto lg:px-[59px] lg:py-[45px] flex items-start bg-white rounded-[20px] shadow-[0px_5px_30px_0px_rgba(2,99,17,0.15)]">
                        <div className="flex flex-col items-center justify-center gap-[10px] w-full">
                            <h2 className="title text-[#3F3F3F] flex font-bold self-center text-2xl leading-[33.6px] mt-[40px] lg:mt-[10px]">
                                {t('storeInformation')}
                            </h2>
                            {!twoFactorData?.usersByPk?.twoFactorEnabled && (
                                <p className="text-red-500 text-sm">
                                    * {t('needEnable2fa')}
                                </p>
                            )}
                            <div className="flex flex-col gap-[35px] items-start w-full">
                                <form
                                    onSubmit={handleSubmit(onSubmit)}
                                    className="w-full"
                                >
                                    <div className="flex flex-col gap-[30px] w-full p-6">
                                        <Input
                                            {...register('phoneNumber')}
                                            label={t('phoneNumber')}
                                            placeholder={t('enterPhoneNumber')}
                                            className="w-full"
                                            error={!!errors.phoneNumber}
                                            errorMessage={
                                                errors.phoneNumber?.message
                                            }
                                            onChange={(e) => {
                                                // Only allow numeric values
                                                const value =
                                                    e.target.value.replace(
                                                        /[^0-9]/g,
                                                        ''
                                                    );
                                                setValue('phoneNumber', value);
                                            }}
                                        />

                                        <div className="upload-image grid lg:grid-cols-2 grid-col-1 items-center gap-[20px] w-full">
                                            <UploadInformation
                                                iconSrc="/images/upload.svg"
                                                title={t('uploadIdCard')}
                                                onUploadSuccess={(
                                                    url: string
                                                ) => setIdCardImage(url)}
                                            />
                                            <UploadInformation
                                                iconSrc="/images/upload.svg"
                                                title={t('uploadPortraitPhoto')}
                                                onUploadSuccess={(
                                                    url: string
                                                ) => setPortraitPhoto(url)}
                                            />
                                        </div>
                                        <Input
                                            label={t('2faCode')}
                                            type="text"
                                            placeholder={t('enter2faCode')}
                                            className="w-full"
                                            maxLength={6}
                                            value={verifyCode}
                                            onChange={(e) =>
                                                setVerifyCode(e.target.value)
                                            }
                                        />
                                        <div className="flex items-center justify-center w-full">
                                            <Button
                                                type="submit"
                                                className=""
                                                width="100%"
                                                disabled={
                                                    !twoFactorData?.usersByPk
                                                        ?.twoFactorEnabled
                                                }
                                                onClick={handleSubmit(onSubmit)}
                                            >
                                                {t('register')}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {show2FAWarning && (
                    <Modal
                        isOpen={show2FAWarning}
                        onClose={() => setShow2FAWarning(false)}
                        title={t('enable2fa')}
                        width="w-[500px]"
                        className="!bg-white !bg-none"
                        noButton
                    >
                        <div className="flex flex-col items-center gap-6 p-6">
                            <div className="flex flex-col items-center gap-2">
                                <Image
                                    src="/images/2FA.jpg"
                                    alt="2FA"
                                    width={150}
                                    height={150}
                                />
                                <p className="text-center text-gray-600 mt-4">
                                    {t('needEnable2fa')}
                                </p>
                                <p className="text-sm text-gray-500 text-center">
                                    {t('2faProtection')}
                                </p>
                            </div>
                            <div className="w-[400px] mx-auto">
                                <Button
                                    onClick={() => {
                                        // Lưu flag vào localStorage để biết cần cuộn đến phần 2FA
                                        if (typeof window !== 'undefined') {
                                            localStorage.setItem(
                                                'scrollTo2FA',
                                                'true'
                                            );
                                        }
                                        router.push(
                                            '/user/accounts-management'
                                        );
                                    }}
                                    className="w-full h-[46px] bg-primary-500 text-white rounded-full hover:bg-primary-600"
                                >
                                    {t('enableNow')}
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </>
    );
}
