'use client';

import Link from 'next/link';
import React, { useEffect, useState, useRef } from 'react';
import DropdownAccount from './DropdownAccount';
import Image from 'next/image';
import MobileDrawer from './MobileDrawer';
import PopupLogin from '@/components/PopupLogin/PopupLogin';
import { signOut, useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import Modal from '@/components/BaseUI/Modal';
import Input from '@/components/BaseUI/Input';
import Button from '@/components/BaseUI/Button/button';
import RequestWithdrawModal from '@/components/Payment/RequestWithdrawModal';
import {
    useGetUsersQuery,
    useUserInfoSubscription,
    useInsertDepositeLogsMutation,
    useCreateDepositMutation
} from '@/generated/graphql';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import SearchBar from './SearchBar';
import dayjs from 'dayjs';
import { useUserInfo } from '@/contexts/UserInfoContext';
import { useLocale, useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export interface DropdownItem {
    icon: any;
    title: string;
    link: string;
}

const Header = () => {
    const { userInfo: userInfoContext } = useUserInfo();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLogin, setIsLogin] = useState(false);
    const [, setIsLanguageOpen] = useState(false);
    const [isWalletOpen, setIsWalletOpen] = useState(false);
    const [, setIsDepositOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);

    const { data: session, status } = useSession();
    const router = useRouter();
    const walletRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<HTMLDivElement>(null);
    const languageRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();
    const currentLocale = useLocale();
    const t = useTranslations('Header');
    const depositModalT = useTranslations('depositModal');

    const { data: userData } = useGetUsersQuery();

    const isSellerRole = userData?.users[0]?.sellerSince !== null;

    const handleCloseModal = () => {
        // Reset all states
        setIsModalOpen(false);
        setNetworkCode('');
        setAmount('');
        setNetworkError('');
        setAmountError('');
        setIsNetworkDropdownOpen(false);
    };

    useEffect(() => {
        if (status === 'loading') return; // Đợi NextAuth đang xử lý session
        if (!session) {
            setIsLogin(false);
        } else {
            setIsLogin(true);
        }
    }, [session, status, router]); // Empty dependency array means this runs once on mount

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                walletRef.current &&
                !walletRef.current.contains(event.target as Node)
            ) {
                setIsWalletOpen(false);
                setIsDepositOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                languageRef.current &&
                !languageRef.current.contains(event.target as Node)
            ) {
                setIsLanguageOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    // Tạo dropdown items dựa trên role
    const getDropdownItems = (): DropdownItem[] => {
        const baseItems: DropdownItem[] = [
            {
                title: t('addressBalance'),
                link: '/user/address-balance',
                icon: '/images/user/clipboard-03.svg'
            },
            {
                icon: '/images/user/person.svg',
                title: t('accountManagement'),
                link: '/user/accounts-management'
            },
            {
                icon: '/images/user/clipboard-01.svg',
                title: t('orderManagement'),
                link: '/user/order-managements'
            },
            {
                icon: '/images/transactionhistory.svg',
                title: t('transactionHistory'),
                link: '/user/transaction-history'
            },
            {
                icon: '/images/withdrawalhistory.svg',
                title: t('withdrawalHistory'),
                link: '/user/withdrawal-history'
            },
            {
                icon: '/images/deposit.svg',
                title: t('depositHistory'),
                link: '/user/deposit-history'
            },
            {
                icon: '/images/reseller.svg',
                title: t('resellerHistory'),
                link: '/user/reseller-history'
            },
            {
                icon: '/images/heartstore.svg',
                title: t('favoriteStore'),
                link: '/user/your-favourite-store'
            },
            {
                icon: '/images/content.svg',
                title: t('contentManagement'),
                link: '/user/content-management'
            }
        ];

        // Add Dashboard menu if user is a SELLER
        if (isSellerRole) {
            return [
                {
                    icon: '/images/seller/dashboard.svg',
                    title: t('dashboard'),
                    link: '/seller/dashboard'
                },
                ...baseItems
            ];
        }

        return baseItems;
    };

    const [amount, setAmount] = useState('');
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [statusType, setStatusType] = useState<'success' | 'error'>(
        'success'
    );

    const [networkCode, setNetworkCode] = useState('');
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
    const [networkError, setNetworkError] = useState('');
    const [amountError, setAmountError] = useState('');

    const networkOptions = [
        { value: 'BSC', label: 'Binance Smart Chain' },
        { value: 'ETH', label: 'Ethereum' },
        { value: 'ARB', label: 'Arbitrum' }
    ];

    const handleNetworkSelect = (value: string) => {
        setNetworkCode(value);
        setNetworkError('');
        setIsNetworkDropdownOpen(false);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAmount(value); // Luôn cập nhật giá trị input

        // Parse số để check các điều kiện khác
        const numValue = parseFloat(value);

        // Check số âm
        if (numValue < 0) {
            setAmountError('Amount cannot be negative');
            return;
        }

        // Check số 0
        if (numValue === 0) {
            setAmountError('Amount must be greater than 0');
            return;
        }

        // Xóa lỗi nếu input hợp lệ
        setAmountError('');
    };

    // Khai báo các hooks ở level component
    const [insertDeposit] = useInsertDepositeLogsMutation();
    const [createDeposit] = useCreateDepositMutation();

    // Add useEffect to check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768); // 768px là breakpoint cho mobile
        };

        checkMobile(); // Check on mount
        window.addEventListener('resize', checkMobile); // Check on resize

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleSubmit = async () => {
        try {
            // Validate tất cả required fields
            let hasError = false;

            if (!networkCode) {
                setNetworkError('Network Code is required');
                hasError = true;
            }

            if (!amount || amount.trim() === '') {
                setAmountError('Amount is required');
                hasError = true;
            }

            if (hasError) {
                return {
                    status: 'error',
                    message: 'Please fill in all required fields'
                };
            }

            // Validate số âm khi submit
            const numAmount = parseFloat(amount);
            if (numAmount < 0) {
                setAmountError('Amount cannot be negative');
                return {
                    status: 'error',
                    message: 'Amount cannot be negative'
                };
            }

            // Check if amount is valid number
            if (isNaN(numAmount)) {
                setAmountError('Amount must be a valid number');
                return {
                    status: 'error',
                    message: 'Amount must be a valid number'
                };
            }

            // Check if amount is positive
            if (numAmount <= 0) {
                setAmountError('Amount must be greater than 0');
                return {
                    status: 'error',
                    message: 'Amount must be greater than 0'
                };
            }

            // Optional: Add maximum amount limit if needed
            const MAX_AMOUNT = 10000; // Example max amount
            if (numAmount > MAX_AMOUNT) {
                setAmountError(`Amount cannot exceed ${MAX_AMOUNT}`);
                return {
                    status: 'error',
                    message: `Amount cannot exceed ${MAX_AMOUNT}`
                };
            }

            const result = await createDeposit({
                variables: {
                    networkCode: networkCode,
                    amount: numAmount,
                    urlCallback: process.env.NEXT_PUBLIC_URL_CALLBACK || '',
                    orderId: `ORDER${uuidv4().slice(0, 8)}`,
                    userId: session?.user.id || ''
                }
            });

            if (result.data?.createDeposit) {
                const transactionData = result.data.createDeposit;
                try {
                    await insertDeposit({
                        variables: {
                            object: {
                                amount: transactionData.amount,
                                createAt: dayjs().toISOString(),
                                depositStatus: 'pending',
                                transactionId: transactionData.transactionId,
                                updateAt: dayjs().toISOString(),
                                userId: session?.user.id,
                                description: `Deposit ${transactionData.amount} USDT via ${transactionData.paymentMethod.networkCode}`
                            }
                        }
                    });

                    const paymentUrl = `${process.env.NEXT_PUBLIC_BASEURL_PAYMENT}/${transactionData.transactionId}?callbackUrl=${process.env.NEXT_PUBLIC_URL_CALLBACK}`;

                    if (isMobile) {
                        setPaymentUrl(paymentUrl); // Lưu URL và hiện modal xác nhận trên mobile
                    } else {
                        window.open(paymentUrl, '_blank'); // Mở trực tiếp trên desktop
                    }

                    handleCloseModal();

                    return {
                        transactionId: transactionData.transactionId,
                        walletId: transactionData.walletId,
                        merchantId: transactionData.merchantId,
                        paymentMethodId: transactionData.paymentMethodId,
                        orderId: transactionData.orderId,
                        amount: transactionData.amount,
                        createdAt: transactionData.createdAt,
                        wallet: {
                            walletId: transactionData.wallet.walletId,
                            address: transactionData.wallet.address
                        },
                        paymentMethod: {
                            paymentMethodId:
                                transactionData.paymentMethod.paymentMethodId,
                            networkCode:
                                transactionData.paymentMethod.networkCode,
                            chainId: transactionData.paymentMethod.chainId,
                            vmType: transactionData.paymentMethod.vmType
                        },
                        qrUrl: transactionData.qrUrl,
                        urlCallback: transactionData.paymentPageUrl
                    };
                } catch (hasuraError) {
                    console.error(
                        '[Error inserting deposit into Hasura]:',
                        hasuraError
                    );
                    return {
                        status: 'error',
                        message: 'Failed to save transaction in database'
                    };
                }
            }

            return {
                status: 'error',
                message: 'Failed to create transaction'
            };
        } catch (error) {
            console.error('Deposit error:', error);
            return {
                status: 'error',
                message: 'Failed to create deposit transaction',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    };

    // Add useEffect for handling click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                networkRef.current &&
                !networkRef.current.contains(event.target as Node)
            ) {
                setIsNetworkDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Update subscription for user balance
    const { data: balanceData } = useUserInfoSubscription({
        variables: {
            userId: session?.user?.id || ''
        },
        skip: !session?.user?.id
    });

    const handleLanguageChange = (newLocale: string) => {
        setIsLanguageOpen(false);

        // Lấy đường dẫn hiện tại và loại bỏ locale cũ
        const pathSegments = pathname.split('/').filter(Boolean);
        const localeIndex = pathSegments.findIndex((seg) =>
            ['en', 'vi', 'ru', 'zh'].includes(seg)
        );
        const currentPath =
            localeIndex >= 0
                ? pathSegments.slice(localeIndex + 1).join('/')
                : pathname;

        // Tạo URL mới
        const newPath = `/${newLocale}/${currentPath || ''}`;

        // Điều hướng
        router.push(newPath);
    };

    // Thêm useEffect để theo dõi locale và đảm bảo nó được hiển thị đúng
    useEffect(() => {
        // Ghi log locale hiện tại khi component được mount hoặc locale thay đổi

        // Kiểm tra nếu URL hiện tại không khớp với locale
        const pathParts = window.location.pathname.split('/');
        if (
            pathParts.length >= 2 &&
            ['en', 'vi', 'ru', 'zh'].includes(pathParts[1]) &&
            pathParts[1] !== currentLocale
        ) {

            // Cập nhật URL nếu cần
            const newPath = window.location.pathname.replace(
                `/${pathParts[1]}/`,
                `/${currentLocale}/`
            );
            if (newPath !== window.location.pathname) {
                window.history.replaceState(null, '', newPath);
            }
        }
    }, [currentLocale]);

    // Sửa lại hàm getCurrentFlag để luôn hiển thị cờ đúng với locale hiện tại
    const getCurrentFlag = () => {
        switch (currentLocale) {
            case 'vi':
                return { src: '/images/flag-vn.png', label: 'Vietnamese Flag' };
            case 'ru':
                return { src: '/images/flag-rs.svg', label: 'Russian Flag' };
            case 'zh':
                return { src: '/images/flag-cn.svg', label: 'Chinese Flag' };
            default:
                return { src: '/images/flag-uk.svg', label: 'English Flag' };
        }
    };

    return (
        <header className="bg-main-gradio flex items-center justify-center w-full">
            <div className="flex items-center justify-center px-6 py-6 lg:px-36 lg:py-[25px] md:w-[100%] lg:max-w-[1800px]">
                <div className="flex flex-col gap-6 lg:gap-10 lg:flex-row w-full justify-between items-center ">
                    <div className="flex w-full lg:w-[70%] justify-between">
                        <div className="flex flex-col lg:flex-row w-full gap-10 justify-start">
                            <div className="flex w-full lg:w-fit justify-between">
                                <Link
                                    className="min-w-[176px] flex items-center justify-center lg:w-fit"
                                    href="/"
                                >
                                    <Image
                                        src="/images/ebay.logo.svg"
                                        alt="logo"
                                        width={176}
                                        height={38}
                                        className="w-[176px]"
                                    />
                                </Link>

                                <div className="lg:hidden flex items-center gap-4">
                                    <div className="block lg:hidden">
                                        <LanguageSwitcher />
                                    </div>
                                    <MobileDrawer />
                                </div>
                            </div>
                            <SearchBar />
                        </div>
                    </div>

                    {status == 'loading' ? (
                        <div className="w-[30%]" />
                    ) : (
                        <div className="right-info hidden lg:flex items-center w-[30%] justify-end gap-5">
                            {session ? (
                                <div className="hidden lg:flex items-center gap-4">
                                    {/* Wallet Icon & Balance Popup */}
                                    <div
                                        className="wallet lg:flex items-center relative w-[40px] h-[40px] bg-[#E8FFEF] rounded-[50%] cursor-pointer min-w-[40px]"
                                        ref={walletRef}
                                        onClick={() =>
                                            setIsWalletOpen(!isWalletOpen)
                                        }
                                    >
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center rounded-[50%]">
                                            <Image
                                                src="/images/wallet.svg"
                                                alt="wallet"
                                                width={24}
                                                height={24}
                                                className="w-[24px] h-[24px] flex-shrink-0 animate-scaleBounce"
                                            />
                                        </div>

                                        {isWalletOpen && (
                                            <div className="absolute top-[calc(100%+10px)] right-0 bg-white rounded-lg shadow-lg min-w-[280px] z-50 py-4 mt-[10px] transition-all duration-200">
                                                {/* Mũi tên chỉ lên */}
                                                <div className="absolute -top-2 right-6 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-b-white" />

                                                {/* Nội dung */}
                                                <div className="flex flex-col px-5 py-2">
                                                    {/* Balance Section - Centered */}
                                                    <div className="flex flex-col items-center mb-4">
                                                        <div className="flex items-center gap-10">
                                                            <div className="w-[40px] h-[40px] rounded-full bg-[#E8FFEF] border border-[#33A959] flex items-center justify-center overflow-hidden">
                                                                <div
                                                                    className="w-full h-full rounded-full bg-[#E8FFEF]"
                                                                    style={{
                                                                        backgroundImage: `url(${
                                                                            balanceData
                                                                                ?.usersByPk
                                                                                ?.images ||
                                                                            '/images/avatar.svg'
                                                                        })`,
                                                                        backgroundSize:
                                                                            'contain',
                                                                        backgroundPosition:
                                                                            'center',
                                                                        backgroundRepeat:
                                                                            'no-repeat'
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex flex-col text-center">
                                                                <span className="text-[22px] text-[#333] font-bold">
                                                                    {balanceData
                                                                        ?.usersByPk
                                                                        ?.balance ??
                                                                        71031}
                                                                </span>
                                                                <span className="text-[14px] text-[#6C6C6C]">
                                                                    USDT
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex flex-row gap-3">
                                                        <Button
                                                            onClick={() => {
                                                                setIsModalOpen(
                                                                    true
                                                                );
                                                                setIsWalletOpen(
                                                                    false
                                                                );
                                                            }}
                                                            className="flex-1 py-3 bg-[#33A959] text-white rounded-lg hover:bg-[#2d9850] transition-all duration-300 font-medium text-center shadow-md"
                                                        >
                                                            {t('deposit')}
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                setIsWithdrawModalOpen(
                                                                    true
                                                                );
                                                                setIsWalletOpen(
                                                                    false
                                                                );
                                                            }}
                                                            className="flex-1 py-3 bg-[#FF5C5C] text-white rounded-lg hover:bg-[#e04e4e] transition-all duration-300 font-medium text-center shadow-md"
                                                        >
                                                            {t('withdraw')}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                // Empty div to maintain layout when not logged in
                                <div className="hidden lg:block" />
                            )}
                            <div className="account-name flex items-center gap-2">
                                <DropdownAccount
                                    button={
                                        <div
                                            className="w-[40px] h-[40px] rounded-[82px] bg-[#ECF0F1] flex justify-center items-center cursor-pointer animate-scaleBounce"
                                            style={{
                                                backgroundImage: `url(${
                                                    userInfoContext?.images ||
                                                    '/images/avatar.svg'
                                                })`,
                                                backgroundSize: 'contain',
                                                backgroundPosition: 'center',
                                                backgroundRepeat: 'no-repeat'
                                            }}
                                        />
                                    }
                                    width={isLogin ? '242px' : '316px'}
                                    items={getDropdownItems()}
                                >
                                    {isLogin ? (
                                        <div>
                                            <ul
                                                className="text-sm flex flex-col gap-[5px] text-gray-700 z-[9999]"
                                                aria-labelledby="dropdownDefaultButton"
                                            >
                                                {getDropdownItems().map(
                                                    (item, index) => (
                                                        <li
                                                            key={index}
                                                            className="h-[30px] flex items-center px-2 w-full hover:bg-[#E8FFEF] rounded-[4px]"
                                                        >
                                                            <a
                                                                href={item.link}
                                                                className="flex gap-3 font-medium w-full leading-[160%] hover:bg-[#E8FFEF] "
                                                            >
                                                                <Image
                                                                    src={
                                                                        item.icon
                                                                    }
                                                                    width={20}
                                                                    height={20}
                                                                    alt="icon"
                                                                />
                                                                {item.title}
                                                            </a>
                                                        </li>
                                                    )
                                                )}
                                                {isSellerRole && (
                                                    <>
                                                        <hr />
                                                        <li>
                                                            <Link
                                                                href="/seller/store-management"
                                                                className="flex gap-3 h-[30px] px-2 items-center w-full font-medium leading-[160%] hover:bg-[#E8FFEF] rounded-[4px]"
                                                            >
                                                                <Image
                                                                    src="/images/user/clipboard-04.svg"
                                                                    width={20}
                                                                    height={20}
                                                                    alt="icon"
                                                                />
                                                                {t(
                                                                    'storeManagement'
                                                                )}
                                                            </Link>
                                                        </li>
                                                    </>
                                                )}
                                                <hr />
                                                <li>
                                                    <button
                                                        className="flex gap-3 h-[30px] px-2 items-center w-full font-medium leading-[160%] hover:bg-[#E8FFEF] rounded-[4px]"
                                                        onClick={handleLogout}
                                                    >
                                                        <Image
                                                            src="/images/user/login.1.svg"
                                                            width={20}
                                                            height={20}
                                                            alt="icon"
                                                        />
                                                        {t('logout')}
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    ) : (
                                        <div>
                                            <PopupLogin />
                                        </div>
                                    )}
                                </DropdownAccount>
                                <div className="hidden min-[1300px]:flex flex-col animate-slideIn">
                                    <span className="text-[#FFF] text-sm font-normal leading-relaxed text-[14px]">
                                        {session?.user?.name ? t('hello') : ''}
                                    </span>
                                    <span className="text-[#FFF] font-medium truncate leading-relaxed text-sm whitespace-nowrap">
                                        {session?.user?.name}
                                    </span>
                                </div>
                            </div>
                            <div className="hidden lg:block">
                                <LanguageSwitcher />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={depositModalT('title')}
                    noButton={true}
                    className="!w-[900px] h-[440px]"
                >
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[16px] text-[#3F3F3F]">
                                {depositModalT('walletAddress')}
                            </span>
                            <span className="text-[16px] text-[#3F3F3F]">
                                {depositModalT('balance')}:{' '}
                                {balanceData?.usersByPk?.balance} USDT
                            </span>
                        </div>

                        <div className="relative mt-2" ref={networkRef}>
                            <label
                                className={`absolute top-[-13px] left-3 bg-white px-2 font-medium leading-6 ${networkError ? 'text-red-500' : 'text-[#6C6C6C]'}`}
                            >
                                {t('networkCode')} *
                            </label>
                            <div
                                className={`w-full py-4 px-5 border rounded-[100px] bg-white cursor-pointer flex justify-between items-center hover:border-[#33A959] focus:border-[#33A959] transition-colors min-h-[56px] ${networkError ? 'border-red-500' : 'border-[#E0E0E0]'}`}
                                onClick={() =>
                                    setIsNetworkDropdownOpen(
                                        !isNetworkDropdownOpen
                                    )
                                }
                                style={{
                                    borderColor: networkError
                                        ? '#ff0000'
                                        : isNetworkDropdownOpen
                                          ? '#33A959'
                                          : '#E0E0E0'
                                }}
                            >
                                <span
                                    className={`text-left ${networkError ? 'text-red-500' : 'text-[#3F3F3F]'}`}
                                >
                                    {networkOptions.find(
                                        (opt) => opt.value === networkCode
                                    )?.label || t('selectNetwork')}
                                </span>
                                <Image
                                    src="/images/arrow-right.png"
                                    width={16}
                                    height={16}
                                    alt="arrow"
                                    className={`transition-transform duration-200 ${isNetworkDropdownOpen ? 'rotate-90' : ''}`}
                                />
                            </div>
                            {networkError && (
                                <span className="text-red-500 text-xs mt-1 block text-left">
                                    {networkError}
                                </span>
                            )}
                            {isNetworkDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#E0E0E0] rounded-[8px] shadow-lg z-50">
                                    {networkOptions.map((option) => (
                                        <div
                                            key={option.value}
                                            className="px-6 py-3 hover:bg-[#E8FFEF] cursor-pointer text-[#3F3F3F] text-left"
                                            onClick={() =>
                                                handleNetworkSelect(
                                                    option.value
                                                )
                                            }
                                        >
                                            {option.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <Input
                                type="number"
                                label={`${t('amount')} *`}
                                placeholder={t('enterDepositAmount')}
                                value={amount}
                                onChange={handleAmountChange}
                                error={!!amountError}
                                className="w-full bg-white"
                                rounded="rounded-[100px]"
                                labelClassName={`${amountError ? 'text-red-500' : 'text-[#6C6C6C]'}`}
                            />
                            {amountError && (
                                <span className="text-red-500 text-xs mt-1 block text-left">
                                    {amountError}
                                </span>
                            )}
                        </div>

                        <div className="flex justify-center mt-4">
                            <Button
                                colorScheme="green"
                                className="!px-8 !py-3 whitespace-nowrap"
                                width="180px"
                                onClick={handleSubmit}
                            >
                                {t('continue')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
            {isMobile && paymentUrl && (
                <Modal
                    isOpen={!!paymentUrl}
                    onClose={() => setPaymentUrl(null)}
                    title={depositModalT('paymentTitle')}
                    noButton={true}
                >
                    <div className="flex flex-col items-center gap-4 p-4">
                        <p className="text-center text-lg">
                            {depositModalT('paymentSuccess')}
                        </p>
                        <Button
                            onClick={() => {
                                window.open(paymentUrl, '_blank');
                                setPaymentUrl(null);
                            }}
                            className="w-full py-3 bg-[#33A959] text-white rounded-lg hover:bg-[#2d9850] transition-all duration-300 font-medium text-center shadow-md"
                        >
                            {depositModalT('openPaymentPage')}
                        </Button>
                        <Button
                            onClick={() => setPaymentUrl(null)}
                            className="w-full py-3 border border-[#33A959] text-[#33A959] rounded-lg hover:bg-[#E8FFEF] transition-all duration-300 font-medium text-center"
                        >
                            {depositModalT('close')}
                        </Button>
                    </div>
                </Modal>
            )}
            {isWithdrawModalOpen && (
                <RequestWithdrawModal
                    isOpen={isWithdrawModalOpen}
                    onClose={() => setIsWithdrawModalOpen(false)}
                />
            )}
            {isStatusModalOpen && (
                <Modal
                    isOpen={isStatusModalOpen}
                    onClose={() => setIsStatusModalOpen(false)}
                    title={statusType === 'success' ? t('success') : t('error')}
                    noButton={true}
                >
                    <div className="flex flex-col items-center gap-4">
                        <Image
                            src={
                                statusType === 'success'
                                    ? '/images/success.svg'
                                    : '/images/error.png'
                            }
                            width={64}
                            height={64}
                            alt={statusType}
                        />
                        <p className="text-center text-lg">{statusMessage}</p>
                        <Button
                            colorScheme={
                                statusType === 'success' ? 'green2' : 'red'
                            }
                            onClick={() => setIsStatusModalOpen(false)}
                            className="mt-4"
                        >
                            {t('close')}
                        </Button>
                    </div>
                </Modal>
            )}
        </header>
    );
};

export default Header;
