'use client';
import React, { Suspense, memo, useMemo } from 'react';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUserInfo } from '@/contexts/UserInfoContext';
import { useLocale, useTranslations } from 'next-intl';

const HeaderMenuDropdown = () => {
    const t = useTranslations('HeaderMenuDropdown');

    const menuDropdownItems = [
        {
            category: 'products',
            items: [
                {
                    href: '/products?type=product&category=email',
                    imgSrc: '/images/sp2.svg',
                    alt: 'email',
                    label: t('Email')
                },
                {
                    href: '/products?type=product&category=software',
                    imgSrc: '/images/product-03.svg',
                    alt: 'software',
                    label: t('Software')
                },
                {
                    href: '/products?type=product&category=account',
                    imgSrc: '/images/product-04.svg',
                    alt: 'account',
                    label: t('Account')
                },
                {
                    href: '/products?type=product&category=other-products',
                    imgSrc: '/images/product-05.svg',
                    alt: 'other-products',
                    label: t('Other')
                }
            ]
        },
        {
            category: 'services',
            items: [
                {
                    href: '/products?type=service&category=increase-engagement',
                    imgSrc: '/images/envelope-06.svg',
                    alt: 'increase-interaction',
                    label: t('Increase Interaction')
                },
                {
                    href: '/products?type=service&category=software-services',
                    imgSrc: '/images/envelope-07.svg',
                    alt: 'software-service',
                    label: t('Software Service')
                },
                {
                    href: '/products?type=service&category=blockchain',
                    imgSrc: '/images/envelope-08.svg',
                    alt: 'blockchain',
                    label: t('Blockchain')
                },
                {
                    href: '/products?type=service&category=other-services',
                    imgSrc: '/images/envelope-09.svg',
                    alt: 'other-service',
                    label: t('Other Services')
                }
            ]
        },
        {
            category: 'tool',
            items: [
                {
                    href: '/2fa',
                    imgSrc: '/images/2fa.svg',
                    alt: '2fa',
                    label: t('2Fa')
                },
                {
                    href: '/check-live-facebook',
                    imgSrc: '/images/2fa.svg',
                    alt: 'checklivefb',
                    label: 'Check Live Facebook'
                }
            ]
        }
    ];
    const { userInfo } = useUserInfo();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const query = Object.fromEntries(searchParams.entries());

    // Memoize the menu item classes to prevent unnecessary recalculations
    const menuItemClasses = useMemo(
        () =>
            'flex items-center py-[17px] gap-x-[7px] cursor-pointer relative before:absolute before:bottom-0 before:left-0 before:h-[4px] before:bg-green_main before:transition-all before:duration-300 before:ease-in-out group',
        []
    );

    const activeClasses = useMemo(() => 'before:w-full', []);
    const inactiveClasses = useMemo(() => 'before:w-0 hover:before:w-full', []);

    return (
        <section className="shadow-lg hidden w-full lg:flex lg:justify-center lg:items-center">
            <div className="px-36 lg:w-full max-w-[1800px] lg:flex lg:items-center lg:justify-between container flex items-center justify-between text-green_main text-lg font-medium gap-x-auto w-auto">
                <div className="sub-header-left">
                    <ul className="flex gap-x-[45px]">
                        <li
                            className={`${menuItemClasses} ${
                                pathname?.startsWith('/products') &&
                                query.type === 'product'
                                    ? activeClasses
                                    : inactiveClasses
                            } group`}
                        >
                            <Link
                                className="flex items-center gap-x-[7px] cursor-pointer relative"
                                href="/products?type=product"
                            >
                                <span>{t('products')}</span>
                                <Image
                                    src="/images/down.svg"
                                    alt="product"
                                    width={20}
                                    height={20}
                                    className={
                                        'transition-transform duration-300'
                                    }
                                />
                            </Link>
                            {/* menu dropdown */}
                            <div className="absolute top-[62px] left-0 min-w-[210px] bg-white border border-gray-200 rounded-b-[7px] shadow-lg z-50 hidden group-hover:block">
                                <ul className="px-[7px] py-[7px]">
                                    {menuDropdownItems[0].items.map((item) => (
                                        <Link key={item.label} href={item.href}>
                                            <li className="li-item-dropdown">
                                                <div className="menu-item-dropdown">
                                                    <Image
                                                        src={item.imgSrc}
                                                        alt={item.alt}
                                                        width={20}
                                                        height={20}
                                                    />
                                                    <span>{item.label}</span>
                                                </div>
                                                <Image
                                                    src="/images/arrow-forward.svg"
                                                    alt="product"
                                                    className="cursor-pointer w-[20px] h-[20px] hidden"
                                                    width={20}
                                                    height={20}
                                                />
                                            </li>
                                        </Link>
                                    ))}
                                </ul>
                            </div>
                        </li>
                        <li
                            className={`${menuItemClasses} ${
                                pathname?.startsWith('/products') &&
                                query.type === 'service'
                                    ? activeClasses
                                    : inactiveClasses
                            } group`}
                        >
                            <Link
                                className="flex items-center gap-x-[7px] cursor-pointer relative"
                                href="/products?type=service"
                            >
                                <span>{t('services')}</span>
                                <Image
                                    src="/images/down.svg"
                                    alt="service"
                                    width={20}
                                    height={20}
                                />
                            </Link>
                            <div className="absolute top-[62px] left-0 min-w-[286px] bg-white border border-gray-200 rounded-b-[7px] shadow-lg z-50 hidden group-hover:block">
                                <ul className="px-[7px] py-[7px]">
                                    {menuDropdownItems[1].items.map((item) => (
                                        <Link key={item.label} href={item.href}>
                                            <li className="li-item-dropdown">
                                                <div className="menu-item-dropdown">
                                                    <Image
                                                        src={item.imgSrc}
                                                        alt={item.alt}
                                                        width={20}
                                                        height={20}
                                                    />
                                                    <span>{item.label}</span>
                                                </div>
                                                <Image
                                                    src="/images/arrow-forward.svg"
                                                    alt="product"
                                                    className="cursor-pointer w-[20px] h-[20px] hidden"
                                                    width={20}
                                                    height={20}
                                                />
                                            </li>
                                        </Link>
                                    ))}
                                </ul>
                            </div>
                        </li>
                        <li
                            className={`${menuItemClasses} ${
                                pathname?.startsWith('/2fa') ||
                                pathname?.startsWith('/faqs')
                                    ? activeClasses
                                    : inactiveClasses
                            } group`}
                        >
                            <span>{t('support')}</span>
                            <Image
                                src="/images/down.svg"
                                alt="support"
                                width={20}
                                height={20}
                            />
                            <div className="absolute top-[62px] left-0 min-w-[210px] bg-white border border-gray-200 rounded-b-[7px] shadow-lg z-50 hidden group-hover:block">
                                <ul className="px-[7px] py-[7px]">
                                    <Link href="/contacts">
                                        <li className="li-item-dropdown">
                                            <div className="menu-item-dropdown">
                                                <Image
                                                    src="/images/account.svg"
                                                    alt="contact"
                                                    width={20}
                                                    height={20}
                                                />
                                                <span>{t('Contact')}</span>
                                            </div>
                                            <Image
                                                src="/images/arrow-forward.svg"
                                                alt="product"
                                                className="cursor-pointer w-[20px] h-[20px] hidden"
                                                width={20}
                                                height={20}
                                            />
                                        </li>
                                    </Link>
                                    <Link href="/faqs">
                                        <li className="li-item-dropdown">
                                            <div className="menu-item-dropdown">
                                                <Image
                                                    src="/images/2fa.svg"
                                                    alt="faqs"
                                                    width={20}
                                                    height={20}
                                                />
                                                <span>{t('FAQs')}</span>
                                            </div>
                                            <Image
                                                src="/images/arrow-forward.svg"
                                                alt="product"
                                                className="cursor-pointer w-[20px] h-[20px] hidden"
                                                width={20}
                                                height={20}
                                            />
                                        </li>
                                    </Link>
                                </ul>
                            </div>
                        </li>
                        <li
                            className={`${menuItemClasses} ${
                                pathname?.startsWith('/tool') ||
                                pathname?.startsWith('/2fa') ||
                                pathname?.startsWith('/check-live-facebook')
                                    ? activeClasses
                                    : inactiveClasses
                            } group`}
                        >
                            <span>Tool</span>
                            <Image
                                src="/images/down.svg"
                                alt="tool"
                                width={20}
                                height={20}
                            />
                            <div className="absolute top-[62px] left-0 min-w-[210px] bg-white border border-gray-200 rounded-b-[7px] shadow-lg z-50 hidden group-hover:block">
                                <ul className="px-[7px] py-[7px]">
                                    <Link href="/2fa">
                                        <li className="li-item-dropdown">
                                            <div className="menu-item-dropdown">
                                                <Image
                                                    src="/images/2fa.svg"
                                                    alt="2fa"
                                                    width={20}
                                                    height={20}
                                                />
                                                <span>{t('2Fa')}</span>
                                            </div>
                                            <Image
                                                src="/images/arrow-forward.svg"
                                                alt="product"
                                                className="cursor-pointer w-[20px] h-[20px] hidden"
                                                width={20}
                                                height={20}
                                            />
                                        </li>
                                    </Link>
                                    <Link href="/check-live-facebook">
                                        <li className="li-item-dropdown">
                                            <div className="menu-item-dropdown">
                                                <Image
                                                    src="/images/2fa.svg"
                                                    alt="checklivefb"
                                                    width={20}
                                                    height={20}
                                                />
                                                <span>Check Live Facebook</span>
                                            </div>
                                            <Image
                                                src="/images/arrow-forward.svg"
                                                alt="product"
                                                className="cursor-pointer w-[20px] h-[20px] hidden"
                                                width={20}
                                                height={20}
                                            />
                                        </li>
                                    </Link>
                                </ul>
                            </div>
                        </li>
                        <li
                            className={`${menuItemClasses} ${
                                pathname?.startsWith('/shares')
                                    ? activeClasses
                                    : inactiveClasses
                            }`}
                        >
                            <Link href="/shares?tag=">{t('share')}</Link>
                        </li>
                        <li
                            className={`${menuItemClasses} ${
                                pathname?.startsWith('/favorite-stores')
                                    ? activeClasses
                                    : inactiveClasses
                            }`}
                        >
                            <Link href="/favorite-stores">
                                {t('favoriteStore')}
                            </Link>
                        </li>
                        <li
                            className={`${menuItemClasses} ${
                                pathname?.startsWith('/contacts')
                                    ? activeClasses
                                    : inactiveClasses
                            }`}
                        >
                            <Link href="/contacts">{t('Contact')}</Link>
                        </li>
                    </ul>
                </div>
                <div className="sub-header-right ml-auto flex items-center gap-x-[5px]">
                    {!userInfo?.sellerSince ? (
                        <Link
                            href="/sale-registration"
                            className="flex items-center gap-x-[5px] cursor-pointer"
                        >
                            <Image
                                src="/images/register-seller.svg"
                                alt="regiser"
                                width={20}
                                height={20}
                            />
                            <span>{t('register seller')}</span>
                        </Link>
                    ) : (
                        <div className="bg-primary-100 text-primary-600 px-3 py-1 rounded-md font-medium text-sm flex items-center">
                            <span className="flex items-center gap-x-[5px]">
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                {t('seller')}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

// Memoize the component to prevent unnecessary re-renders
const MemoizedHeaderMenuDropdown = memo(HeaderMenuDropdown);

// Add this new component above HeaderMenuDropdownPage
const HeaderSkeleton = () => {
    return (
        <div className="shadow-lg w-full h-[62px] bg-gray-100 animate-pulse">
            <div className="px-36 h-full flex items-center">
                <div className="flex gap-x-[45px]">
                    {[...Array(6)].map((_, index) => (
                        <div
                            key={index}
                            className="h-4 w-24 bg-gray-200 rounded"
                        />
                    ))}
                </div>
                <div className="ml-auto">
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                </div>
            </div>
        </div>
    );
};

export default function HeaderMenuDropdownPage() {
    return (
        <Suspense fallback={<HeaderSkeleton />}>
            <MemoizedHeaderMenuDropdown />
        </Suspense>
    );
}
