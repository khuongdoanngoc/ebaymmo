import { Metadata } from 'next';
import ProductsPageClient from './ProductsPageClient';
import { Suspense } from 'react';
import adminSDK from '@/adminSDK';

export async function generateMetadata({
    searchParams
}: {
    searchParams: { category?: string; type?: string };
}): Promise<Metadata> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    try {
        // Get category from searchParams
        const { category, type = 'product' } = searchParams;

        // Default metadata (when no category is selected)
        let title = 'All Products - EBAYMMO Marketplace';
        let description =
            'Browse all digital products on EBAYMMO. Find secure, high-quality digital goods from trusted sellers.';
        let categoryName = '';

        // If category is specified, get category details
        if (category) {
            try {
                // Get category info from database
                const { categories } = await adminSDK.GetCategories({
                    where: {
                        slug: {
                            _eq: category
                        }
                    }
                });

                if (categories && categories.length > 0) {
                    categoryName = categories[0].categoryName || '';
                    title = `${categoryName} - EBAYMMO Marketplace`;
                    description = `Browse ${categoryName} products on EBAYMMO. Find secure, high-quality ${categoryName.toLowerCase()} from trusted sellers.`;
                }
            } catch (error) {
                console.error('Error fetching category details:', error);
            }
        }

        // Include product type in title/description if it's not the default
        const typeValue = type || 'product';
        if (typeValue.toLowerCase() !== 'product') {
            const typeCapitalized =
                typeValue.charAt(0).toUpperCase() +
                typeValue.slice(1).toLowerCase();
            title = category
                ? `${categoryName} ${typeCapitalized} - EBAYMMO Marketplace`
                : `All ${typeCapitalized} - EBAYMMO Marketplace`;

            description = category
                ? `Browse ${categoryName} ${typeValue.toLowerCase()} on EBAYMMO. Find secure, high-quality ${categoryName.toLowerCase()} ${typeValue.toLowerCase()} from trusted sellers.`
                : `Browse all ${typeValue.toLowerCase()} on EBAYMMO. Find secure, high-quality ${typeValue.toLowerCase()} from trusted sellers.`;
        }

        const categoryQuery = category ? `?category=${category}` : '';
        const typeQuery =
            typeValue !== 'product'
                ? `${categoryQuery ? '&' : '?'}type=${typeValue}`
                : '';
        const fullPath = `/products${categoryQuery}${typeQuery}`;

        return {
            title,
            description,
            alternates: {
                canonical: fullPath
            },
            other: {
                'slack-card-type': 'summary_large_image'
            },
            openGraph: {
                type: 'website',
                locale: 'en_US',
                title,
                description,
                url: `${baseUrl}${fullPath}`,
                siteName: 'EBAYMMO',
                images: [
                    {
                        url: `${baseUrl}/images/logo.png`,
                        width: 1200,
                        height: 630,
                        alt: 'EBAYMMO Marketplace',
                        type: 'image/png',
                        secureUrl: `${baseUrl}/images/logo.png`
                    }
                ]
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: [`${baseUrl}/images/logo.png`],
                creator: '@ebaymmo'
            },
            keywords: `${categoryName ? categoryName + ',' : ''} digital products, marketplace, secure trading, ${typeValue}, EBAYMMO`
        };
    } catch (error) {
        console.error('Error generating products page metadata:', error);
        return {
            title: 'Products - EBAYMMO Marketplace',
            description: 'Browse our selection of digital products on EBAYMMO.'
        };
    }
}

export default function ProductsPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProductsPageClient />
        </Suspense>
    );
}
