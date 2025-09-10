'use client';

import Input from '@/components/BaseUI/Input';
import Modal from '@/components/BaseUI/Modal';
import OrderTableSkeleton from '@/components/Skeleton/OrderTableSkeleton';
import { useGetOrdersQuery, OrderBy, Orders } from '@/generated/graphql';
import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function OrderManagementContent() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Orders | null>(null);
    const [modalTitle, setModalTitle] = useState<string>('');
    const [modalContent, setModalContent] = useState<React.ReactNode>(null);

    const { data: session } = useSession();

    const { data: ordersData, loading } = useGetOrdersQuery({
        variables: {
            limit: 10,
            offset: 0,
            userId: session?.user?.id,
            orderBy: [
                {
                    updateAt: OrderBy.Desc
                }
            ]
        }
    });

    const orders = useMemo(() => {
        return (
            ordersData?.orders.map((order) => ({
                ...order,
                orderDate: order.orderDate?.toLocaleDateString()
            })) || []
        );
    }, [ordersData]);

    const handleOpenModal = (
        order: any,
        mode: 'data' | 'feedback' | 'complain' | 'chat'
    ) => {
        setSelectedOrder(order as Orders);

        if (mode === 'data') {
            setModalTitle(`Get product data ${order.orderCode}`);
            setModalContent(
                <>
                    <p>
                        <strong>Order code:</strong> {order.orderCode}
                    </p>
                    <p>
                        <strong>Order date:</strong> {order.orderDate}
                    </p>
                    <p>
                        <strong>Seller:</strong> {order?.user?.username}
                    </p>
                    <p>
                        <strong>Product name:</strong>{' '}
                        {order?.product?.productName}
                    </p>
                    <p>
                        <strong>Quantity:</strong> {order.quantity}
                    </p>
                    <p>
                        <strong>Price:</strong> {order.price}
                    </p>
                    <p>
                        <strong>Discount:</strong>{' '}
                        {order?.coupon?.discountValue}
                    </p>
                    <p>
                        <strong>Status:</strong> {order.orderStatus}
                    </p>
                    <p>
                        <strong>Total amount:</strong> {order.totalAmount}
                    </p>
                </>
            );
        } else if (mode === 'feedback') {
            setModalTitle('Product feedback');
            setModalContent(
                <>
                    <div />
                    <p>
                        <strong>Order code:</strong> {order?.orderCode}
                    </p>
                    <p>
                        <strong>Order date:</strong> {order?.orderDate}
                    </p>
                    <p>
                        <strong>Seller:</strong> {order?.user?.username}
                    </p>
                    <p>
                        <strong>Product name:</strong>{' '}
                        {order?.product?.productName}
                    </p>
                    <p>
                        <strong>Quantity:</strong> {order?.quantity}
                    </p>
                    <p>
                        <strong>Price:</strong> {order?.price}
                    </p>
                    <p>
                        <strong>Discount:</strong>{' '}
                        {order?.coupon?.discountValue}
                    </p>
                    <p>
                        <strong>Status:</strong> {order?.orderStatus}
                    </p>
                    <p>
                        <strong>Total amount:</strong> {order?.totalAmount}
                    </p>
                </>
            );
        }

        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
        setModalTitle('');
        setModalContent(null);
    };

    return (
        <div className="flex flex-col border py-[40px] px-[46px] rounded-[15px] border-border_color bg-white gap-[35px]">
            <div className="flex justify-between items-center">
                <h1 className="text-[24px] font-[700] font-beausans">
                    Order Manager
                </h1>
            </div>
            <div className="flex w-full">
                <Input
                    display="inherit"
                    type="search"
                    className="rounded-[86px] w-inherit"
                    placeHolder="What do you want to find ?"
                />
                <select
                    name=""
                    id=""
                    className="mt-[16px] w-[185px] ml-[30px] bg-white border-[2px] border-border_color rounded-[15px] focus:border-green_main p-[12px]"
                >
                    <option value="order-date">Order date</option>
                    <option value="seller">Seller</option>
                </select>
            </div>
            <div>
                {loading ? (
                    <OrderTableSkeleton />
                ) : (
                    <div className="flex justify-center">
                        <div className="w-[940px] overflow-x-auto scrollbar scrollbar-thin scrollbar-thumb-green">
                            <table className="w-full table-auto border-collapse bg-white shadow-md rounded-lg">
                                <thead className="bg-[#F7F7F7]">
                                    <tr className="flex">
                                        <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                            Action
                                        </th>
                                        <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                            Order Code
                                        </th>
                                        <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                            Order Date
                                        </th>
                                        <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                            Seller
                                        </th>
                                        <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                            Product Name
                                        </th>
                                        <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                            Quantity
                                        </th>
                                        <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                            Price
                                        </th>
                                        <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                            Reduce
                                        </th>
                                        <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                            Status
                                        </th>
                                        <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[190px]">
                                            Total Money
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map((order) => (
                                        <tr
                                            key={order.orderCode}
                                            className="border-t border-gray-200 flex"
                                        >
                                            <td className="p-4 text-[18px] font-[400] text-gray-700 text-left w-[190px] flex-col flex">
                                                <a
                                                    onClick={() =>
                                                        handleOpenModal(
                                                            order,
                                                            'data'
                                                        )
                                                    }
                                                    className="text-green_main underline cursor-pointer"
                                                >
                                                    Get product data
                                                </a>
                                                <a
                                                    onClick={() =>
                                                        handleOpenModal(
                                                            order,
                                                            'feedback'
                                                        )
                                                    }
                                                    className="text-green_main underline cursor-pointer"
                                                >
                                                    Product feedback
                                                </a>
                                                <a
                                                    onClick={() =>
                                                        handleOpenModal(
                                                            order,
                                                            'complain'
                                                        )
                                                    }
                                                    className="text-green_main underline cursor-pointer"
                                                >
                                                    Complain
                                                </a>
                                                <a
                                                    onClick={() =>
                                                        handleOpenModal(
                                                            order,
                                                            'chat'
                                                        )
                                                    }
                                                    className="text-green_main underline cursor-pointer"
                                                >
                                                    Chat
                                                </a>
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[190px]">
                                                {order.orderCode}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[190px]">
                                                {order.orderDate}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[190px]">
                                                {order.user?.username}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[190px]">
                                                {order.product?.productName}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[190px]">
                                                {order.quantity}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[190px]">
                                                {order.price}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[190px]">
                                                {order.coupon?.discountValue}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[190px]">
                                                {order.orderStatus}
                                            </td>
                                            <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[190px]">
                                                {order.totalAmount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && selectedOrder && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    buttonTitle="Close"
                    title={modalTitle}
                >
                    {modalContent}
                </Modal>
            )}
        </div>
    );
}
