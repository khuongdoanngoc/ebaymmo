import Image from 'next/image';
import Tiptoll from '@images/tiptool.svg';
import StatusModal from '../StatusModal/StatusModal'; // Adjust the path as needed
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface ModalContentProps {
    orderDetailsData: any[];
    orderDetailsLoading: boolean;
}
export default function ModalContent({
    orderDetailsData,
    orderDetailsLoading
}: ModalContentProps) {
    const t = useTranslations('order-management.modal');
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    const handleDownload = () => {
        if (!orderDetailsData || orderDetailsData.length === 0) {
            // Show the error modal if there's no data
            setIsErrorModalOpen(true);
            return;
        }

        // Format the table data into a string
        const fileContent = orderDetailsData
            .map((item, index) => {
                const [username, password] = item.dataText?.split('|') || [
                    'No data',
                    'No data'
                ];
                return `#${index + 1}\n${t('account')}: ${username}\n${t('password')}: ${password}\n`;
            })
            .join('\n');

        // Define the file name (e.g., order-code.txt)
        const fileName = `${orderDetailsData[0]?.orderCode || 'order'}.txt`;

        // Create a Blob and trigger the download
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(link.href); // Clean up
    };

    return (
        <>
            <div className="border-l border-r border-b border-neutral-200 rounded-[8px] w-full">
                <div className="flex justify-between items-center p-[20px_25px] border-t-[10px] border-primary-300 bg-neutral-75 rounded-t-[7px] w-full">
                    <div className="flex items-center justify-between w-full gap-[10px]">
                        <p className="text-neutral-400 font-btbeau text-[18px] font-bold">
                            {t('product')}
                        </p>

                        <p className="text-neutral-400 font-btbeau text-[18px] font-bold text-center">
                            {t('value')}
                        </p>
                        <p className="text-neutral-400 font-btbeau text-[18px] font-bold">
                            {t('postback')}
                        </p>
                    </div>
                </div>
                <div className="p-[25px] bg-white rounded-[7px] w-full">
                    {orderDetailsLoading ? (
                        <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                        </div>
                    ) : orderDetailsData && orderDetailsData.length > 0 ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <div className="bg-white overflow-y-auto scrollbar scrollbar-thin scrollbar-thumb-green h-[200px]">
                                        <table className="w-full">
                                            <tbody>
                                                {orderDetailsData.map(
                                                    (item, index) => {
                                                        const [
                                                            username,
                                                            password
                                                        ] =
                                                            item.dataText?.split(
                                                                '|'
                                                            ) || [
                                                                'No data',
                                                                'No data'
                                                            ];
                                                        return (
                                                            <tr
                                                                key={
                                                                    item.productItemId ||
                                                                    index
                                                                }
                                                                className="border-b last:border-b-0 border-neutral-200"
                                                            >
                                                                <td className="py-3 px-4 w-[60px] align-top">
                                                                    <div>
                                                                        #
                                                                        {index +
                                                                            1}
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4 break-all">
                                                                    <div className="flex flex-row items-center justify-center">
                                                                        <div className="text-primary-500">
                                                                            {t(
                                                                                'account'
                                                                            )}

                                                                            :{' '}
                                                                        </div>
                                                                        <span>
                                                                            {
                                                                                username
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-row items-center justify-center">
                                                                        <div className="text-primary-500">
                                                                            {t(
                                                                                'password'
                                                                            )}

                                                                            :{' '}
                                                                        </div>
                                                                        <span>
                                                                            {
                                                                                password
                                                                            }
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-3 px-4 w-[100px] text-right text-[#29B474]">
                                                                    {/* {order.price?.toLocaleString()}đ */}
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 border-t border-gray-200 pt-6">
                                <span className="text-red-500 text-[20px] font-bold">
                                    {t('reportError')}
                                </span>
                                <Image
                                    src={Tiptoll}
                                    alt="Info"
                                    width={16}
                                    height={16}
                                />
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-neutral-400 py-4">
                            {t('noData')}
                        </p>
                    )}
                </div>
            </div>
            <div className="flex flex-col gap-2 text-[#FF0000] text-[14px] text-left mt-5">
                <div className="flex items-start gap-2">
                    <span>•</span>
                    <p>{t('warnings.deleteAfter30Days')}</p>
                </div>
                <div className="flex items-start gap-2">
                    <span>•</span>
                    <p>{t('warnings.randomString')}</p>
                </div>
                <div className="flex items-start gap-2 text-primary-500">
                    <span>•</span>
                    <p>{t('warnings.warranty')}</p>
                </div>
            </div>
            <div className="flex justify-center items-end gap-4 mt-4">
                <button
                    onClick={handleDownload}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                    {t('buttons.downloadOrder')}
                </button>
            </div>
            {/* Error Modal */}
            <StatusModal
                type="error"
                message={t('errors.noDataToDownload')}
                isOpen={isErrorModalOpen}
                onClose={() => setIsErrorModalOpen(false)}
            />
        </>
    );
}
