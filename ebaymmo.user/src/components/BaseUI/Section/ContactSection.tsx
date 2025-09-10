import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import Cart from '@images/cart.svg.svg';
import FB from '@images/facebook.svg';
import Telegram from '@images/telegram.svg';
import Email from '@images/mail.svg';
import Timer from '@images/timer.svg';
import Input from '../Input';
import Select from '../Select/select';
import { useSendContactEmailMutation } from '@/generated/graphql';
import { useStatusModal } from '@/contexts/StatusModalContext';
import Spinner from '../Spinner';

const schema = yup.object().shape({
    email: yup
        .string()
        .email('Email is not valid')
        .required('Please enter your email'),
    phone: yup
        .string()
        .matches(/^[0-9]+$/, 'Phone number is not valid')
        .min(10, 'Phone number must be at least 10 digits')
        .max(15, 'Phone number cannot be longer than 15 digits')
        .required('Please enter your phone number'),
    need: yup
        .string()
        .notOneOf(['option0'], 'Please select a consultation need')
        .required('Please select a consultation need'),
    content: yup
        .string()
        .required('Please enter your content')
        .min(10, 'Content must be at least 10 characters')
});

const ContactSection = () => {
    const t = useTranslations('contactSection');
    const { data: session } = useSession();
    const { showModal } = useStatusModal();
    const [submitting, setSubmitting] = useState(false);
    const [sendContactEmail] = useSendContactEmailMutation({
        onError: (error) => {
            console.error('Contact error:', error);
            showModal(
                'error',
                'Contact information sent failure!' + error.message
            );
        }
    });

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
        reset
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            email: '',
            phone: '',
            need: 'option0',
            content: ''
        }
    });

    const needValue = watch('need');

    const onSubmit = async (data: any) => {
        setSubmitting(true);
        try {
            const { data: response } = await sendContactEmail({
                variables: {
                    email: data.email,
                    phone: data.phone,
                    need: data.need,
                    content: data.content
                }
            });

            if (response?.sendContactEmail?.success) {
                showModal('success', 'Contact information sent successfully!');
                reset({
                    email: '',
                    phone: '',
                    need: 'option0',
                    content: ''
                });
            } else {
                showModal('error', 'Contact information sent failure!');
            }
        } catch (err: any) {
            console.error('Lỗi gửi form:', err.message);
            showModal(
                'error',
                'Contact information sent failure!' + err.message
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="box-border flex flex-col lg:flex-row w-[calc(100%-3rem)] lg:w-[1417px] mx-6 px-6 py-8 lg:px-[100px] lg:py-[70px] justify-between items-start lg:mx-auto rounded-[35px] bg-white shadow-[0px_5px_30px_0px_rgba(2,99,17,0.15)] ">
            <div className="flex w-full lg:w-[500px] flex-col items-start gap-[45px] flex-shrink-0 ">
                <h2 className="text-[#3F3F3F] font-[BT Beau Sans] text-[28px] md:text-[40px] font-bold leading-[140%] self-stretch">
                    {t('title')}
                </h2>
                <div className="flex flex-col items-start gap-[40px] self-stretch relative overflow-hidden">
                    <p className="text-[#33A959] font-[BT Beau Sans] text-[18px] font-bold leading-[160%]">
                        {t('faq')}
                    </p>
                    <div className="flex flex-col items-start gap-[20px] self-stretch">
                        <div className="flex items-center gap-[15px]">
                            <div className="w-[30px] h-[30px]">
                                <Image
                                    src={FB}
                                    alt="logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <p className="text-[#33A959] font-[BT Beau Sans] text-[18px] font-medium leading-[160%]">
                                {/* {t('social.facebook')} */}
                                EbayMMO
                            </p>
                        </div>
                        <div className="flex items-center gap-[15px]">
                            <div className="w-[30px] h-[30px]">
                                <Image
                                    src={Telegram}
                                    alt="logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <p className="text-[#33A959] font-[BT Beau Sans] text-[18px] font-medium leading-[160%]">
                                {t('social.telegram')}
                            </p>
                        </div>
                        <div className="flex items-center gap-[15px]">
                            <div className="w-[30px] h-[30px]">
                                <Image
                                    src={Email}
                                    alt="logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <p className="text-[#3F3F3F] font-[BT Beau Sans] text-[18px] font-medium leading-[160%]">
                                {/* {t('social.email')} */}
                                ebaymmo.shop@gmail.com
                            </p>
                        </div>
                        <div className="flex items-center gap-[15px]">
                            <div className="w-[30px] h-[30px]">
                                <Image
                                    src={Timer}
                                    alt="logo"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <p className="text-[#3F3F3F] font-[BT Beau Sans] text-[18px] font-medium leading-[160%]">
                                {t('social.workingHours')}
                            </p>
                        </div>
                    </div>
                    <div className="w-[300px] md:w-[602.069px] h-[501.148px] absolute left-[20%] md:left-[-99.535px] bottom-[-240.575px] ">
                        <Image
                            src={Cart}
                            alt="logo"
                            className="w-[250px] h-[200px] md:w-full md:h-full object-cover"
                        />
                    </div>
                </div>
                <p className="text-[#1C1C1C] font-[BT Beau Sans] text-[18px] font-normal leading-[160%] self-stretch">
                    {t('supportMessage')}
                </p>
            </div>
            <div className="w-full flex flex-col items-start gap-[30px] lg:w-[600px]">
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col items-start gap-[15px] self-stretch"
                >
                    <div className="w-full flex flex-col lg:w-[600px] items-start gap-[30px]">
                        <p className="text-[#3F3F3F] font-[BT Beau Sans] text-[18px] font-bold leading-[160%]">
                            {t('contactInfo')}
                        </p>
                        <div className="flex flex-col items-start gap-[20px] self-stretch">
                            <div className="flex flex-col md:flex-row items-start gap-[20px] self-stretch">
                                <div className="flex-1 w-full md:w-auto">
                                    <Input
                                        {...register('email')}
                                        label={t('emailLabel')}
                                        placeholder={t('emailPlaceholder')}
                                        onChange={(e) =>
                                            setValue(
                                                'email',
                                                e.target.value.trim()
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex-1 w-full md:w-auto">
                                    <Input
                                        {...register('phone')}
                                        label={t('phoneLabel')}
                                        placeholder={t('phonePlaceholder')}
                                        onChange={(e) =>
                                            setValue(
                                                'phone',
                                                e.target.value.trim()
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-start gap-[15px] self-stretch">
                            <p className="text-[#3F3F3F] font-[BT Beau Sans] text-[18px] font-bold leading-[160%]">
                                {t('consultationNeed')}
                            </p>
                            <div className="flex flex-col items-start gap-[20px] self-stretch w-full">
                                <Select
                                    options={[
                                        {
                                            value: 'option0',
                                            label: t('selectConsultation')
                                        },
                                        {
                                            value: 'option1',
                                            label: t('option1')
                                        },
                                        {
                                            value: 'option2',
                                            label: t('option2')
                                        },
                                        {
                                            value: 'option3',
                                            label: t('option3')
                                        }
                                    ]}
                                    label={t('consultationNeed')}
                                    name="need"
                                    value={needValue}
                                    error={!!errors.need}
                                    errorMessage={errors.need?.message}
                                    onChange={(e) => {
                                        setValue('need', e.target.value);
                                    }}
                                />
                                <div className="w-full">
                                    <Input
                                        {...register('content')}
                                        type="textarea"
                                        className="w-full h-[168px]"
                                        label={t('contentLabel')}
                                        placeholder={t('contentPlaceholder')}
                                        onChange={(e) =>
                                            setValue(
                                                'content',
                                                e.target.value.trim()
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <p
                        className={`text-red-500 transition-all duration-200 ${
                            errors.email ||
                            errors.phone ||
                            errors.need ||
                            errors.content
                                ? 'block'
                                : 'hidden'
                        }`}
                    >
                        {errors.email?.message ||
                            (!errors.email && errors.phone?.message) ||
                            (!errors.email &&
                                !errors.phone &&
                                errors.need?.message) ||
                            (!errors.email &&
                                !errors.phone &&
                                !errors.need &&
                                errors.content?.message)}
                    </p>
                    <button
                        type="submit"
                        disabled={!session || submitting}
                        className={
                            !session || submitting
                                ? 'flex items-center justify-center gap-[10px] text-white font-medium text-[18px] leading-[160%] px-6 py-2 rounded-lg bg-gray-400 border border-gray-400 cursor-not-allowed transition'
                                : 'flex items-center justify-center gap-[10px] text-white font-medium text-[18px] leading-[160%] px-6 py-2 rounded-lg bg-[linear-gradient(90deg,#2C995E_0%,#36B555_75%)] hover:opacity-90 transition'
                        }
                    >
                        {submitting ? (
                            <>
                                <Spinner />
                                <span>{t('sendingButton')}</span>
                            </>
                        ) : (
                            t('sendButton')
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ContactSection;
