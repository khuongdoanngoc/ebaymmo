import { Metadata } from 'next';
import adminSDK from '@/adminSDK';
import ImageDefault from '@images/telegram-green.svg';
import ProductDetailWrapper from './ProductDetailWrapper';

export async function generateMetadata({
    params
}: {
    params: { product: string };
}): Promise<Metadata> {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    try {
        const { product } = params;
        const { storeDetails } = await adminSDK.GetStoredetail({
            where: {
                slug: {
                    _eq: product
                }
            }
        });

        if (!storeDetails || storeDetails.length === 0) {
            return {
                title: 'Store Not Found - EBAYMMO',
                description: 'The requested store could not be found.'
            };
        }

        const store = storeDetails[0];
        const storeUrl = `/products/${store.slug || product}`;

        return {
            title: `${store.storeName || 'Store'} - EBAYMMO`,
            description:
                store.shortDescription ||
                `Visit ${store.storeName || 'our store'} on EBAYMMO`,
            alternates: {
                canonical: storeUrl
            },
            other: {
                'slack-card-type': 'summary_large_image'
            },
            openGraph: {
                type: 'website',
                locale: 'en_US',
                title: store.storeName || 'EBAYMMO Store',
                description:
                    store.shortDescription ||
                    `Visit ${store.storeName || 'our store'} on EBAYMMO`,
                url: `${baseUrl}${storeUrl}`,
                images: [
                    {
                        url: store.avatar
                            ? `${baseUrl}${store.avatar}`
                            : ImageDefault.src,
                        width: 1200,
                        height: 630,
                        alt: store.storeName || 'Store',
                        type: store.avatar?.endsWith('.png')
                            ? 'image/png'
                            : 'image/jpeg',
                        secureUrl: store.avatar
                            ? `${baseUrl}${store.avatar}`
                            : ImageDefault.src
                    }
                ],
                siteName: 'EBAYMMO'
            },
            twitter: {
                card: 'summary_large_image',
                title: store.storeName || 'EBAYMMO Store',
                description:
                    store.shortDescription ||
                    `Visit ${store.storeName || 'our store'} on EBAYMMO`,
                images: [
                    store.avatar
                        ? `${baseUrl}${store.avatar}`
                        : ImageDefault.src
                ],
                creator: '@ebaymmo'
            },
            keywords: `${store.storeName}, digital products, marketplace, secure trading, EBAYMMO`
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'EBAYMMO Store',
            description: 'Visit our stores on EBAYMMO'
        };
    }
}

export default async function ProductDetailPage({
    params
}: {
    params: { product: string };
}) {
    const { product } = params;
    const { storeDetails } = await adminSDK.GetStoredetail({
        where: {
            slug: {
                _eq: product
            }
        }
    });

    if (!storeDetails || storeDetails.length === 0) {
        return <div>Store not found</div>;
    }

    const store = storeDetails[0];

    return (
        <section className="w-full flex flex-col items-center">
            <div className="w-full max-w-[1800px] py-[50px] px-6 lg:px-32 2xl:px-36 flex flex-col justify-center">
                <ProductDetailWrapper store={store} />
            </div>
        </section>
    );
}
