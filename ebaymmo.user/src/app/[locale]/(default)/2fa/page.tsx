'use client';

import Input from '@/components/BaseUI/Input';
import { useState, useEffect } from 'react';
import { authenticator } from '@otplib/preset-default';
import {
    useCreateTwoFaAuthenticatorMutation,
    useGetTwoFaAuthenticatorSubscription,
    useDeleteTwoFaAuthenticatorMutation
} from '@/generated/graphql';
import { useStatusModal } from '@/contexts/StatusModalContext';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

export default function TwoFA() {
    const t = useTranslations('2fa');
    const [publicKey, setPublicKey] = useState('');
    const [prevPublicKey, setPrevPublicKey] = useState(''); // Theo dõi chuỗi trước đó
    const [currentCode, setCurrentCode] = useState('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [nickname, setNickname] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { data: session } = useSession();
    const [createTwoFaAuthenticator] = useCreateTwoFaAuthenticatorMutation();
    const { data: authenticatorsData } = useGetTwoFaAuthenticatorSubscription();
    const [deleteTwoFaAuthenticator] = useDeleteTwoFaAuthenticatorMutation();
    const { showModal } = useStatusModal();

    const [tableCodes, setTableCodes] = useState<{
        [key: string]: { code: string; timeLeft: number; createdAt: string };
    }>({});

    // Thêm biến để theo dõi trạng thái active của key
    const [isKeyActive, setIsKeyActive] = useState(false);

    // Thêm một state để theo dõi chuỗi đang active trong thực tế
    const [activeSecretKey, setActiveSecretKey] = useState('');

    // Hàm kiểm tra chuỗi in hoa
    const isUpperCase = (str: string) => /^[A-Z0-9]+$/.test(str);

    // Hàm tạo mã 2FA
    const generateCode = (key: string) => {
        try {
            const code = authenticator.generate(key);
            return code;
        } catch (error) {
            console.error('Error generating code:', error);
            showModal('error', 'Secret key is not valid');
            return null;
        }
    };

    // Thay đổi cách xử lý khi nhấn Confirm
    const handleConfirm = () => {
        if (!publicKey) {
            showModal('error', 'Please enter Public Key');
            return;
        }

        if (!isUpperCase(publicKey)) {
            showModal('error', 'Public Key is not valid');
            return;
        }

        try {
            // Chỉ thiết lập chuỗi active mới khi:
            // 1. Chưa có chuỗi active nào
            // 2. Chuỗi mới khác với chuỗi active hiện tại
            if (!activeSecretKey || publicKey !== activeSecretKey) {
                setActiveSecretKey(publicKey);
            }
            setIsGenerating(true);
        } catch (error) {
            showModal('error', 'Secret key is not valid');
        }
    };

    // Theo dõi activeSecretKey thay vì publicKey
    useEffect(() => {
        if (!activeSecretKey) {
            setCurrentCode('');
            setTimeLeft(30);
            return;
        }

        try {
            // Khởi tạo mã và thời gian đầu tiên
            let lastCode = authenticator.generate(activeSecretKey);
            setCurrentCode(lastCode);
            setTimeLeft(authenticator.timeRemaining());

            const interval = setInterval(() => {
                // Kiểm tra mã mới
                const newCode = authenticator.generate(activeSecretKey);
                const remaining = authenticator.timeRemaining();

                // Cập nhật UI
                setTimeLeft(remaining);

                // Nếu mã thay đổi, cập nhật mã
                if (newCode !== lastCode) {
                    lastCode = newCode;
                    setCurrentCode(newCode);
                }
            }, 1000);

            return () => clearInterval(interval);
        } catch (error) {
            console.error('Error in TOTP generation:', error);
            showModal('error', 'Invalid secret key');
        }
    }, [activeSecretKey]);

    // Cập nhật mã cho danh sách đã lưu
    useEffect(() => {
        if (!authenticatorsData?.twofaAuthenticators) return;

        const updateCodes = () => {
            const newCodes: typeof tableCodes = {};
            authenticatorsData.twofaAuthenticators.forEach((auth) => {
                if (auth.secretKey) {
                    const code = generateCode(auth.secretKey);
                    if (code) {
                        newCodes[auth.id] = {
                            code,
                            timeLeft: authenticator.timeRemaining(),
                            createdAt: auth.createdAt
                        };
                    }
                }
            });
            setTableCodes(newCodes);
        };

        updateCodes(); // Cập nhật lần đầu
        const interval = setInterval(updateCodes, 1000);

        return () => clearInterval(interval);
    }, [authenticatorsData?.twofaAuthenticators]);

    const handleDeleteCode = async (id: string) => {
        try {
            await deleteTwoFaAuthenticator({ variables: { _eq: id } });
            showModal('success', 'Deleted successfully');
        } catch (error) {
            console.error('Error deleting code:', error);
            showModal('error', 'Cannot delete this code');
        }
    };

    const handleSaveToDatabase = async () => {
        if (!publicKey || !nickname) {
            showModal('error', 'Please fill in all information');
            return;
        }
        if (!isUpperCase(publicKey)) {
            showModal('error', 'Public Key is not valid');
            return;
        }

        try {
            await createTwoFaAuthenticator({
                variables: {
                    objects: [
                        {
                            secretKey: publicKey,
                            deviceName: nickname,
                            isActive: true,
                            userId: session?.user?.id
                        }
                    ]
                }
            });
            showModal('success', 'Saved successfully');
            setPublicKey('');
            setNickname('');
        } catch (error) {
            console.error('Error saving to database:', error);
            showModal('error', 'Cannot save to database');
        }
    };

    return (
        <div className="container mx-auto pt-[80px] md:px-0">
            <div className="md:w-full w-[400px] mx-auto  md:p-0 px-[30px]">
                <h1 className="text-[30px] font-bold mb-8 text-center">
                    {t('title')}
                </h1>
                <div className="mb-6">
                    <Input
                        label={t('publicKey')}
                        type="text"
                        name="address"
                        value={publicKey}
                        onChange={(e) => setPublicKey(e.target.value)}
                        placeholder={t('publicKeyPlaceholder')}
                    />
                </div>

                <div className="flex justify-end gap-2 mb-4">
                    <button
                        onClick={handleConfirm}
                        className="bg-green_main text-white px-6 py-2 rounded-full hover:bg-green_main_hover text-[20px] transition-all duration-200 hover:shadow-lg"
                    >
                        {t('confirm')}
                    </button>
                </div>

                {isGenerating && publicKey && (
                    <div className="bg-white mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <p className="text-gray-700 font-bold">
                                {t('loginCode')}
                            </p>
                            <div className="text-[20px] font-bold tracking-[4px] text-green-600">
                                {currentCode}
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
                            <p className="text-gray-700">
                                {t('timeRemaining')}
                            </p>
                            <span className="bg-[#F59E0B] text-white px-3 py-1 rounded-full text-[16px] font-bold">
                                {timeLeft}s
                            </span>
                        </div>
                    </div>
                )}

                <div className="space-y-2 mb-8 text-[18px] text-green_main text-justify">
                    <p>{t('description.line1')}</p>
                    <p>{t('description.line2')}</p>
                    <p>{t('description.line3')}</p>
                </div>

                <div className="border-t-[1px] border-gray-300 pt-8 mb-8" />

                <div className="mb-8">
                    <h3 className="font-bold mb-4 text-[24px]">
                        {t('saveString.title')}
                    </h3>
                    <Input
                        className="w-full mb-4"
                        type="text"
                        label={t('saveString.reminderName')}
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder={t('saveString.reminderPlaceholder')}
                    />

                    <div className="flex justify-end gap-2 mb-6">
                        <button
                            onClick={() => {
                                setPublicKey('');
                                setNickname('');
                            }}
                            className="text-red-500 hover:text-red-600 underline text-[20px] transition-colors duration-200"
                        >
                            {t('saveString.cancel')}
                        </button>
                        <button
                            onClick={handleSaveToDatabase}
                            className="bg-green_main text-white px-6 py-2 rounded-full hover:bg-green_main_hover text-[20px] transition-all duration-200 hover:shadow-lg"
                        >
                            {t('saveString.save')}
                        </button>
                    </div>

                    <p className="text-xs text-red-500 mt-2">
                        {t('saveString.note')}
                    </p>
                </div>
                <div className="border-t-[1px] border-gray-300 pt-8 mb-8" />

                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="text-[24px] font-medium mb-[10px]">
                            {t('savedList.title')}
                        </h3>
                        {/* <div className="relative group">
                            <div className="w-4 h-4 rounded-full border border-green_main bg-white flex items-center justify-center text-gray-500 cursor-pointer">
                                <span className="text-sm text-green_main">
                                    i
                                </span>
                            </div>
                            <div
                                className="absolute left-0 bottom-6 w-[280px] bg-white border border-[#E5E7EB] p-3 rounded-lg shadow-lg 
                                invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 z-10"
                            >
                                <p className="text-[14px]">
                                    <span className="text-red-500">*Note:</span>
                                    <span className="text-gray-600">
                                        {t('saveString.note')}
                                    </span>
                                </p>
                                <div className="absolute -bottom-2 left-2 w-4 h-4 bg-white border-r border-b border-[#E5E7EB] transform rotate-45" />
                            </div>
                        </div> */}
                    </div>
                    <div className="bg-white rounded-2xl overflow-hidden border border-[#E5E7EB] p-5 md:w-full w-[350px] overflow-x-auto scrollbar scrollbar-thin scrollbar-thumb-green_main">
                        <table className="w-full border-collapse">
                            <thead className="bg-white p-5">
                                <tr className="bg-[#F9FAFB]">
                                    <th className="py-4 px-6 font-bold text-[18px] bg-[#f7f7f7] text-left w-[180px]">
                                        {t('savedList.operation')}
                                    </th>
                                    <th className="py-4 px-6 font-bold text-[18px] bg-[#f7f7f7] text-left w-[406px]">
                                        {t('savedList.reminderName')}
                                    </th>
                                    <th className="py-4 px-6 font-bold text-[18px] bg-[#f7f7f7] text-left w-[255px]">
                                        {t('savedList.currentCode')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {authenticatorsData?.twofaAuthenticators.map(
                                    (auth) => (
                                        <tr
                                            key={auth.id}
                                            className="hover:bg-white transition-colors"
                                        >
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() =>
                                                        handleDeleteCode(
                                                            auth.id
                                                        )
                                                    }
                                                    className="text-green_main hover:text-green_main_hover text-[16px] underline transition-colors duration-200"
                                                >
                                                    {t('savedList.delete')}
                                                </button>
                                            </td>
                                            <td className="py-4 px-6 text-[16px] text-gray-700">
                                                {auth.deviceName}
                                            </td>
                                            <td className="py-4 px-6 text-[16px]">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-green-500 text-white px-3 py-1 rounded">
                                                        {tableCodes[auth.id]
                                                            ?.code || '------'}
                                                    </span>
                                                    <span className="text-gray-500">
                                                        (
                                                        {tableCodes[auth.id]
                                                            ?.timeLeft || 30}
                                                        s)
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                                {(!authenticatorsData?.twofaAuthenticators ||
                                    authenticatorsData.twofaAuthenticators
                                        .length === 0) && (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="text-center py-8 text-gray-500"
                                        >
                                            {t('savedList.noData')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
