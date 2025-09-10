import { Metadata } from 'next';
import HomePageClient from './HomePageClient';
import { Suspense } from 'react';

export async function generateMetadata(): Promise<Metadata> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    try {
        return {
            title: 'EBAYMMO - Buy & Sell Digital Products Securely',
            description:
                'EBAYMMO is your trusted marketplace for digital products. Buy and sell with confidence, backed by secure blockchain technology.',
            alternates: {
                canonical: '/'
            },
            other: {
                'slack-card-type': 'summary_large_image'
            },
            openGraph: {
                type: 'website',
                locale: 'en_US',
                title: 'EBAYMMO - Buy & Sell Digital Products Securely',
                description:
                    'EBAYMMO is your trusted marketplace for digital products. Buy and sell with confidence, backed by secure blockchain technology.',
                url: `${baseUrl}/`,
                images: [
                    {
                        url: `${baseUrl}/images/logo.png`,
                        width: 1200,
                        height: 630,
                        alt: 'EBAYMMO Marketplace',
                        type: 'image/png',
                        secureUrl: `${baseUrl}/images/logo.png`
                    }
                ],
                siteName: 'EBAYMMO'
            },
            twitter: {
                card: 'summary_large_image',
                title: 'EBAYMMO - Buy & Sell Digital Products Securely',
                description:
                    'EBAYMMO is your trusted marketplace for digital products. Buy and sell with confidence, backed by secure blockchain technology.',
                images: [`${baseUrl}/images/logo.png`],
                site: '@ebaymmo' // Thay thế bằng username Twitter của bạn nếu có
            },
            keywords:
                'digital marketplace, online marketplace, buy digital products, sell digital products, secure marketplace'
        };
    } catch (error) {
        console.error('Error generating homepage metadata:', error);
        return {
            title: 'EBAYMMO Marketplace',
            description: 'Buy and sell digital products securely'
        };
    }
}

export default function HomePage() {
    return (
        <section className="w-full">
            <Suspense fallback={<div>Loading...</div>}>
                <HomePageClient />
            </Suspense>
        </section>
    );
}
