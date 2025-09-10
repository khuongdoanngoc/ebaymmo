import { Geist, Geist_Mono } from 'next/font/google';
import '@/app/globals.css';
const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin']
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin']
});

export default function AuthLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div
            className={`${geistSans.variable} ${geistMono.variable}  w-full flex  justify-center antialiased bg-gradient-to-tr from-[#EDFDF1] to-[#FFFFFF] min-h-screen`}
        >
            <div className="w-full max-w-[1200px] mx-auto flex  justify-center ">
                {children}
            </div>
        </div>
    );
}
