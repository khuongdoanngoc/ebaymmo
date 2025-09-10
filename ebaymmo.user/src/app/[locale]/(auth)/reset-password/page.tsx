'use client';

import Button from '@/components/BaseUI/Button/button';
import Form from '@/components/BaseUI/Form';
import Input from '@/components/BaseUI/Input';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useResetPasswordMutation } from '@/generated/graphql';
import { useStatusModal } from '@/contexts/StatusModalContext';

const InputWrapper = ({
    error,
    ...props
}: Omit<React.ComponentProps<typeof Input>, 'error'> & { error?: string }) => {
    return <Input {...props} error={Boolean(error)} errorMessage={error} />;
};

const schema = yup.object({
    newPassword: yup
        .string()
        .trim()
        .required('Password cannot be empty')
        .min(6, 'Password must be at least 6 characters'),
    confirmNewPassword: yup
        .string()
        .trim()
        .oneOf([yup.ref('newPassword')], 'Passwords do not match')
        .required('Confirm password cannot be empty')
});

type FormData = {
    newPassword: string;
    confirmNewPassword: string;
};

function ResetPassword() {
    const router = useRouter();

    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const { showModal, closeModal } = useStatusModal();
    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm<FormData>({
        resolver: yupResolver(schema)
    });
    const [resetPassword, { loading, error, data }] =
        useResetPasswordMutation();

    useEffect(() => {
        if (!token) {
            showModal('error', 'Missing required fields!');
            router.push('/forgot-password');
            return;
        }
        // Verify token thông qua API route
        const verifyToken = async () => {
            try {
                const response = await fetch('/api/verify-reset-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();

                if (!data.valid) {
                    showModal('error', 'Invalid or expired reset token');
                    router.push('/forgot-password');
                }
            } catch (error) {
                showModal('error', 'Failed to verify reset token');
                router.push('/forgot-password');
            }
        };

        verifyToken();
    }, [token, router]);

    useEffect(() => {
        if (loading) {
            showModal('loading');
        } else {
            closeModal();

            if (error) {
                showModal('error', error.message);
            } else if (data && !data.resetPassword?.success) {
                showModal(
                    'error',
                    data.resetPassword?.error ?? 'Unknown error'
                );
            }

            if (data?.resetPassword?.success) {
                showModal('success', data.resetPassword.message);
            }
        }
    }, [loading, error, data]);

    const onSubmit = async (data: FormData) => {
        if (token && data.newPassword) {
            try {
                const response = await resetPassword({
                    variables: {
                        newPassword: data.newPassword,
                        token
                    }
                });
                if (response.data?.resetPassword?.success) {
                    router.push('/login');
                }
            } catch (err) {}
        } else {
            showModal(
                'error',
                'Please fill out all required fields before submitting the form!'
            );
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <div className="flex-grow flex flex-col items-center justify-center px-6 md:px-4 ">
                <div className="w-full md:w-[588px] flex flex-col mx-auto">
                    <div>
                        <Form
                            width="100%"
                            title="Reset Password"
                            logo
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            <InputWrapper
                                label="New Password"
                                placeholder="Enter your new password"
                                type="password"
                                className="w-full"
                                {...register('newPassword')}
                                onChange={(e) => {
                                    setValue('newPassword', e.target.value);
                                }}
                                error={errors.newPassword?.message || ''}
                            />

                            <InputWrapper
                                label="Confirm Password"
                                placeholder="Re-enter your password"
                                type="password"
                                className="mt-7"
                                {...register('confirmNewPassword')}
                                onChange={(e) => {
                                    setValue(
                                        'confirmNewPassword',
                                        e.target.value
                                    );
                                }}
                                error={errors.confirmNewPassword?.message || ''}
                            />

                            <Button
                                type="submit"
                                className="w-full max-w-[462px] 
                                    h-10 md:h-[56px] 
                                    px-4 md:px-8 
                                    py-2 md:py-4 
                                    mt-4 md:mt-6 
                                    text-sm md:text-base
                                    text-white 
                                    rounded-[86px] md:rounded-[14px]"
                                style={{
                                    background: 'var(--Primary-500, #33A959)'
                                }}
                            >
                                Change password
                            </Button>
                        </Form>
                    </div>
                    <Link
                        href="/login"
                        className="flex items-center mt-8 group hover:opacity-80 transition-opacity ml-12"
                    >
                        <div className="flex items-center justify-center">
                            <Image
                                src="/images/chevron-backward.svg"
                                alt="backward"
                                width={20}
                                height={20}
                                className=""
                            />
                        </div>
                        <span className="text-primary ml-2 font-medium">
                            Back to Login
                        </span>
                    </Link>
                </div>
            </div>
            <footer className="text-center text-base text-[#1C1C1C]">
                © EbayMMO all right reserved
            </footer>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPassword />
        </Suspense>
    );
}
