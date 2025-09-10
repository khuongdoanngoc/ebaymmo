'use client';

import Table from '@/components/BaseUI/Table';
import TooltipDropdown from '@/components/ToolTipDropDown/TooltipDropdown';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';

const ResellerHistory = () => {
    const [activeTab, setActiveTab] = useState('product');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const productColumns = [
        { header: 'Store', accessor: 'resellerStore' },
        { header: 'Reseller Link', accessor: 'resellerLink' },
        {
            header: 'Commission %',
            accessor: 'commissionPercentage',
            sortable: true
        },
        { header: 'Request Date', accessor: 'requestDate', sortable: true },
        { header: 'Status', accessor: 'statusStyle' }
    ];

    const historyColumns = [
        { header: 'Order ID', accessor: 'orderId', sortable: true },
        { header: 'Purchase Date', accessor: 'purchaseDate', sortable: true },
        { header: 'Store', accessor: 'store' },
        { header: 'Quantity', accessor: 'quantity', sortable: true },
        { header: 'Unit Price', accessor: 'unitPrice' },
        { header: 'Total Amount', accessor: 'totalAmount', sortable: true },
        { header: 'Discount', accessor: 'discount' },
        { header: 'Commission', accessor: 'commission' },
        { header: 'Commission Account', accessor: 'commissionAccount' },
        { header: 'Status', accessor: 'statusStyle' }
    ];

    const productData = [
        {
            resellerStore: 'money0ygp2',
            resellerLink: '1000',
            commissionPercentage: '10%',
            requestDate: '17/05/2023',
            statusStyle: 'Withdrawn'
        },
        {
            resellerStore: 'money0ygp2',
            resellerLink: '1000',
            commissionPercentage: '10%',
            requestDate: '17/05/2023',
            statusStyle: 'Withdrawn'
        },
        {
            resellerStore: 'money0ygp2',
            resellerLink: '1000',
            commissionPercentage: '10%',
            requestDate: '17/05/2023',
            statusStyle: 'Pending'
        },
        {
            resellerStore: 'money0ygp2',
            resellerLink: '1000',
            commissionPercentage: '10%',
            requestDate: '17/05/2023',
            statusStyle: 'Pending'
        },
        {
            resellerStore: 'money0ygp2',
            resellerLink: '1000',
            commissionPercentage: '10%',
            requestDate: '17/05/2023',
            statusStyle: 'Cancelled'
        },
        {
            resellerStore: 'money0ygp2',
            resellerLink: '1000',
            commissionPercentage: '10%',
            requestDate: '17/05/2023',
            statusStyle: 'Cancelled'
        }
    ];

    const historyData = [
        {
            orderId: '1',
            purchaseDate: '17/05/2023',
            store: 'money0ygp2',
            quantity: '1000',
            unitPrice: '1000',
            totalAmount: '1000',
            discount: '1000',
            commission: '1000',
            commissionAccount: '1000',
            statusStyle: 'Withdrawn'
        },
        {
            orderId: '2',
            purchaseDate: '17/05/2023',
            store: 'money0ygp2',
            quantity: '1000',
            unitPrice: '1000',
            totalAmount: '1000',
            discount: '1000',
            commission: '1000',
            commissionAccount: '1000',
            statusStyle: 'Withdrawn'
        },
        {
            orderId: '3',
            purchaseDate: '17/05/2023',
            store: 'money0ygp2',
            quantity: '1000',
            unitPrice: '1000',
            totalAmount: '1000',
            discount: '1000',
            commission: '1000',
            commissionAccount: '1000',
            statusStyle: 'Cancelled'
        },
        {
            orderId: '4',
            purchaseDate: '17/05/2023',
            store: 'money0ygp2',
            quantity: '1000',
            unitPrice: '1000',
            totalAmount: '1000',
            discount: '1000',
            commission: '1000',
            commissionAccount: '1000',
            statusStyle: 'Pending'
        }
    ];

    return (
        <div className="p-6 lg:p-10 border-black-700 border-[1px] rounded-[15px] mx-auto w-[1200px] max-w-[100%]">
            {loading ? (
                <div className="flex flex-col border py-[40px] px-[46px] rounded-[15px] border-border_color bg-white gap-[35px]">
                    <div className="flex items-center mb-6">
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                        <div className="ml-2 h-5 w-5 bg-gray-200 rounded animate-pulse" />
                    </div>

                    <div className="flex gap-4 mb-6">
                        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>

                    <div className="space-y-4 min-h-[400px]">
                        {[...Array(5)].map((_, index) => (
                            <div key={index} className="flex gap-4">
                                <div className="h-12 w-full bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col border py-[40px] px-[46px] rounded-[15px] border-border_color bg-white gap-[35px]">
                    <div className="flex items-center mb-6">
                        <h1 className="text-[20px] md:text-[24px] font-beausans">
                            Reseller Store
                        </h1>
                        <TooltipDropdown>
                            <span className="flex items-center ml-1 cursor-pointer p-2">
                                <Image
                                    src="/images/tiptool.svg"
                                    alt="tiptool"
                                    width={16}
                                    height={16}
                                    className="md:w-[20px] md:h-[20px]"
                                />
                            </span>
                            <div className="p-2 md:p-3">
                                <p className="text-[14px] md:text-[16px]">
                                    <span className="text-red-500">
                                        *Note:{' '}
                                    </span>
                                    Customers only need to visit once using your
                                    referral link, we will save cookies and
                                    apply commission sharing for all subsequent
                                    orders (if your ref is still approved by the
                                    store owner)
                                </p>
                            </div>
                        </TooltipDropdown>
                    </div>

                    <div className="flex gap-4 mb-6 border-b border-border_color text-[16px] md:text-[18px]">
                        <button
                            className={`h-10 px-4 md:px-6 py-2 ${
                                activeTab === 'product'
                                    ? 'text-primary-300 border-b-2 border-primary-400'
                                    : 'text-gray-500'
                            }`}
                            onClick={() => setActiveTab('product')}
                        >
                            Product List
                        </button>
                        <button
                            className={`h-10 px-4 md:px-6 py-2 ${
                                activeTab === 'history'
                                    ? 'text-primary-300 border-b-2 border-primary-400'
                                    : 'text-gray-500'
                            }`}
                            onClick={() => setActiveTab('history')}
                        >
                            History
                        </button>
                    </div>

                    <div className="overflow-auto max-h-[400px] md:max-h-[600px]">
                        {activeTab === 'product' ? (
                            <Table
                                columns={productColumns}
                                data={productData}
                            />
                        ) : (
                            <Table
                                columns={historyColumns}
                                data={historyData}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResellerHistory;
