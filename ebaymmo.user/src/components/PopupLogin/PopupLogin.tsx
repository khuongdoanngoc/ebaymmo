'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Button from '../BaseUI/Button/button';
import Input from '../BaseUI/Input';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStatusModal } from '@/contexts/StatusModalContext';

const schema = yup.object().shape({
    email: yup.string().email('Email is invalid').required('Email is required'),
    password: yup
        .string()
        .min(6, 'Password must be at least 6 characters')
        .required('Please enter password'),
    rememberMe: yup.boolean()
});

function PopupLogin() {
    const { showModal } = useStatusModal();

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors }
    } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            rememberMe: false
        }
    });

    const [serverError, setServerError] = useState('');

    const onSubmit = async (data: any) => {
        try {
            const res = await signIn('credentials', {
                redirect: false,
                email: data.email,
                password: data.password
            });

            if (res?.error) {
                setServerError(res.error);
                showModal('error', 'Login failed');
            } else {
                window.location.reload();
            }
        } catch (error) {
            console.error('Login failed:', error);
            showModal('error', 'Login failed. Please try again.');
        }
    };

    return (
        <div>
            <h1 className="text-black font-bold text-[20px] mb-[20px] text-center">
                Login
            </h1>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex flex-col items-center gap-[10px]"
            >
                <div className="flex flex-col items-start gap-[23px]">
                    <div className="flex flex-col items-start gap-[25px] w-full">
                        <div className="w-full">
                            <Input
                                type="text"
                                placeholder="Email"
                                className="!w-[276px] h-[42px]"
                                onChange={(e) => {
                                    setValue('email', e.target.value);
                                }}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div className="w-full">
                            <div className="w-full">
                                <Input
                                    type="password"
                                    placeholder="Password"
                                    className="!w-[276px] h-[42px]"
                                    notEyeIcon={true}
                                    onChange={(e) => {
                                        setValue('password', e.target.value);
                                    }}
                                />
                                {errors.password && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.password.message}
                                    </p>
                                )}
                            </div>
                            <div className="flex justify-end mt-1">
                                <Link
                                    href="/forgot-password"
                                    className="text-red-500 text-[14px] font-[BT Beau Sans] leading-[160%] underline hover:cursor-pointer hover:text-red-700"
                                >
                                    Forgot password
                                </Link>
                            </div>
                        </div>
                        {/* <div className="flex items-center gap-[10px]">
                            <Checkbox
                                content="Remember me"
                                onChange={(checked) => {
                                    const event = { target: { checked } };
                                    register('rememberMe').onChange(event);
                                }}
                            />
                        </div> */}
                    </div>
                </div>
                <Button
                    type="submit"
                    className="text-white text-[16px] font-[BT Beau Sans] font-medium leading-[160%] mb-[20px]"
                    width="276px"
                >
                    Login
                </Button>
                {serverError && (
                    <p className="text-red-500 text-sm mb-4">{serverError}</p>
                )}
            </form>
            <div className="text-black text-[14px] font-[BT Beau Sans] leading-[160%] text-center">
                Don&apos;t have an account yet?&nbsp;
                <Link href="/register" className="text-primary-500">
                    Register
                </Link>
            </div>
            <div>
                <div className="w-full h-[1px] bg-[#e1e1e1] mt-[20px] mb-[20px]" />
                <div
                    onClick={() => signIn('google')}
                    className="flex item-center justify-center hover:cursor-pointer"
                >
                    <Image
                        src="/images/google.svg"
                        alt="googleIcon"
                        width={20}
                        height={20}
                    />
                    <h2 className="ml-[13px] text-[15px] text-black font-semibold">
                        Login with Google
                    </h2>
                </div>
            </div>
        </div>
    );
}

export default PopupLogin;
