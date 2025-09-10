'use client';
import { useSession } from 'next-auth/react';
import Table from '@/components/BaseUI/Table';
import Button from '@/components/BaseUI/Button/button';
import Modal from '@/components/BaseUI/Modal';
import Input from '@/components/BaseUI/Input';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    useAddUserAddressMutation,
    useGetUserAddressesQuery,
    useUpdateUserAddressMutation,
    useVerify2FaCodeMutation,
    useCheckWalletAddressExistsQuery
} from '@/generated/graphql';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { useRouter } from 'next/navigation';
import { useUserInfo } from '@/contexts/UserInfoContext';
import { formatDate } from '@/libs/datetime';
import { use2FAStatus } from '@/hooks/use2FAStatus';
import { useTranslations } from 'next-intl';

interface AddressData {
    addressId: string;
    network: React.ReactNode;
    address: string | React.ReactNode;
    networkName?: string;
    createAt: string;
    updateAt: string;
    actions?: React.ReactNode;
    [key: string]: React.ReactNode | string | undefined;
}

export default function BalanceManagement() {
    const t = useTranslations('user.address-balance');
    const { data: session } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(
        null
    );
    const [address, setAddress] = useState('');
    const [network, setNetwork] = useState('');
    const { showModal } = useStatusModal();
    const [expandedAddress, setExpandedAddress] = useState<string | null>(null);
    const [show2FAWarning, setShow2FAWarning] = useState(false);
    const [verifyCode, setVerifyCode] = useState('');
    const router = useRouter();
    const networkOptions = [
        {
            value: 'bsc',
            label: 'Binance Smart Chain',
            networkName: 'Binance Smart Chain'
        }
    ];

    const { is2FAEnabled, isLoading: loading2FA } = use2FAStatus();

    // Add verify2FACode mutation back
    const [verify2FACode] = useVerify2FaCodeMutation();

    // Query để lấy danh sách ví và số lượng ví
    const {
        data: addressData,
        refetch
        // loading
    } = useGetUserAddressesQuery({
        variables: {
            userId: session?.user?.id || ''
        },
        skip: !session?.user?.id
    });

    // Mutation để thêm ví mới
    const [addAddress] = useAddUserAddressMutation();

    const { userInfo, loading } = useUserInfo();

    // Thêm mutation update
    const [updateAddress] = useUpdateUserAddressMutation();

    // Thêm state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addressError, setAddressError] = useState('');

    // Add validation function
    const validateWalletAddress = (address: string) => {
        // Trim spaces
        const trimmedAddress = address.trim();

        // Check if empty after trim
        if (!trimmedAddress) {
            return t('errors.emptyAddress');
        }

        // Check if address is valid BSC address format
        if (!/^0x[a-fA-F0-9]{40}$/.test(trimmedAddress)) {
            return t('errors.invalidAddressFormat');
        }

        return '';
    };

    // Add query to check for duplicate addresses
    const { data: existingAddress } = useCheckWalletAddressExistsQuery({
        variables: {
            address: address.trim()
        },
        skip: !address || address.trim() === ''
    });

    // Replace the existing useEffect with this one
    useEffect(() => {
        if (!loading2FA) {
            // Only check after loading is complete
            setShow2FAWarning(!is2FAEnabled);
        }
    }, [is2FAEnabled, loading2FA]);

    const handleEdit = (addr: AddressData) => {
        setSelectedAddress(addr);
        setNetwork(addr.network as string);
        setAddress(addr.address as string);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    // Hàm format địa chỉ ví
    const formatAddress = (address: string, isExpanded: boolean) => {
        if (!address) return '';

        return address.length > 20 ? (
            <div key={`address-${address}`} className="flex items-center gap-2">
                <span>
                    {isExpanded ? address : address.slice(0, 20) + '...'}
                </span>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setExpandedAddress(isExpanded ? null : address);
                    }}
                    className="text-primary-500 hover:text-primary-600 text-sm"
                >
                    {isExpanded ? t('collapse') : t('viewMore')}
                </button>
            </div>
        ) : (
            address
        );
    };

    // Format data cho table
    const tableData: AddressData[] =
        addressData?.addresses.map((addr) => ({
            addressId: addr.addressId,
            network: (
                <div key={`network-${addr.addressId}`} className="font-medium">
                    {addr.networkName || addr.network}
                </div>
            ),
            address: formatAddress(
                addr.address as string,
                expandedAddress === (addr.address as string)
            ),
            networkName: addr.networkName || '',
            createAt: formatDate(addr.createAt),
            updateAt: formatDate(addr.updateAt),
            actions: (
                <div
                    key={`actions-${addr.addressId}`}
                    className="flex justify-center gap-4"
                >
                    <button
                        onClick={() =>
                            handleEdit({
                                addressId: addr.addressId,
                                network: addr.network,
                                address: addr.address,
                                networkName: addr.networkName || '',
                                createAt: formatDate(addr.createAt),
                                updateAt: formatDate(addr.updateAt)
                            })
                        }
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <Image
                            src="/images/edit.png"
                            alt="Edit"
                            width={24}
                            height={24}
                            className="object-contain"
                        />
                    </button>
                </div>
            )
        })) || [];

    const columns = [
        {
            header: t('network'),
            accessor: 'network',
            sortable: true,
            className: 'px-6 py-4'
        },
        {
            header: t('walletAddress'),
            accessor: 'address',
            sortable: true,
            className: 'px-6 py-4'
        },
        {
            header: t('createdAt'),
            accessor: 'createAt',
            sortable: true,
            className: 'px-6 py-4'
        },
        {
            header: t('updatedAt'),
            accessor: 'updateAt',
            sortable: true,
            className: 'px-6 py-4'
        },
        {
            header: t('actions'),
            accessor: 'actions',
            sortable: false,
            className: 'px-6 py-4'
        }
    ];

    // Modify handleSubmit to include validation
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;

        setIsSubmitting(true);
        setAddressError('');

        if (!session?.user?.id) {
            showModal('error', t('errors.loginRequired'));
            setIsSubmitting(false);
            return;
        }

        // Validate address
        const trimmedAddress = address.trim();
        const validationError = validateWalletAddress(trimmedAddress);

        if (validationError) {
            showModal('error', validationError);
            setIsSubmitting(false);
            return;
        }

        // Check for duplicate address
        if (
            existingAddress?.addresses &&
            existingAddress.addresses.length > 0
        ) {
            showModal('error', t('errors.duplicateAddress'));
            setIsSubmitting(false);
            return;
        }

        if (!network || !verifyCode) {
            showModal('error', t('errors.fillAllFields'));
            setIsSubmitting(false);
            return;
        }

        try {
            // Verify 2FA first
            const { data: verifyResult } = await verify2FACode({
                variables: {
                    twoFactorToken: verifyCode
                }
            });

            if (!verifyResult?.verify2FACode?.status) {
                showModal('error', t('errors.incorrect2FA'));
                setIsSubmitting(false);
                return;
            }

            const selectedNetwork = networkOptions.find(
                (option) => option.value === network
            );

            if (isEditMode && selectedAddress) {
                // Update existing address
                const { data: updatedAddress } = await updateAddress({
                    variables: {
                        where: {
                            addressId: { _eq: selectedAddress.addressId },
                            userId: { _eq: session.user.id }
                        },
                        set: {
                            network,
                            address: trimmedAddress,
                            networkName: selectedNetwork?.networkName,
                            updateAt: new Date().toISOString()
                        }
                    }
                });

                if (updatedAddress?.updateAddresses?.returning?.[0]) {
                    setIsModalOpen(false);
                    setAddress('');
                    setNetwork('');
                    setVerifyCode('');
                    setIsEditMode(false);
                    await refetch();
                    showModal('success', t('success.walletUpdated'));
                } else {
                    showModal('error', t('errors.updateFailed'));
                }
                setIsSubmitting(false);
                return;
            }

            // Add new address
            const addressCount =
                addressData?.addressesAggregate?.aggregate?.count ?? 0;
            if (addressCount >= 3) {
                showModal('error', t('errors.maxWalletsReached'));
                setIsSubmitting(false);
                return;
            }

            const { data: newAddress } = await addAddress({
                variables: {
                    input: {
                        userId: session.user.id,
                        network: network as any,
                        address: trimmedAddress,
                        networkName: selectedNetwork?.networkName,
                        createAt: new Date().toISOString(),
                        updateAt: new Date().toISOString()
                    }
                }
            });

            if (newAddress?.insertAddresses?.returning?.[0]) {
                setIsModalOpen(false);
                setAddress('');
                setNetwork('');
                setVerifyCode('');
                await refetch();
                showModal('success', t('success.walletAdded'));
            } else {
                showModal('error', t('errors.addFailed'));
            }
        } catch (error) {
            console.error('Operation failed:', error);
            showModal(
                'error',
                isEditMode ? t('errors.updateFailed') : t('errors.addFailed')
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative">
            {/* Update the overlay condition */}
            {!is2FAEnabled && (
                <div className="absolute inset-0 bg-gray-50/50 backdrop-blur-[2px] z-10" />
            )}

            <div className="p-6 lg:p-10 border-black-700 border-[1px] rounded-[15px]">
                {loading ? (
                    <div className="mx-auto w-[940px] max-w-[100%]">
                        <div className="flex justify-between items-center mb-6">
                            {/* Title and balance skeleton */}
                            <div>
                                <div className="h-8 w-48 bg-gray-200 rounded mb-4 animate-pulse" />
                                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                            </div>
                            {/* Add button skeleton */}
                            <div className="w-[200px]">
                                <div className="h-12 w-full bg-gray-200 rounded-full animate-pulse" />
                            </div>
                        </div>

                        {/* Table skeleton */}
                        <div className="mt-8">
                            {/* Table header skeleton */}
                            <div className="grid grid-cols-5 gap-4 mb-4 px-6 py-4 bg-gray-50 rounded-t-lg">
                                {[...Array(5)].map((_, index) => (
                                    <div
                                        key={`header-${index}`}
                                        className="h-6 bg-gray-200 rounded animate-pulse"
                                    />
                                ))}
                            </div>

                            {/* Table rows skeleton */}
                            {[...Array(3)].map((_, rowIndex) => (
                                <div
                                    key={`row-${rowIndex}`}
                                    className="grid grid-cols-5 gap-4 px-6 py-4 border-b"
                                >
                                    {[...Array(5)].map((_, colIndex) => (
                                        <div
                                            key={`cell-${rowIndex}-${colIndex}`}
                                            className="h-6 bg-gray-200 rounded animate-pulse"
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mx-auto w-[940px] max-w-[100%]">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-[24px] font-bold">
                                    {t('title')}
                                </h1>
                                <p className="text-gray-600 mt-2">
                                    {t('currentBalance', {
                                        balance: userInfo?.balance || 0
                                    })}
                                </p>
                            </div>
                            <div className="w-[200px]">
                                <Button
                                    onClick={() => {
                                        setIsEditMode(false);
                                        setIsModalOpen(true);
                                    }}
                                    width="100%"
                                    className={`px-6 py-3 rounded-full ${
                                        (addressData?.addressesAggregate
                                            ?.aggregate?.count ?? 0) >= 3
                                            ? 'opacity-50 bg-primary-500 cursor-not-allowed'
                                            : 'bg-primary-500 hover:bg-primary-600'
                                    } text-white`}
                                    disabled={
                                        (addressData?.addressesAggregate
                                            ?.aggregate?.count ?? 0) >= 3
                                    }
                                >
                                    {t('addWallet')}
                                </Button>
                            </div>
                        </div>

                        {(addressData?.addressesAggregate?.aggregate?.count ??
                            0) >= 3 && (
                            <div className="text-red-500 text-center mt-4">
                                {t('maxWallets')}
                            </div>
                        )}
                        <Table columns={columns} data={tableData} />

                        {isModalOpen && (
                            <Modal
                                isOpen={isModalOpen}
                                onClose={() => {
                                    setIsModalOpen(false);
                                    setIsEditMode(false);
                                    setAddress('');
                                    setNetwork('');
                                    setVerifyCode('');
                                }}
                                title={
                                    isEditMode
                                        ? t('editWallet')
                                        : t('addNewWallet')
                                }
                                width="800px"
                                noButton
                                className="h-[auto] flex flex-col justify-center !bg-white !bg-none w-[90%] sm:w-[80%] md:w-[60%] lg:w-[800px]"
                            >
                                <div className="relative w-full max-w-[500px] mx-auto">
                                    <form
                                        className="space-y-4 sm:space-y-6 flex flex-col items-center w-full"
                                        onSubmit={handleSubmit}
                                    >
                                        <div className="w-full">
                                            <select
                                                value={network}
                                                onChange={(e) =>
                                                    setNetwork(e.target.value)
                                                }
                                                className="w-full h-[45px] md:h-[53px] border rounded-lg px-4 text-sm sm:text-base"
                                            >
                                                <option value="">
                                                    {t('selectNetwork')}
                                                </option>
                                                {networkOptions.map(
                                                    (option) => (
                                                        <option
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>
                                        <div className="w-full">
                                            <Input
                                                label={t('walletAddress')}
                                                placeholder={t(
                                                    'enterWalletAddress'
                                                )}
                                                className="w-full h-[45px] md:h-[53px] text-sm sm:text-base"
                                                value={address}
                                                onChange={(e) =>
                                                    setAddress(e.target.value)
                                                }
                                                error={false}
                                                errorMessage=""
                                            />
                                        </div>
                                        <div className="w-full">
                                            <Input
                                                label={t('enter2FACode')}
                                                type="text"
                                                placeholder={t('enter2FACode')}
                                                className="w-full h-[45px] md:h-[53px] text-center text-xl sm:text-2xl tracking-wider"
                                                maxLength={6}
                                                value={verifyCode}
                                                onChange={(e) =>
                                                    setVerifyCode(
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <Button
                                            type="submit"
                                            className="mt-4 sm:mt-6 w-full sm:w-[60%] md:w-[50%] mx-auto text-white py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base rounded-3xl bg-primary-500 hover:bg-primary-600"
                                            disabled={isSubmitting}
                                        >
                                            {isEditMode
                                                ? t('saveChanges')
                                                : t('addAddress')}
                                        </Button>
                                    </form>
                                </div>
                            </Modal>
                        )}

                        {show2FAWarning && (
                            <Modal
                                isOpen={show2FAWarning}
                                onClose={() => setShow2FAWarning(false)}
                                title={t('2FAWarning.title')}
                                width="500px"
                                className="!bg-white !bg-none"
                                noButton
                            >
                                <div className="flex flex-col items-center gap-4 sm:gap-6 p-4 sm:p-6">
                                    <div className="flex flex-col items-center gap-2">
                                        <Image
                                            src="/images/2FA.jpg"
                                            alt="2FA"
                                            width={150}
                                            height={150}
                                        />
                                        <p className="text-center text-gray-600 mt-4 text-sm sm:text-base">
                                            {t('2FAWarning.description')}
                                        </p>
                                    </div>
                                    <div className="w-full sm:w-[400px] mx-auto">
                                        <Button
                                            onClick={() =>
                                                router.push(
                                                    '/user/accounts-management'
                                                )
                                            }
                                            className="w-full h-[40px] sm:h-[46px] bg-primary-500 text-white rounded-full hover:bg-primary-600 text-sm sm:text-base"
                                        >
                                            {t('2FAWarning.enableNow')}
                                        </Button>
                                    </div>
                                </div>
                            </Modal>
                        )}
                    </div>
                )}
            </div>

            <style jsx global>{`
                .modal-overlay {
                    z-index: 30;
                }
                .modal-content {
                    z-index: 40;
                }
                .status-modal-overlay {
                    z-index: 99998 !important;
                }
                .status-modal-content {
                    z-index: 99999 !important;
                }
            `}</style>
        </div>
    );
}
