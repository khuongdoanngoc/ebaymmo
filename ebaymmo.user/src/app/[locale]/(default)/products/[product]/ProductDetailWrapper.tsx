'use client';

import { useSearchParams } from 'next/navigation';
import { useApolloClient } from '@apollo/client';
import { useSession } from 'next-auth/react';
import { useEffect, useState, Suspense } from 'react';
import ProductDetailClient from './ProductDetailClient';
import ProductSkeleton from './ProductSkeleton';
import { handleStoreAccess } from '@/utils/storeAccess';

interface ProductDetailWrapperProps {
    store: any; // Replace with proper type from your GraphQL schema
}

export default function ProductDetailWrapper({
    store
}: ProductDetailWrapperProps) {
    const searchParams = useSearchParams();
    const referralCode = searchParams.get('ref');
    const client = useApolloClient();
    const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (referralCode) {
            localStorage.setItem('referralCode', referralCode);
        }
    }, [referralCode]);

    useEffect(() => {
        const logStoreViewAccess = async () => {
            if (store?.storeId) {
                try {
                    await handleStoreAccess(
                        client,
                        store.storeId,
                        session?.user?.id
                    );
                } catch (error) {
                    console.error(
                        '[ProductPage] Error in handleStoreAccess:',
                        error
                    );
                }
            }
            setIsLoading(false);
        };

        logStoreViewAccess();
    }, [store?.storeId, client, session?.user?.id]);

    if (isLoading) {
        return <ProductSkeleton />;
    }

    return (
        <Suspense fallback={<ProductSkeleton />}>
            <ProductDetailClient store={store} />
        </Suspense>
    );
}
