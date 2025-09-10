'use client';

import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import Button from '@/components/BaseUI/Button/button';
import Modal from '@/components/BaseUI/Modal';
import Input from '@/components/BaseUI/Input';
import RequestWithdrawModal from '@/components/Payment/RequestWithdrawModal';
import {
    useInsertDepositeLogsMutation,
    useCreateDepositMutation,
    useUserInfoSubscription
} from '@/generated/graphql';
import dayjs from 'dayjs';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useUserInfo } from '@/contexts/UserInfoContext';
import { DropdownItem } from './Header';

const menuDropdownItems = [
    {
        category: 'products',
        items: [
            {
                href: '/products?type=Product&category=email',
                imgSrc: '/images/sp2.svg',
                alt: 'email',
                label: 'Email'
            },
            {
                href: '/products?type=Product&category=software',
                imgSrc: '/images/product-03.svg',
                alt: 'software',
                label: 'Software'
            },
            {
                href: '/products?type=Product&category=account',
                imgSrc: '/images/product-04.svg',
                alt: 'account',
                label: 'Account'
            },
            {
                href: '/products?type=Product&category=other-products',
                imgSrc: '/images/product-05.svg',
                alt: 'other-products',
                label: 'Other'
            }
        ]
    },
    {
        category: 'services',
        items: [
            {
                href: '/products?type=Service&category=increase-engagement',
                imgSrc: '/images/envelope-06.svg',
                alt: 'increase-interaction',
                label: 'Increase Interaction'
            },
            {
                href: '/products?type=Service&category=software-services',
                imgSrc: '/images/envelope-07.svg',
                alt: 'software-service',
                label: 'Software Service'
            },
            {
                href: '/products?type=Service&category=blockchain',
                imgSrc: '/images/envelope-08.svg',
                alt: 'blockchain',
                label: 'Blockchain'
            },
            {
                href: '/products?type=Service&category=other-services',
                imgSrc: '/images/envelope-09.svg',
                alt: 'other-service',
                label: 'Other Service'
            }
        ]
    }
];

