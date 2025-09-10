'use client';

import Button from '@/components/BaseUI/Button/button';
import Form from '@/components/BaseUI/Form';
import Input from '@/components/BaseUI/Input';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

export default function Login() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({
        email: '',
        password: '',
        server: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Validate email
    const validateEmail = (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!email) {
            return 'Email cannot be empty';
        } else if (!emailRegex.test(email)) {
            return 'Email is not valid';
        }
        return '';
    };

    // Validate password
    const validatePassword = (password: string) => {
        if (!password) {
            return 'Password cannot be empty';
        } else if (password.length < 6) {
            return 'Password must be at least 6 characters';
        }
        return '';
    };

    // Handle email change - không validate khi onChange
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        // Clear error when user starts typing
        if (errors.email) {
            setErrors((prev) => ({
                ...prev,
                email: ''
            }));
        }
    };

    // Handle password change - không validate khi onChange
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        // Clear error when user starts typing
        if (errors.password) {
            setErrors((prev) => ({
                ...prev,
                password: ''
            }));
        }
    };

    // Lấy callbackUrl từ query params (middleware truyền qua)
    const callbackUrl = searchParams.get('callbackUrl') || '/';

    // Redirect nếu đã đăng nhập
    useEffect(() => {
        if (status === 'authenticated' && session) {
            router.push(callbackUrl);
        }
    }, [status, session, router, callbackUrl]);

    // Submit handler - chỉ validate khi submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validate both fields when submitting
        const emailError = validateEmail(email);
        const passwordError = validatePassword(password);

        if (emailError || passwordError) {
            setErrors({
                email: emailError,
                password: passwordError,
                server: ''
            });
            setIsSubmitting(false);
            return;
        }

        try {
            const res = await signIn('credentials', {
                email,
                password,
                redirect: false
            });

            if (res?.error) {
                setErrors({
                    email: '',
                    password: '',
                    server: 'Account or password is not correct'
                });
            } else {
                router.push(callbackUrl);
            }
        } catch (error) {
            console.error('Login failed:', error);
            setErrors({
                email: '',
                password: '',
                server: 'An error occurred. Please try again later.'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Xử lý đăng nhập Google
    const handleGoogleSignIn = () => {
        signIn('google', { callbackUrl });
    };
    return (
        <div className="w-[375px] md:w-full min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-6 sm:py-10">
            <div className="flex flex-col gap-[30px] w-full max-w-[450px]">
                <Form
                    callbackUrl={callbackUrl}
                    title="Login"
                    google
                    logo
                    onSubmit={handleSubmit}
                    className="md:w-[580px] w-[350px]"
                >
                    <div className="flex flex-col gap-[20px] sm:gap-[25px]">
                        <Input
                            label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={handleEmailChange}
                            error={!!errors.email}
                            errorMessage={errors.email}
                        />

                        <div className="flex flex-col gap-[10px]">
                            <Input
                                label="Password"
                                placeholder="Enter your password"
                                type="password"
                                value={password}
                                onChange={handlePasswordChange}
                                error={!!errors.password}
                                errorMessage={errors.password}
                            />

                            <a
                                href="forgot-password"
                                className="text-[14px] sm:text-[16px] text-[#FF4747] text-right"
                            >
                                Forgot password?
                            </a>
                        </div>

                        {errors.server && (
                            <div className="text-red-500 text-[14px] sm:text-[16px] text-left">
                                {errors.server}
                            </div>
                        )}

                        <div className="flex justify-start items-center">
                            <Input
                                type="checkbox"
                                rounded="rounded-[7px]"
                                className="w-[20px] h-[20px] sm:w-[24px] sm:h-[24px]"
                            />
                            <span className="ml-2 text-gray-600 mt-[8px] text-[16px] sm:text-[18px]">
                                Remember to log in
                            </span>
                        </div>

                        <div className="flex flex-col gap-[20px] sm:gap-[30px] mt-2 sm:mt-4">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full h-10 md:h-[56px] px-4 md:px-8 py-2 md:py-4 text-sm md:text-base text-white rounded-[30px] md:rounded-[86px] ${
                                    isSubmitting
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                }`}
                                style={{
                                    background: 'var(--Primary-500, #33A959)'
                                }}
                            >
                                {isSubmitting ? 'Logging in...' : 'Login'}
                            </Button>
                        </div>
                    </div>
                </Form>

                <div className="flex justify-center sm:justify-start items-center sm:ml-[50px] text-center sm:text-left">
                    <span className="text-[14px] sm:text-[16px] text-[#3F3F3F]">
                        Don't have an account?
                    </span>
                    <Link
                        href="/register"
                        className="text-[14px] sm:text-[16px] text-primary-500 ml-[5px]"
                    >
                        Sign up
                    </Link>
                    <div className="flex justify-center items-center">
                        <Image
                            className="ml-[3px]"
                            src="/images/chevron-forward.svg"
                            width={20}
                            height={20}
                            alt="forward arrow"
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="mt-6 sm:mt-8 text-center text-[14px] sm:text-[16px] text-gray-600">
                © EbayMMO all right reserved
            </footer>
        </div>
    );
}
