'use client';
import React from 'react';
import Link from 'next/link';
import { formatDateTime } from '@/libs/datetime';
import { useGetProductsByIdQuery } from '@/generated/graphql';

interface SubmitOrderProps {
    order: {
        orderId: string;
        orderCode: string;
        orderDate: string;
        totalAmount: number;
        price: number;
        quantity: number;
        orderStatus: string;
        productId: string;
        discount: number; // Thêm discount vào interface
    };
}
//{ order } : SubmitOrderProps
const SubmitOrder = ({ order }: SubmitOrderProps) => {
    const { data: productData } = useGetProductsByIdQuery({
        variables: {
            productId: order.productId
        }
    });

    const product = productData?.products[0];

    return (
        <div className=" mx-auto p-6 bg-white">
            <div className="text-center mb-6">
                <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 border-2 border-green-600 rounded-full text-green-600 text-4xl">
                    ✔
                </div>
                <h2 className="text-2xl font-semibold">Thank you</h2>
                <p className="text-gray-600 mb-[30px]">
                    Your order has been processed successfully
                </p>
                <Link
                    href={'/user/order-managements'}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                    Your order
                </Link>
            </div>
            <div className="mt-[70px]">
                <div className="flex flex-wrap justify-between items-center mb-[30px] text-center">
                    <div className="flex-1 min-w-[150px] mb-4">
                        <p className="text-gray-600">Order ID</p>
                        <p className="text-lg font-semibold text-green-600">
                            {order.orderCode}
                        </p>
                    </div>
                    <div className="border-l-[2px] border-dashed h-12 hidden md:block" />
                    <div className="flex-1 border-l-[2px] border-dashed md:border-none min-w-[150px] mb-4">
                        <p className="text-gray-600">Order Date</p>
                        <p className="text-lg font-semibold">
                            {formatDateTime(
                                order.orderDate,
                                'DD/MM/YYYY HH:mm'
                            )}
                        </p>
                    </div>
                    <div className="border-l-[2px] border-dashed h-12 hidden md:block" />
                    <div className="flex-1  min-w-[150px] mb-4">
                        <p className="text-gray-600">Total</p>
                        <p className="text-lg font-semibold">
                            {order.totalAmount} USDT
                        </p>
                    </div>
                    <div className="border-l-[2px] border-dashed h-12 hidden md:block" />
                    <div className="flex-1 border-l-[2px] border-dashed md:border-none min-w-[150px] mb-4">
                        <p className="text-gray-600">Discount</p>
                        <p className="text-lg font-semibold">
                            {order.discount ?? 0}
                        </p>
                    </div>
                    <div className="border-l-[2px] border-dashed h-12 hidden md:block" />
                    <div className="flex-1 min-w-[150px] mb-4">
                        <p className="text-gray-600">Payment</p>
                        <p className="text-lg font-semibold text-red-600">
                            {order.totalAmount} USDT
                        </p>
                    </div>
                    <div className="border-l-[2px] border-dashed h-12 hidden md:block" />
                    <div className="flex-1 border-l-[2px] border-dashed md:border-none min-w-[150px] mb-4">
                        <p className="text-gray-600">Status</p>
                        <p className="text-lg font-semibold text-blue-600">
                            Temporary hold
                        </p>
                    </div>
                </div>
                <table className="w-full text-left border mb-[20px] mt-[20px]">
                    <thead>
                        <tr>
                            <th className="border-b py-[20px] px-[30px]">
                                Product
                            </th>
                            <th className="border-b py-[20px] px-[30px]">
                                Quantity
                            </th>
                            <th className="border-b py-[20px] px-[30px]">
                                Price
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border-b py-[20px] px-[30px]">
                                <div className="flex items-center">
                                    {product?.store?.avatar && (
                                        <img
                                            src={product.store.avatar}
                                            alt="Product"
                                            className="w-10 h-10 mr-2"
                                        />
                                    )}
                                    <span>{product?.productName}</span>
                                </div>
                            </td>
                            <td className="border-b py-[20px] px-[30px]">
                                {order.quantity}
                            </td>
                            <td className="border-b py-[20px] px-[30px]">
                                {order.price}
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="mt-4">
                    <p className="text-red-600 text-[20px] font-semibold">
                        Note:
                    </p>
                    <ul className="list-disc list-inside text-primary-600">
                        <li>
                            To get the product you bought: Click on "Order ID"
                        </li>
                        <li>
                            After buying the product, please download it to your
                            machine, check and change the password for all the
                            products you bought. After 1 week, all the products
                            will be deleted from the server. So please save it
                            on your own machine!
                        </li>
                        <li className="text-red-600">
                            If there is any problem with your order, please send
                            a message to the seller, if not resolved, please go
                            to the order history and select Complaint. We will
                            keep the order amount, and if 3 days the store owner
                            does not take any action, we will represent you to
                            refund the seller, if not resolved, please go to the
                            order history and select Complaint. We will keep the
                            order amount, and if 3 days the store owner does not
                            take any action, we will represent you to refund the
                            seller.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SubmitOrder;
