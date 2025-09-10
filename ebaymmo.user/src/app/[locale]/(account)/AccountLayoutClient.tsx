'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Header from '../(default)/_components/Header';
import HeaderMenuDropdown from '../(default)/_components/HeaderMenuDropdown';
import Footer from '../(default)/_components/Footer';
import UserSection from '@/components/BaseUI/Section/UserSection';
import SellerSection from '@/components/BaseUI/Section/SellerSection';
import { useGetUsersQuery } from '@/generated/graphql';
import { useLocale } from 'next-intl';

export default function AccountLayoutClient({
    children
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    const locale = useLocale();

    const { data: userData, loading: userDataLoading } = useGetUsersQuery({
        fetchPolicy: 'network-only',
        skip: !session?.user?.accessToken
    });

    const isSellerRole = userData?.users[0]?.sellerSince !== null;
    const isSellerPath = pathname?.startsWith(`/${locale}/seller`);

    useEffect(() => {
        // Wait for session to load
        if (status === 'loading') return;

        // If not logged in, redirect to login
        if (!session) {
            router.push('/login');
            return;
        }

        // If not a SELLER and trying to access /seller/*, redirect to home
        if (!userDataLoading && !isSellerRole && isSellerPath) {
            router.push('/');
            return;
        }
    }, [session, status, isSellerRole, router, isSellerPath, userDataLoading]);

    // Wait for session to load
    if (status === 'loading' || userDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900" />
            </div>
        );
    }

    // If not logged in, don't render anything
    if (!session) {
        return null;
    }

    const SectionComponent = isSellerPath ? SellerSection : UserSection;
    return (
        <>
            <Header />
            <HeaderMenuDropdown />
            <div className="mx-auto px-4 py-4 sm:px-6 sm:py-6 lg:px-8 w-full max-w-[1440px]">
                <SectionComponent>{children}</SectionComponent>
            </div>
            <Footer />
        </>
    );
}
