import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import localFont from 'next/font/local';
import Providers from '@/app/providers';
import Logo from '@images/cart.logo.svg';

const geistBeauSans = localFont({
    src: [
        {
            path: '../../public/fonts/BT Beau Sans/BT-BeauSans-Light.ttf',
            weight: '300',
            style: 'normal'
        },
        {
            path: '../../public/fonts/BT Beau Sans/BT-BeauSans-LightItalic.ttf',
            weight: '300',
            style: 'italic'
        },
        {
            path: '../../public/fonts/BT Beau Sans/BT-BeauSans-Regular.ttf',
            weight: '400',
            style: 'normal'
        },
        {
            path: '../../public/fonts/BT Beau Sans/BT-BeauSans-Italic.ttf',
            weight: '400',
            style: 'italic'
        },
        {
            path: '../../public/fonts/BT Beau Sans/BT-BeauSans-Medium.ttf',
            weight: '500',
            style: 'normal'
        },
        {
            path: '../../public/fonts/BT Beau Sans/BT-BeauSans-MediumItalic.ttf',
            weight: '500',
            style: 'italic'
        },
        {
            path: '../../public/fonts/BT Beau Sans/BT-BeauSans-Bold.ttf',
            weight: '700',
            style: 'normal'
        },
        {
            path: '../../public/fonts/BT Beau Sans/BT-BeauSans-BoldItalic.ttf',
            weight: '700',
            style: 'italic'
        },
        {
            path: '../../public/fonts/BT Beau Sans/BT-BeauSans-ExtraBold.ttf',
            weight: '800',
            style: 'normal'
        },
        {
            path: '../../public/fonts/BT Beau Sans/BT-BeauSans-ExtraBoldItalic.ttf',
            weight: '800',
            style: 'italic'
        }
    ],
    variable: '--font-beausans'
});

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin']
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin']
});

export const metadata: Metadata = {
    title: 'EbayMMO',
    description: 'EbayMMO',
    icons: {
        icon: Logo.src,
        shortcut: Logo.src,
        apple: Logo.src
    }
};

export default function RootLayout({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${geistBeauSans.variable} font-beausans antialiased`}
            >
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
