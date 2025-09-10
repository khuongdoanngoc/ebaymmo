'use client';

import { signIn, getSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface IFormProps {
    logo?: boolean;
    title: string;
    children: React.ReactNode;
    google?: boolean;
    onSubmit?: (e: React.FormEvent) => void;
    width?: string;
    callbackUrl?: string; // Thêm callbackUrl để truyền từ parent
    className?: string;
}

function Form(props: IFormProps) {
    const {
        logo,
        title,
        google,
        children,
        onSubmit,
        callbackUrl = '/',
        width,
        className = ''
    } = props;
    const containerWidth = className || '580px';
    const router = useRouter();

    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        try {
            await signIn('google', { callbackUrl });
            // Không cần router.push ở đây vì NextAuth sẽ tự redirect
        } catch (error) {
            console.error('Google Sign-In failed:', error);
        } finally {
            setIsGoogleLoading(false);
        }
    };

    // const handleGoogleSignIn = async () => {
    //     await signIn('google');
    // };

    return (
        <div className={className} style={{ width: containerWidth }}>
            {logo && (
                <div className="flex justify-center">
                    <Image
                        className="hover:cursor-pointer"
                        src="/images/logo.svg"
                        alt="logoIcon"
                        width={240}
                        height={30}
                    />
                </div>
            )}
            <div className="rounded-[20px] p-[45px_59px] shadow-[0px_5px_30px_0px_rgba(2,99,17,0.15)] mt-[50px]">
                <div className="flex justify-center">
                    <h2 className="text-2xl font-bold mb-[27px]">{title}</h2>
                </div>
                <form onSubmit={onSubmit}>{children}</form>
                {google && (
                    <div>
                        <div className="w-full h-[1px] bg-[#e1e1e1] mt-[30px] mb-[30px]" />
                        <div
                            className="flex item-center justify-center hover:cursor-pointer"
                            onClick={handleGoogleSignIn}
                        >
                            <Image
                                src="/images/google.svg"
                                alt="googleIcon"
                                width={30}
                                height={30}
                            />
                            <h2 className="ml-[13px] text-[18px]">
                                Sign in with Google
                            </h2>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Form;
