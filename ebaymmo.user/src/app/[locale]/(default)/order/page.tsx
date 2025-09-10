'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import SubmitOrder from '@/components/Payment/SubmitOrder';
import Link from 'next/link';

const OrderSuccessPage = () => {
    const searchParams = useSearchParams();
    const orderData = searchParams.get('orderData');

    if (!orderData) {
        return <p>Loading...</p>;
    }

    let parsedOrderData;
    try {
        parsedOrderData = JSON.parse(orderData);
    } catch (error) {
        console.error('Error parsing order data:', error);
        return <p>Invalid order data</p>;
    }

    return (
        <div className="container mx-auto min-h-screen py-10">
            <SubmitOrder order={parsedOrderData} />
        </div>
    );
};

export default OrderSuccessPage;
