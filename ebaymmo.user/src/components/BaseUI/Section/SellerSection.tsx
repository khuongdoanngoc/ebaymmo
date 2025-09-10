'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import SidebarItemLink from '../Sidebar/SidebarItemLink';
import { useUserInfo } from '@/contexts/UserInfoContext';

export default function SellerSection({
    children
}: {
    children: React.ReactNode;
}) {
    const { userInfo } = useUserInfo();
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const locate = useLocale();
    const [activeLink, setActiveLink] = useState(
        ' `/${locate}/seller/dashboard`'
    );
    const { data: session, status } = useSession();
    const t = useTranslations('seller');
    const menuItems = [
        {
            title: t('nav.dashboard'),
            url: `/${locate}/seller/dashboard`,
            img: '/images/seller/dashboard.svg'
        },
        {
            title: t('nav.store-management'),
            url: `/${locate}/seller/store-management`,
            img: '/images/seller/store.svg'
        },
        {
            title: t('nav.productOrders'),
            url: `/${locate}/seller/product-orders`,
            img: '/images/seller/product-orders.svg'
        },
        {
            title: t('nav.serviceOrders'),
            url: `/${locate}/seller/service-orders`,
            img: '/images/seller/service.svg'
        },
        {
            title: t('nav.pre-orders'),
            url: `/${locate}/seller/pre-orders`,
            img: '/images/seller/pre-orders.svg'
        },
        {
            title: t('nav.complaint'),
            url: `/${locate}/seller/complaints`,
            img: '/images/seller/complaints.svg'
        },
        {
            title: t('nav.top-stores'),
            url: `/${locate}/seller/top-store`,
            img: '/images/seller/top-store.svg'
        },
        {
            title: t('nav.reseller-list'),
            url: `/${locate}/seller/reseller-list`,
            img: '/images/seller/reseller.svg'
        },
        {
            title: t('nav.reviews'),
            url: `/${locate}/seller/reviews`,
            img: '/images/seller/reviews.svg'
        },
        {
            title: t('nav.discount-codes'),
            url: `/${locate}/seller/discount-codes`,
            img: '/images/seller/discount.svg'
        }
    ];

    const handleLogout = async () => {
        try {
            await signOut({
                redirect: true,
                callbackUrl: '/login'
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Thêm hàm xử lý click menu item
    const handleMenuItemClick = (url: string) => {
        setActiveLink(url);
        router.push(url);
        if (isMobile) {
            setIsCollapsed(true);
        }
    };

    useEffect(() => {
        if (status === 'loading') return;
        if (!session) {
            router.push('/login');
        }
    }, [session, status, router]);

    // Check for mobile screen size
    useEffect(() => {
        const checkIsMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkIsMobile();
        window.addEventListener('resize', checkIsMobile);

        return () => {
            window.removeEventListener('resize', checkIsMobile);
        };
    }, []);

    useEffect(() => {
        const pathName =
            `/${locate}/seller/${window?.location?.pathname?.split('/')?.[3]}` ||
            `/${locate}/seller/dashboard`;
        setActiveLink(pathName);
    }, []);

    return (
        <section className="section-user-1 md:pr-0 lg:pl-[24px] lg:pr-[24px] md:mt-[20px] mt-[40px] md:mb-[20px] mb-[40px]">
            <div className="container max-w-[1420px] mx-auto font-beausans flex flex-col items-start gap-[40px] mt-[40px] md:mt-[80px]">
                {/* Mobile Header - always visible on mobile */}
                {isMobile && (
                    <div className="mobile-header w-full flex justify-between items-center">
                        <h1 className="text-title text-[25px] font-bold leading-[1.4] text-[#3F3F3F]">
                            {t('title')}
                        </h1>
                        <button
                            className="button-trans p-2"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            <Image
                                src="/images/toggle.svg"
                                alt=""
                                width={28}
                                height={28}
                                className={`w-7 h-7 max-w-20  ${
                                    isCollapsed ? 'rotate-180' : 'rotate-0'
                                }`}
                            />
                        </button>
                    </div>
                )}

                {/* Desktop Header - only on desktop */}
                {!isMobile && (
                    <h1 className="text-title text-[30px] md:text-[35px] lg:text-[40px] font-bold leading-[1.4] text-[#3F3F3F]">
                        {t('title')}
                    </h1>
                )}

                <div className="main-container flex gap-[50px] flex-col md:flex-row w-full">
                    {/* Desktop Sidebar */}
                    {!isMobile && (
                        <div
                            className={`left-nav-wrapper flex-shrink-0 flex flex-col gap-[20px] transition-all duration-700 ease-in-out ${
                                isCollapsed ? 'lg:!w-[100px]' : 'lg:w-[280px]'
                            }`}
                        >
                            <div className="row-between flex justify-between items-center self-stretch overflow-hidden">
                                <div className="flex items-center w-[150px] overflow-hidden">
                                    {isCollapsed ? (
                                        <Image
                                            src={
                                                userInfo?.images ||
                                                '/images/avatar.svg'
                                            }
                                            alt="Seller Avatar"
                                            width={40}
                                            height={40}
                                            className="rounded-full animate-slideInSlow"
                                        />
                                    ) : (
                                        <span className="text-[18px] font-bold leading-[28.8px] text-[#3F3F3F] animate-slideInSlow whitespace-nowrap opacity-100">
                                            {t('nav.title')}
                                        </span>
                                    )}
                                </div>
                                <button
                                    className="button-trans p-2"
                                    onClick={() => setIsCollapsed(!isCollapsed)}
                                >
                                    <Image
                                        src="/images/toggle.svg"
                                        alt=""
                                        width={28}
                                        height={28}
                                        className={`w-7 h-7 max-w-20 ${
                                            isCollapsed
                                                ? 'rotate-180'
                                                : 'rotate-0'
                                        }`}
                                    />
                                </button>
                            </div>

                            <hr className="user-devider w-full min-h-[1px] h-[1px] bg-neutral-100 border-none" />

                            {/* Menu Items */}
                            <div className="left-nav-container flex flex-col gap-[20px]">
                                {menuItems.map((item, index) => (
                                    <div
                                        key={item.url}
                                        className={'animate-menuItem'}
                                        style={{
                                            animationDelay: `${index * 100}ms`
                                        }}
                                    >
                                        <SidebarItemLink
                                            key={item.url}
                                            titleLink={item.title}
                                            imageLink={item.img}
                                            isCollapsed={isCollapsed}
                                            url={item.url}
                                            isActive={activeLink === item.url}
                                            onClick={() =>
                                                handleMenuItemClick(item.url)
                                            }
                                        />
                                    </div>
                                ))}
                                <div className="left-nav-item">
                                    <SidebarItemLink
                                        key="logout"
                                        titleLink={t('nav.logout')}
                                        imageLink="/images/logout.svg"
                                        isCollapsed={isCollapsed}
                                        url="logout"
                                        isActive={activeLink === 'logout'}
                                        onClick={handleLogout}
                                    />
                                </div>
                            </div>

                            <hr className="user-devider w-full min-h-[1px] h-[1px] bg-neutral-100 border-none" />
                        </div>
                    )}

                    {/* Mobile Drawer - full height vertical drawer */}
                    {isMobile && (
                        <div
                            className={`mobile-drawer fixed top-0 left-0 w-[80vw] h-screen bg-white shadow-lg z-50 overflow-y-auto transition-transform duration-300 ease-in-out pt-[80px] ${
                                isCollapsed
                                    ? 'translate-x-[-100%]'
                                    : 'translate-x-0'
                            }`}
                        >
                            <div className="mobile-drawer-content p-4 flex flex-col gap-[20px]">
                                <div className="flex items-center">
                                    <Image
                                        src={
                                            userInfo?.images ||
                                            '/images/avatar.svg'
                                        }
                                        alt="Seller Avatar"
                                        width={40}
                                        height={40}
                                        className="rounded-full mr-3"
                                    />
                                    <span className="text-[18px] font-bold leading-[28.8px] text-[#3F3F3F]">
                                        {t('nav.title')}
                                    </span>
                                </div>

                                <hr className="user-devider w-full min-h-[1px] h-[1px] bg-neutral-100 border-none" />

                                {/* Mobile Menu Items */}
                                <div className="left-nav-container flex flex-col gap-[20px]">
                                    {menuItems.map((item, index) => (
                                        <div
                                            key={item.url}
                                            className={'animate-menuItem'}
                                            style={{
                                                animationDelay: `${index * 50}ms`
                                            }}
                                        >
                                            <SidebarItemLink
                                                key={item.url}
                                                titleLink={item.title}
                                                imageLink={item.img}
                                                isCollapsed={false}
                                                url={item.url}
                                                isActive={
                                                    activeLink === item.url
                                                }
                                                onClick={() =>
                                                    handleMenuItemClick(
                                                        item.url
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}
                                    <div className="left-nav-item">
                                        <SidebarItemLink
                                            key="logout"
                                            titleLink={t('nav.logout')}
                                            imageLink="/images/logout.svg"
                                            isCollapsed={isCollapsed}
                                            url="#"
                                            isActive={false}
                                            onClick={handleLogout}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Backdrop overlay for mobile drawer */}
                    {isMobile && !isCollapsed && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-40"
                            onClick={() => setIsCollapsed(true)}
                        />
                    )}

                    <div
                        className={`right-content-wrapper flex-1 flex-shrink-0 transition-all duration-700 ease-in-out ${
                            isCollapsed
                                ? 'md:max-w-[calc(55vw+180px)]'
                                : 'md:max-w-[55vw] '
                        } md:w-full`}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </section>
    );
}
