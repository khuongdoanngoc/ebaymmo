'use client';

import Button from '@/components/BaseUI/Button/button';
import Form from '@/components/BaseUI/Form';
import Input from '@/components/BaseUI/Input';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import React, { useState } from 'react';
import {
    useForgotPasswordMutation,
    useGetUserByEmailLazyQuery
} from '@/generated/graphql';

const InputWrapper = ({
    error,
    ...props
}: Omit<React.ComponentProps<typeof Input>, 'error'> & { error?: string }) => {
    return <Input {...props} error={Boolean(error)} errorMessage={error} />;
};

const schema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Please enter email')
});

type FormData = {
    email: string;
};

export default function ForgotPassword() {
    const [forgotPassword, { loading: forgotLoading }] =
        useForgotPasswordMutation();
    const [checkEmail, { loading: checkingEmail, data: userData }] =
        useGetUserByEmailLazyQuery();
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue
    } = useForm<FormData>({
        resolver: yupResolver(schema)
    });

    const onSubmit = async (data: FormData) => {
        try {
            // Check email khi submit form
            const { data: emailCheckResult } = await checkEmail({
                variables: { email: data.email }
            });

            if (!emailCheckResult?.users?.[0]) {
                setMessage({
                    type: 'error',
                    text: 'Email is not exist in system or not registered'
                });
                return;
            }

            const response = await forgotPassword({
                variables: {
                    email: data.email
                }
            });

            if (response.data?.forgotPassword?.success) {
                setMessage({
                    type: 'success',
                    text: 'Please check your email for reset password'
                });
            }
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.message || 'Something went wrong'
            });
        }
    };

    const loading = checkingEmail || forgotLoading;

    // const { data: session } = useSession();
    // if(!session){
    //     return <div>Loading...</div>;
    // }

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col">
            <div className="flex-grow flex flex-col items-center justify-center px-6 md:px-4">
                <div className="w-full md:w-[588px] flex flex-col mx-auto">
                    <div>
                        <Form
                            width="100%"
                            title="Forgot password"
                            google
                            logo
                            onSubmit={handleSubmit(onSubmit)}
                        >
                            {message && (
                                <div
                                    className={`mb-4 p-3 rounded ${
                                        message.type === 'success'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                    }`}
                                >
                                    {message.text}
                                </div>
                            )}

                            <InputWrapper
                                label="Email"
                                placeholder="Enter your email"
                                className="w-full"
                                error={errors.email?.message || ''}
                                disabled={loading}
                                {...register('email')}
                                onChange={(e) => {
                                    setValue('email', e.target.value);
                                }}
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
                                disabled={loading}
                            >
                                {loading
                                    ? 'Loading...'
                                    : 'Send reset password code'}
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
