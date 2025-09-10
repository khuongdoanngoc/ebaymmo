'use client';

import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useRegisterUserMutation } from '@/generated/graphql';
import { useState } from 'react';
import Logo from '@images/logo.svg';
import Checked from '@images/checked.svg';
import Recharge from '@images/recharge.svg';
import BiggyBank from '@images/biggy-bank.svg';
import Feature from '@images/feature.svg';
import Chevron from '@images/chevron.svg';
import Input from '@/components/BaseUI/Input';
import Image from 'next/image';
import Button from '@/components/BaseUI/Button/button';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/BaseUI/Spinner';

// Schema validation bằng Yup
const schema = yup.object().shape({
    email: yup.string().email('Invalid email').required('Please enter email'),
    username: yup
        .string()
        .min(3, 'Login name at least 3 characters')
        .matches(/^\S*$/, 'Username cannot contain spaces')
        .required('Please enter username'),
    password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
            /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).*$/,
            'Password must contain at least one uppercase letter, one number, and one special character'
        )
        .required('Please enter password'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Passwords do not match')
        .required('Please re-enter password'),
    acceptTerms: yup.boolean().oneOf([true], 'You must agree to the terms')
});

// Thêm interface User
export default function Register() {
    const router = useRouter();
    const { showModal } = useStatusModal();
    const [isLoading, setIsLoading] = useState(false);
    const [registerUser] = useRegisterUserMutation({
        onError: (error) => {
            setIsLoading(false);
            showModal('error', `Registration failed: ${error.message}`);
        }
    });

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        setValue,
        trigger
    } = useForm({
        resolver: yupResolver(schema),
        mode: 'onChange'
    });

    // Trigger validation when field loses focus
    const handleBlur = (
        fieldName:
            | 'email'
            | 'username'
            | 'password'
            | 'confirmPassword'
            | 'acceptTerms'
    ) => {
        trigger(fieldName);
    };

    const handleGoogleSignIn = () => {
        signIn('google', {
            callbackUrl: '/'
        });
    };

    const onSubmit = async (data: any) => {
        try {
            setIsLoading(true);
            const { data: response } = await registerUser({
                variables: {
                    email: data.email,
                    password: data.password,
                    username: data.username
                }
            });

            if (response) {
                showModal('success', 'Registered successfully!', () => {
                    router.push('/login');
                });
                reset();
            }
        } catch (err: any) {
            console.error('Registration error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container px-[5px] sm:px-6 lg:px-8 mt-[40px]">
            <div className="flex flex-col lg:flex-row lg:gap-[40px] 2xl:gap-[100px] lg:justify-between">
                <div className="hidden lg:block lg:w-[410px] 2xl:w-[460.14063px] mt-[91.36px]">
                    <div className="w-[259.998px] h-[56.475px]">
                        <Image
                            src={Logo}
                            alt="logo"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex flex-col items-start gap-[45px]">
                        <div className="flex flex-col items-start gap-[20px]">
                            <div className="flex items-center gap-[15px]">
                                <div className="w-[35px] h-[35px]">
                                    <Image
                                        src={Checked}
                                        alt="checked"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <p className="text-[20px] font-medium leading-[160%] text-[var(--Neutral-400,#3F3F3F)] font-[BT Beau Sans]">
                                    Check product duplicates
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-start gap-[20px]">
                            <div className="flex items-center gap-[15px]">
                                <div className="w-[35px] h-[35px]">
                                    <Image
                                        src={Recharge}
                                        alt="Recharge"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <p className="text-[20px] font-medium leading-[160%] text-[var(--Neutral-400,#3F3F3F)] font-[BT Beau Sans]">
                                    Deposit & Auto Payment
                                </p>
                            </div>
                        </div>{' '}
                        <div className="flex flex-col items-start gap-[20px]">
                            <div className="flex items-center gap-[15px]">
                                <div className="w-[35px] h-[35px]">
                                    <Image
                                        src={BiggyBank}
                                        alt="BiggyBank"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <p className="text-[20px] font-medium leading-[160%] text-[var(--Neutral-400,#3F3F3F)] font-[BT Beau Sans]">
                                    Hold order for 3 days
                                </p>
                            </div>
                        </div>{' '}
                        <div className="flex flex-col items-start gap-[20px]">
                            <div className="flex items-center gap-[15px]">
                                <div className="w-[35px] h-[35px]">
                                    <Image
                                        src={Feature}
                                        alt="Feature"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <p className="text-[20px] font-medium leading-[160%] text-[var(--Neutral-400,#3F3F3F)] font-[BT Beau Sans]">
                                    Features for collaborators
                                </p>
                            </div>
                        </div>
                        <p className="text-[14px] font-normal leading-[160%] text-[var(--Neutral-400,#3F3F3F)] font-[BT Beau Sans] box-border">
                            Please read more in the "FAQs - Frequently Asked
                            Questions" section.
                        </p>
                    </div>
                    <p className=" mt-[280px] text-neutral-500 text-[16px] font-normal leading-[160%] font-[BT Beau Sans]">
                        © EbayMMO all right reserved
                    </p>
                </div>

                {/* Right side - Full width on mobile */}
                <div className="w-[calc(100%-10px)] sm:w-full max-w-[480px] sm:max-w-none lg:w-[550px] 2xl:w-[587px] flex flex-col items-start gap-[30px] mx-auto">
                    <div className="w-full flex flex-col items-start gap-[27px] pt-[45px] pb-[45px] px-5 md:px-[59px] rounded-[20px] bg-white shadow-[0px_5px_30px_0px_rgba(2,99,17,0.15)]">
                        <div className="w-full flex flex-col items-center gap-[15px]">
                            <h3 className="text-[22px] lg:text-[24px] font-bold leading-[140%] text-[var(--Neutral-400,#3F3F3F)] font-[BT Beau Sans]">
                                Register
                            </h3>
                            <p className="h-[51.194px] self-stretch text-[14px] lg:text-[16px] font-normal leading-[160%] text-[var(--Neutral-500,#1C1C1C)] font-[BT Beau Sans] text-center">
                                If you use Bypass Captcha programs, you may not
                                be able to register an account.
                            </p>
                        </div>
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="w-full flex flex-col items-center gap-[30px]"
                        >
                            <div className="flex flex-col items-start gap-[23px] w-full">
                                <div className="flex flex-col items-start gap-[20px] w-full">
                                    <div className="w-full">
                                        <Input
                                            {...register('email')}
                                            label="Email"
                                            placeholder="Enter your email"
                                            className={`w-full h-[48px] ${errors.email ? 'border-red-500' : ''}`}
                                            onChange={(e) => {
                                                setValue(
                                                    'email',
                                                    e.target.value
                                                );
                                                trigger('email');
                                            }}
                                            onBlur={() => handleBlur('email')}
                                        />
                                        {errors.email && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors.email.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-full">
                                        <Input
                                            {...register('username')}
                                            label="Username"
                                            placeholder="Enter your username"
                                            className={`w-full h-[48px] ${errors.username ? 'border-red-500' : ''}`}
                                            onChange={(e) => {
                                                setValue(
                                                    'username',
                                                    e.target.value
                                                );
                                                trigger('username');
                                            }}
                                            onBlur={() =>
                                                handleBlur('username')
                                            }
                                        />
                                        {errors.username && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors.username.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-full">
                                        <Input
                                            {...register('password')}
                                            label="Password"
                                            type="password"
                                            placeholder="Enter your password"
                                            className={`w-full h-[48px] ${errors.password ? 'border-red-500' : ''}`}
                                            onChange={(e) => {
                                                setValue(
                                                    'password',
                                                    e.target.value
                                                );
                                                trigger('password');
                                            }}
                                            onBlur={() =>
                                                handleBlur('password')
                                            }
                                        />
                                        {errors.password && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors.password.message}
                                            </p>
                                        )}
                                    </div>
                                    <div className="w-full">
                                        <Input
                                            {...register('confirmPassword')}
                                            label="Re-enter the password"
                                            type="password"
                                            placeholder="Enter your password"
                                            className={`w-full h-[48px] ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                            onChange={(e) => {
                                                setValue(
                                                    'confirmPassword',
                                                    e.target.value
                                                );
                                                trigger('confirmPassword');
                                            }}
                                            onBlur={() =>
                                                handleBlur('confirmPassword')
                                            }
                                        />
                                        {errors.confirmPassword && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {errors.confirmPassword.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-[15px] w-full">
                                        <input
                                            {...register('acceptTerms')}
                                            type="checkbox"
                                            className="w-[24px] h-[24px]
                                          checked:bg-gradient-to-r checked:from-[#2C995E] checked:to-[#36B555]
                                          checked:border-[#2C995E]
                                          accent-[#2C995E]
                                          "
                                        />
                                        <span className="text-[16px] lg:text-[18px] font-normal leading-[160%] text-[var(--Neutral-500,#1C1C1C)] font-[BT Beau Sans]">
                                            I have read & agree to{' '}
                                            <Link
                                                href="/terms"
                                                className="text-[16px] lg:text-[18px] font-normal leading-[160%] text-[var(--Primary-500,#33A959)] font-[BT Beau Sans]"
                                            >
                                                clause
                                            </Link>{' '}
                                            by EbayMMO
                                        </span>
                                    </div>
                                    {errors.acceptTerms && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.acceptTerms.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button
                                type="submit"
                                className="w-full text-white text-[16px] font-[BT Beau Sans] font-medium leading-[160%] flex items-center justify-center transition-all duration-300"
                                style={{
                                    borderRadius: '8px',
                                    background: isLoading
                                        ? 'var(--Primary-600, #2C995E)'
                                        : 'var(--Primary-500, #33A959)'
                                }}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Spinner />
                                        <span>Registering...</span>
                                    </>
                                ) : (
                                    'Register'
                                )}
                            </Button>
                        </form>
                        <div className="w-full h-[1px] bg-[#E1E1E1]" />
                        <div
                            className="flex items-center gap-[13px] mx-auto cursor-pointer"
                            onClick={handleGoogleSignIn}
                        >
                            <Image
                                src="/images/google.svg"
                                alt="googleIcon"
                                width={30}
                                height={30}
                            />
                            <h2 className="text-[16px] lg:text-[18px] font-normal leading-[160%] text-[var(--Neutral-500,#1C1C1C)] font-[BT Beau Sans]">
                                Sign in with Google
                            </h2>
                        </div>
                    </div>
                    <div className="flex justify-center items-center gap-[3px]">
                        <div className="flex gap-[10px]">
                            <span className="text-[14px] lg:text-[16px] font-normal leading-[160%] text-center text-[var(--Neutral-500,#1C1C1C)] font-[BT Beau Sans]">
                                Already have an account?
                            </span>
                            <Link
                                href="/login"
                                className="text-[14px] lg:text-[16px] font-medium leading-[160%] text-[var(--Primary-500,#33A959)]"
                            >
                                Login
                            </Link>
                        </div>
                        <div className="w-[20px] h-[20px]">
                            <Image
                                src={Chevron}
                                alt="chevron"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
