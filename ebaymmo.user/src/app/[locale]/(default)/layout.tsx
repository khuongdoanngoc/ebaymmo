import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../../globals.css';
import Header from './_components/Header';
import Footer from './_components/Footer';
import HeaderMenuDropdown from './_components/HeaderMenuDropdown';
import { SessionProvider } from 'next-auth/react';
import BubbleIcons from './_components/BubbleIcons';
import { NextIntlClientProvider, createTranslator } from 'next-intl';
import { notFound } from 'next/navigation';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin']
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin']
});

// Define supported locales
const locales = ['en', 'vi', 'ru', 'zh'] as const;

async function getMessages(locale: string) {
    try {
        return (await import(`../../../messages/${locale}.json`)).default;
    } catch (error) {
        return (await import('../../../messages/en.json')).default;
    }
}

export default async function DefaultLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params?: Promise<{ locale: string }> | { locale: string }; // Hỗ trợ cả Promise và object thông thường
}) {
    // Mặc định locale là 'en' nếu params không tồn tại
    let locale = 'en';

    // Kiểm tra và await params nếu nó là một Promise
    if (params && 'then' in params) {
        const resolvedParams = await params;
        locale = resolvedParams?.locale ?? 'en';
    } else if (params && 'locale' in params) {
        locale = params.locale;
    }

    // Kiểm tra nếu locale không hợp lệ
    if (!locales.includes(locale as any)) {
        notFound();
    }

    const messages = await getMessages(locale);

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <SessionProvider refetchInterval={15 * 60}>
                <div
                    className={`${geistSans.variable} ${geistMono.variable} font-beausans antialiased`}
                >
                    <Header />
                    <HeaderMenuDropdown />
                    {children}
                    <Footer />
                    <BubbleIcons />
                </div>
            </SessionProvider>
        </NextIntlClientProvider>
    );
}
