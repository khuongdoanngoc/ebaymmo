'use client';

import Input from '@/components/BaseUI/Input';
import Modal from '@/components/BaseUI/Modal';
import { useState } from 'react';

interface Deposit {
    depositDate: string;
    depositId: string;
    depositStatus: string;
    paymentMethod: string;
    amount: number;
}

interface Withdrawal {
    withdrawalId: string;
    paymentMethod: string;
    amount: number;
    createAt: string;
}

interface Transaction {
    transactionId: string;
    transactionDate: string;
    paymentMethod: string;
    amount: number;
    status: string;
}

interface UserData {
    userId: string;
    transactions: Transaction[];
    deposits: Deposit[];
    withdrawals: Withdrawal[];
}

export default function TransactionHistoryContent() {
    const userData: UserData = {
        userId: 'user123',
        transactions: [
            {
                transactionId: 'TX001',
                transactionDate: '2025-02-14',
                paymentMethod: 'Credit Card',
                amount: 150000,
                status: 'Completed'
            },
            {
                transactionId: 'TX002',
                transactionDate: '2025-02-13',
                paymentMethod: 'PayPal',
                amount: 300000,
                status: 'Pending'
            }
        ],
        deposits: [
            {
                depositDate: '2025-02-12',
                depositId: 'D001',
                depositStatus: 'Completed',
                paymentMethod: 'Bank Transfer',
                amount: 100000
            }
        ],
        withdrawals: [
            {
                withdrawalId: 'W001',
                paymentMethod: 'Credit Card',
                amount: 50000,
                createAt: '2025-02-10'
            }
        ]
    };

    return (
        <div className="flex flex-col border py-[40px] px-[46px] rounded-[15px] border-border_color bg-white gap-[35px]">
            <div className="flex justify-between items-center">
                <h1 className="text-[24px] font-[700] font-beausans">
                    Transaction History
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
                    <option value="transaction-date">Transaction Date</option>
                    <option value="payment-method">Payment Method</option>
                </select>
            </div>

            <div className="flex justify-center">
                <div className="w-[940px] overflow-x-auto scrollbar scrollbar-thin scrollbar-thumb-green">
                    <table className="w-full border-collapse bg-white shadow-md rounded-lg">
                        <thead className="bg-[#F7F7F7]">
                            <tr className="flex">
                                <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[230px]">
                                    Transaction Date
                                </th>
                                <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[230px]">
                                    Payment Method
                                </th>
                                <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[230px]">
                                    Amount
                                </th>
                                <th className="text-[18px] font-[700] py-[16px] px-[16px] text-left text-gray-700 w-[230px]">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {userData.transactions.map((transaction) => (
                                <tr
                                    key={transaction.transactionId}
                                    className="border-t border-gray-200 flex"
                                >
                                    <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[230px]">
                                        {transaction.transactionDate}
                                    </td>
                                    <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[230px]">
                                        {transaction.paymentMethod}
                                    </td>
                                    <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[230px]">
                                        {transaction.amount}
                                    </td>
                                    <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[230px]">
                                        {transaction.status}
                                    </td>
                                </tr>
                            ))}

                            {userData.deposits.map((deposit) => (
                                <tr
                                    key={deposit.depositId}
                                    className="border-t border-gray-200 flex"
                                >
                                    <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[230px]">
                                        {deposit.depositDate}
                                    </td>
                                    <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[230px]">
                                        {deposit.paymentMethod}
                                    </td>
                                    <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[230px]">
                                        {deposit.amount}
                                    </td>
                                    <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[230px]">
                                        {deposit.depositStatus}
                                    </td>
                                </tr>
                            ))}

                            {userData.withdrawals.map((withdrawal) => (
                                <tr
                                    key={withdrawal.withdrawalId}
                                    className="border-t border-gray-200 flex"
                                >
                                    <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[230px]">
                                        {withdrawal.createAt}
                                    </td>
                                    <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[230px]">
                                        {withdrawal.paymentMethod}
                                    </td>
                                    <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[230px]">
                                        {withdrawal.amount}
                                    </td>
                                    <td className="py-[16px] px-[16px] text-[18px] font-[400] text-gray-700 text-left w-[230px]" />
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
