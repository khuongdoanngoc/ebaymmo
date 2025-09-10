import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../../globals.css';
import Header from '../(default)/_components/Header';
import Footer from '../(default)/_components/Footer';
import HeaderMenuDropdown from '../(default)/_components/HeaderMenuDropdown';
import { SessionProvider } from 'next-auth/react';
import BubbleIcons from '../(default)/_components/BubbleIcons';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import AccountLayoutClient from './AccountLayoutClient';

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

export default async function AccountLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params?: Promise<{ locale: string }> | { locale: string };
}) {
    // Default locale is 'en' if params doesn't exist
    let locale = 'en';

    // Check and await params if it's a Promise
    if (params && 'then' in params) {
        const resolvedParams = await params;
        locale = resolvedParams?.locale ?? 'en';
    } else if (params && 'locale' in params) {
        locale = params.locale;
    }

    // Check if locale is valid
    if (!locales.includes(locale as any)) {
        notFound();
    }

    const messages = await getMessages(locale);

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <SessionProvider refetchInterval={5 * 60}>
                {/* Kiểm tra mỗi 5 phút */}
                <div
                    className={`${geistSans.variable} ${geistMono.variable} font-beausans antialiased`}
                >
                    <AccountLayoutClient>{children}</AccountLayoutClient>
                </div>
            </SessionProvider>
        </NextIntlClientProvider>
    );
}
