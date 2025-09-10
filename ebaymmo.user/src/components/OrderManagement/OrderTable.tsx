'use client';
import { ModeOrder } from '@/constants/enum';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface OrderTableProps {
    orders: any[];
    onOpenModal: (order: any, mode: ModeOrder) => void;
    formatDate: (dateString: string) => string;
}

export default function OrderTable({
    orders,
    onOpenModal,
    formatDate
}: OrderTableProps) {
    const router = useRouter();
    const t = useTranslations('order-management');

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-[1200px] max-w-full">
                <table className="w-full table-auto border-collapse bg-white shadow-md rounded-lg">
                    <thead className="bg-[#F7F7F7]">
                        <tr className="flex">
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 min-w-[190px]">
                                {t('table.action')}
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 min-w-[120px]">
                                {t('table.orderCode')}
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 min-w-[140px]">
                                {t('table.orderDate')}
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 min-w-[200px] max-w-[200px]">
                                {t('table.seller')}
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 min-w-[200px] max-w-[200px]">
                                {t('table.productName')}
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 min-w-[100px]">
                                {t('table.quantity')}
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 min-w-[100px]">
                                {t('table.price')}
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 min-w-[100px]">
                                {t('table.reduce')}
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 min-w-[140px]">
                                {t('table.completedDate')}
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 min-w-[120px]">
                                {t('table.status')}
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 min-w-[120px]">
                                {t('table.orderType')}
                            </th>
                            <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 min-w-[120px]">
                                {t('table.totalMoney')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order, index) => (
                            <tr
                                key={index}
                                className="border-t border-gray-200 flex"
                            >
                                <td className="p-4 text-[18px] font-[400] text-gray-700 text-left min-w-[190px] flex-col flex">
                                    <p
                                        onClick={() =>
                                            onOpenModal(order, ModeOrder.DATA)
                                        }
                                        className="text-green_main underline cursor-pointer"
                                    >
                                        {t('getProductData')}
                                    </p>
                                    <p
                                        onClick={() =>
                                            onOpenModal(
                                                order,
                                                ModeOrder.FEEDBACK
                                            )
                                        }
                                        className="text-green_main underline cursor-pointer"
                                    >
                                        {t('reviewOrder')}
                                    </p>
                                    {order.orderStatus === 'pending' && (
                                        <p
                                            onClick={() =>
                                                onOpenModal(
                                                    order,
                                                    ModeOrder.COMPLAIN
                                                )
                                            }
                                            className="text-green_main underline cursor-pointer"
                                        >
                                            {t('complain')}
                                        </p>
                                    )}
                                    {(order.orderStatus === 'complained' ||
                                        order.orderStatus === 'dispute') && (
                                        <p
                                            onClick={() =>
                                                onOpenModal(
                                                    order,
                                                    ModeOrder.VIEW_COMPLAIN
                                                )
                                            }
                                            className="text-green_main underline cursor-pointer"
                                        >
                                            {t('viewComplain')}
                                        </p>
                                    )}
                                    <p
                                        onClick={() =>
                                            router.push(
                                                `/chatbox?chatto=${order.sellerName}`
                                            )
                                        }
                                        className="text-green_main underline cursor-pointer"
                                    >
                                        {t('chat')}
                                    </p>
                                </td>
                                <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left min-w-[120px] truncate">
                                    {order.orderCode}
                                </td>
                                <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left min-w-[140px] truncate">
                                    {formatDate(order.orderDate)}
                                </td>
                                <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left min-w-[200px] max-w-[200px] truncate">
                                    {order.sellerName}
                                </td>
                                <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left min-w-[200px] max-w-[200px] truncate">
                                    {order.productName}
                                </td>
                                <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left min-w-[100px] truncate">
                                    {order.quantity}
                                </td>
                                <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left min-w-[100px] truncate">
                                    {order.productPrice}
                                </td>
                                <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left min-w-[100px] truncate">
                                    {order.couponId || 0}
                                </td>
                                <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left min-w-[140px] truncate">
                                    {formatDate(order.completeDateService)}
                                </td>
                                <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left min-w-[120px] truncate">
                                    {order.orderStatus}
                                </td>
                                <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left min-w-[120px] truncate">
                                    {order.orderType}
                                </td>
                                <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left min-w-[120px] truncate">
                                    {order.totalAmount}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
