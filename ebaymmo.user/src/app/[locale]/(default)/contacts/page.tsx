'use client';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import FB from '@images/facebook.svg';
import Telegram from '@images/telegram.svg';
import Email from '@images/mail.svg';
import Timer from '@images/timer.svg';
import Input from '@/components/BaseUI/Input';
import Select from '@/components/BaseUI/Select/select';
import { useSendContactEmailMutation } from '@/generated/graphql';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { useSession } from 'next-auth/react';
import Spinner from '@/components/BaseUI/Spinner';

const Contacts = () => {
    const t = useTranslations('contact');
    const { data: session } = useSession();
    const { showModal, closeModal } = useStatusModal();
    const [submitting, setSubmitting] = useState(false);
    const [sendContactEmail] = useSendContactEmailMutation({
        onError: (error) => {
            console.error('Contact error:', error);
            showModal('error', t('messages.error') + error.message);
        }
    });

    const schema = yup.object().shape({
        email: yup
            .string()
            .email(t('validation.email.invalid'))
            .required(t('validation.email.required')),
        phone: yup
            .string()
            .matches(/^[0-9]+$/, t('validation.phone.invalid'))
            .min(10, t('validation.phone.minLength'))
            .max(15, t('validation.phone.maxLength'))
            .required(t('validation.phone.required')),
        need: yup
            .string()
            .notOneOf(['option0'], t('validation.need.required'))
            .required(t('validation.need.required')),
        content: yup
            .string()
            .required(t('validation.content.required'))
            .min(10, t('validation.content.minLength'))
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
                showModal('success', t('messages.success'));
                reset({
                    email: '',
                    phone: '',
                    need: 'option0',
                    content: ''
                });
            } else {
                showModal('error', t('messages.error'));
            }
        } catch (err: any) {
            console.error('Lỗi gửi form:', err.message);
            showModal('error', t('messages.error') + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="w-full flex items-center justify-center mt-[80px]">
            <div className="box-border flex flex-col lg:flex-row w-[calc(100%-3rem)] lg:max-w-[1800px] lg-w-full mx-6 px-6 py-8 lg:py-25 lg:px-36 items-start lg:mx-0">
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
                                    {t('socialLinks.facebook')}
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
                                    {t('socialLinks.telegram')}
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
                                    {t('socialLinks.email')}
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
                                    {t('socialLinks.workingHours')}
                                </p>
                            </div>
                        </div>
                    </div>
                    <p className="text-[#1C1C1C] font-[BT Beau Sans] text-[18px] font-normal leading-[160%] self-stretch lg:mb-0 mb-[50px]">
                        {t('supportMessage')}
                    </p>
                </div>
                <div className="flex flex-col items-start gap-[30px] lg:w-full w-full lg:ml-[70px] ml-0">
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="flex flex-col items-start gap-[15px] self-stretch w-full"
                    >
                        <div className="w-full flex flex-col lg:w-full items-start gap-[30px]">
                            <p className="text-[#3F3F3F] font-[BT Beau Sans] text-[18px] font-bold leading-[160%]">
                                {t('form.contactInfo')}
                            </p>
                            <div className="flex flex-col items-start gap-[20px] self-stretch">
                                <div className="flex flex-col md:flex-row items-start gap-[20px] self-stretch">
                                    <div className="flex-1 w-full md:w-auto">
                                        <Input
                                            {...register('email')}
                                            label={t('form.email.label')}
                                            placeholder={t(
                                                'form.email.placeholder'
                                            )}
                                            onChange={(e) =>
                                                setValue(
                                                    'email',
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="flex-1 w-full md:w-auto">
                                        <Input
                                            {...register('phone')}
                                            label={t('form.phone.label')}
                                            placeholder={t(
                                                'form.phone.placeholder'
                                            )}
                                            onChange={(e) =>
                                                setValue(
                                                    'phone',
                                                    e.target.value
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-start gap-[15px] self-stretch">
                                <p className="text-[#3F3F3F] font-[BT Beau Sans] text-[18px] font-bold leading-[160%]">
                                    {t('form.consultationNeed.title')}
                                </p>
                                <div className="flex flex-col items-start gap-[20px] self-stretch w-full">
                                    <Select
                                        options={[
                                            {
                                                value: 'option0',
                                                label: t(
                                                    'form.consultationNeed.options.default'
                                                )
                                            },
                                            {
                                                value: 'option1',
                                                label: t(
                                                    'form.consultationNeed.options.option1'
                                                )
                                            },
                                            {
                                                value: 'option2',
                                                label: t(
                                                    'form.consultationNeed.options.option2'
                                                )
                                            },
                                            {
                                                value: 'option3',
                                                label: t(
                                                    'form.consultationNeed.options.option3'
                                                )
                                            }
                                        ]}
                                        label={t('form.consultationNeed.label')}
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
                                            label={t('form.content.label')}
                                            placeholder={t(
                                                'form.content.placeholder'
                                            )}
                                            onChange={(e) =>
                                                setValue(
                                                    'content',
                                                    e.target.value
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
                                    <span>{t('form.sending')}</span>
                                </>
                            ) : (
                                t('form.submit')
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contacts;