const MobileDrawer = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [isProductOpen, setIsProductOpen] = useState<boolean>(false);
    const [isSupportOpen, setIsSupportOpen] = useState<boolean>(false);
    const [isServiceOpen, setIsServiceOpen] = useState<boolean>(false);
    const [isWalletOpen, setIsWalletOpen] = useState<boolean>(false);
    const [isManagementOpen, setIsManagementOpen] = useState<boolean>(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
    const { data: session, status } = useSession();
    const { userInfo } = useUserInfo();

    // Deposit form states
    const [amount, setAmount] = useState('');
    const [networkCode, setNetworkCode] = useState('');
    const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);
    const [networkError, setNetworkError] = useState('');
    const [amountError, setAmountError] = useState('');

    const networkOptions = [
        { value: 'BSC', label: 'Binance Smart Chain' },
        { value: 'ETH', label: 'Ethereum' },
        { value: 'ARB', label: 'Arbitrum' }
    ];

    const [insertDeposit] = useInsertDepositeLogsMutation();
    const [createDeposit] = useCreateDepositMutation();

    const [isLogin, setIsLogin] = useState<boolean>(false);

    const toggleDrawer = () => {
        setIsOpen(!isOpen);
    };

    const toggleProduct = () => {
        setIsProductOpen(!isProductOpen);
    };

    const toggleService = () => {
        setIsServiceOpen(!isServiceOpen);
    };

    const toggleSupport = () => {
        setIsSupportOpen(!isSupportOpen);
    };

    const toggleWallet = () => {
        setIsWalletOpen(!isWalletOpen);
    };

    const toggleManagement = () => {
        setIsManagementOpen(!isManagementOpen);
    };

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

    const handleNetworkSelect = (value: string) => {
        setNetworkCode(value);
        setNetworkError('');
        setIsNetworkDropdownOpen(false);
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setAmount(value);

        const numValue = parseFloat(value);

        if (numValue < 0) {
            setAmountError('Amount cannot be negative');
            return;
        }

        if (numValue === 0) {
            setAmountError('Amount must be greater than 0');
            return;
        }

        setAmountError('');
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNetworkCode('');
        setAmount('');
        setNetworkError('');
        setAmountError('');
        setIsNetworkDropdownOpen(false);
    };

    const handleSubmit = async () => {
        try {
            let hasError = false;

            if (!networkCode) {
                setNetworkError('Please select a network');
                hasError = true;
            }

            if (!amount) {
                setAmountError('Please enter amount');
                hasError = true;
            }

            if (hasError) {
                return {
                    status: 'error',
                    message: 'Please fill in all required fields'
                };
            }

            const numAmount = parseFloat(amount);
            if (numAmount < 0) {
                setAmountError('Amount cannot be negative');
                return {
                    status: 'error',
                    message: 'Amount cannot be negative'
                };
            }

            if (isNaN(numAmount)) {
                setAmountError('Amount must be a valid number');
                return {
                    status: 'error',
                    message: 'Amount must be a valid number'
                };
            }

            if (numAmount <= 0) {
                setAmountError('Amount must be greater than 0');
                return {
                    status: 'error',
                    message: 'Amount must be greater than 0'
                };
            }

            const MAX_AMOUNT = 10000;
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

                    window.open(paymentUrl, '_blank');
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

    // Update subscription for user balance
    const { data: balanceData } = useUserInfoSubscription({
        variables: {
            userId: session?.user?.id || ''
        },
        skip: !session?.user?.id
    });

    useEffect(() => {
        if (status === 'loading') return; // Đợi NextAuth đang xử lý session
        if (!session) {
            setIsLogin(false);
        } else {
            setIsLogin(true);
        }
    }, [session, status]); // Empty dependency array means this runs once on mount

    // Tạo dropdown items dựa trên role
    const getDropdownItems = (): DropdownItem[] => {
        const baseItems: DropdownItem[] = [
            {
                title: 'Address Balance',
                link: '/user/address-balance',
                icon: '/images/user/clipboard-03.svg'
            },
            {
                icon: '/images/user/person.svg',
                title: 'Account Management',
                link: '/user/accounts-management'
            },
            {
                icon: '/images/user/clipboard-01.svg',
                title: 'Order Management',
                link: '/user/order-managements'
            },
            {
                icon: '/images/transactionhistory.svg',
                title: 'Transaction History',
                link: '/user/transaction-history'
            },
            {
                icon: '/images/withdrawalhistory.svg',
                title: 'Withdrawal History',
                link: '/user/withdrawal-history'
            },
            {
                icon: '/images/reseller.svg',
                title: 'Reseller History',
                link: '/user/reseller-history'
            },
            {
                icon: '/images/heartstore.svg',
                title: 'Your Favorite Store',
                link: '/user/your-favourite-store'
            },
            {
                icon: '/images/content.svg',
                title: 'Content Management',
                link: '/user/content-management'
            }
        ];

        // Thêm Dashboard menu nếu là SELLER
        if (session?.user.sellerSince) {
            return [
                {
                    icon: '/images/seller/dashboard.svg',
                    title: 'Dashboard',
                    link: '/seller/dashboard'
                },
                ...baseItems
            ];
        }

        return baseItems;
    };

    return (
        <div className="relative text-white">
            {/* Button to toggle drawer */}
            <button onClick={toggleDrawer} className="relative">
                <Image
                    src="/images/3bar.svg"
                    alt="3bar-icon"
                    width={24}
                    height={24}
                />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-40"
                    onClick={toggleDrawer}
                />
            )}

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-[20rem] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                } overflow-y-auto rounded-tl-3xl rounded-bl-3xl rounded-br-3xl border border-gray-200`}
            >
                {/* Drawer header */}
                <div className="p-6 my-3 border-b border-gray-100 bg-white rounded-tl-3xl">
                    <div className="flex items-center space-x-3 w-full">
                        {isLogin ? (
                            <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col">
                                    <span className="text-gray-500">
                                        Hello,
                                    </span>
                                    <span className="text-base font-semibold text-gray-800">
                                        {session?.user.name}
                                    </span>
                                </div>
                                <Image
                                    src={
                                        userInfo?.images || '/images/avatar.svg'
                                    }
                                    alt="avatar"
                                    width={40}
                                    height={40}
                                    className="rounded-full border border-gray-200 shadow-sm"
                                />
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="text-base font-semibold text-primary-500"
                            >
                                Login now
                            </Link>
                        )}
                    </div>
                </div>

                {/* Drawer content */}
                <div className="p-6">
                    <nav className="space-y-4">
                        {/* Wallet Section - Only visible when logged in */}
                        {isLogin && (
                            <div>
                                <button
                                    onClick={toggleWallet}
                                    className="w-full text-left font-bold px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors duration-200 shadow-sm"
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center">
                                            <Image
                                                src="/images/wallet.svg"
                                                alt="wallet"
                                                width={20}
                                                height={20}
                                                className="mr-2 filter brightness-0"
                                            />
                                            <span>My Wallet</span>
                                        </div>
                                        <span
                                            className={`float-right transform transition-transform duration-200 ${
                                                isWalletOpen ? 'rotate-180' : ''
                                            }`}
                                        >
                                            ▼
                                        </span>
                                    </div>
                                </button>
                                {/* Wallet dropdown items */}
                                <div
                                    className={`transition-all duration-200 overflow-hidden ${
                                        isWalletOpen
                                            ? 'max-h-60 opacity-100'
                                            : 'max-h-0 opacity-0'
                                    }`}
                                >
                                    <div className="bg-gray-50 text-gray-900 p-4 rounded-lg m-2 border border-gray-100">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-gray-600">
                                                Balance:
                                            </span>
                                            <span className="font-bold text-lg text-primary-600">
                                                {balanceData?.usersByPk
                                                    ?.balance ?? 0}{' '}
                                                USDT
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => {
                                                    setIsModalOpen(true);
                                                    setIsOpen(false);
                                                }}
                                                className="py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all duration-300 text-sm font-medium text-center shadow"
                                            >
                                                Deposit
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setIsWithdrawModalOpen(
                                                        true
                                                    );
                                                    setIsOpen(false);
                                                }}
                                                className="py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all duration-300 text-sm font-medium text-center shadow"
                                            >
                                                Withdraw
                                            </button>
                                        </div>
                                    </div>
                                    <Link
                                        href="/user/address-balance"
                                        className="block font-medium px-8 py-2 hover:bg-gray-100 text-gray-700 mt-2 rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Withdrawal Wallets
                                    </Link>
                                    <Link
                                        href="/user/transaction-history"
                                        className="block font-medium px-8 py-2 hover:bg-gray-100 text-gray-700 rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Transaction Histories
                                    </Link>
                                    <Link
                                        href="/user/withdrawal-history"
                                        className="block font-medium px-8 py-2 hover:bg-gray-100 text-gray-700 rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Withdrawal Histories
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Product Dropdown */}
                        <div>
                            <button
                                onClick={toggleProduct}
                                className="w-full text-left font-bold px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors duration-200 shadow-sm"
                            >
                                Product
                                <span
                                    className={`float-right transform transition-transform duration-200 ${
                                        isProductOpen ? 'rotate-180' : ''
                                    }`}
                                >
                                    ▼
                                </span>
                            </button>
                            {/* Dropdown items */}
                            <div
                                className={`transition-all duration-200 overflow-hidden  ${
                                    isProductOpen
                                        ? 'max-h-50 opacity-100'
                                        : 'max-h-0 opacity-0'
                                }`}
                            >
                                {menuDropdownItems[0].items.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="block font-medium px-8 py-2 hover:bg-gray-100 text-gray-700 mt-2 rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Service Dropdown */}
                        <div>
                            <button
                                onClick={toggleService}
                                className="w-full text-left font-bold px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors duration-200 shadow-sm"
                            >
                                Service
                                <span
                                    className={`float-right transform transition-transform duration-200 ${
                                        isServiceOpen ? 'rotate-180' : ''
                                    }`}
                                >
                                    ▼
                                </span>
                            </button>
                            {/* Dropdown items */}
                            <div
                                className={`transition-all duration-200 overflow-hidden ${
                                    isServiceOpen
                                        ? 'max-h-50 opacity-100'
                                        : 'max-h-0 opacity-0'
                                }`}
                            >
                                {menuDropdownItems[1].items.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="block font-medium px-8 py-2 hover:bg-gray-100 text-gray-700 mt-2 rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        {/* Support Dropdown */}
                        <div>
                            <button
                                onClick={toggleSupport}
                                className="w-full text-left font-bold px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors duration-200 shadow-sm"
                            >
                                Support
                                <span
                                    className={`float-right transform transition-transform duration-200 ${
                                        isSupportOpen ? 'rotate-180' : ''
                                    }`}
                                >
                                    ▼
                                </span>
                            </button>
                            {/* Dropdown items */}
                            <div
                                className={`transition-all duration-200 overflow-hidden ${
                                    isSupportOpen
                                        ? 'max-h-50 opacity-100'
                                        : 'max-h-0 opacity-0'
                                }`}
                            >
                                <Link
                                    href="/2fa"
                                    className="block font-medium px-8 py-2 hover:bg-gray-100 text-gray-700 mt-2 rounded-lg"
                                    onClick={() => setIsOpen(false)}
                                >
                                    2FA
                                </Link>
                                <Link
                                    href="/faqs"
                                    className="block font-medium px-8 py-2 hover:bg-gray-100 text-gray-700 rounded-lg"
                                    onClick={() => setIsOpen(false)}
                                >
                                    FAQs
                                </Link>
                            </div>
                        </div>

                        {/* Management Dropdown */}
                        <div>
                            <button
                                onClick={toggleManagement}
                                className="w-full text-left font-bold px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors duration-200 shadow-sm"
                            >
                                Management
                                <span
                                    className={`float-right transform transition-transform duration-200 ${
                                        isManagementOpen ? 'rotate-180' : ''
                                    }`}
                                >
                                    ▼
                                </span>
                            </button>
                            {/* Dropdown items */}
                            <div
                                className={`transition-all duration-200 overflow-hidden ${
                                    isManagementOpen
                                        ? 'max-h-50 opacity-100'
                                        : 'max-h-0 opacity-0'
                                }`}
                            >
                                {getDropdownItems().map((item) => (
                                    <Link
                                        key={item.title}
                                        href={item.link}
                                        className="font-medium px-8 py-2 hover:bg-gray-100 text-gray-700 flex items-center rounded-lg"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <Image
                                            src={item.icon}
                                            alt={item.title}
                                            width={20}
                                            height={20}
                                            className="mr-2 filter brightness-0"
                                        />
                                        {item.title}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* SharesLink */}
                        <Link
                            href="/shares?tag="
                            className="block font-bold px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors duration-200 shadow-sm"
                            onClick={() => setIsOpen(false)}
                        >
                            Shares
                        </Link>
                        {/* Favorite stores Link */}
                        <Link
                            href="/favorite-stores"
                            className="block font-bold px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors duration-200 shadow-sm"
                            onClick={() => setIsOpen(false)}
                        >
                            Favorite stores
                        </Link>
                        {/* Contact Link */}
                        <Link
                            href="/contacts"
                            className="block font-bold px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition-colors duration-200 shadow-sm"
                            onClick={() => setIsOpen(false)}
                        >
                            Contacts
                        </Link>

                        {/* Logout Button - Only visible when logged in */}
                        {isLogin && (
                            <button
                                onClick={handleLogout}
                                className="w-full text-left font-bold px-5 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors duration-200 mt-8 shadow"
                            >
                                Logout
                            </button>
                        )}
                    </nav>
                </div>
            </div>

            {/* Deposit Modal */}
            {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title="Scan QR code to deposit"
                    noButton={true}
                    className="!w-[90%] md:!w-[600px] h-auto"
                >
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[16px] text-[#3F3F3F]">
                                Your USDT wallet
                            </span>
                            <span className="text-[16px] text-[#3F3F3F]">
                                Balance: {balanceData?.usersByPk?.balance || 0}{' '}
                                USDT
                            </span>
                        </div>

                        <div className="relative mt-2">
                            <label
                                className={`absolute top-[-13px] left-3 bg-white px-2 font-medium leading-6 ${networkError ? 'text-red-500' : 'text-[#6C6C6C]'}`}
                            >
                                Network Code *
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
                                    )?.label || 'Select network'}
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
                                label="Amount *"
                                placeholder="Enter deposit amount"
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
                                Continue
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Withdraw Modal */}
            {isWithdrawModalOpen && (
                <RequestWithdrawModal
                    isOpen={isWithdrawModalOpen}
                    onClose={() => setIsWithdrawModalOpen(false)}
                />
            )}
        </div>
    );
};

export default MobileDrawer;
