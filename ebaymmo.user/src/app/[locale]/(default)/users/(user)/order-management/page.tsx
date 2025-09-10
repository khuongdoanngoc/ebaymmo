'use client';

import { Suspense } from 'react';
import OrderManagementContent from './OrderManagementContent';
import OrderTableSkeleton from '@/components/Skeleton/OrderTableSkeleton';

export default function OrderManagementPage() {
    return (
        <Suspense
            fallback={
                <div className="flex flex-col border py-[40px] px-[46px] rounded-[15px] border-border_color bg-white gap-[35px]">
                    <div className="flex justify-between items-center">
                        <h1 className="text-[24px] font-[700] font-beausans">
                            Order Manager
                        </h1>
                    </div>
                    <OrderTableSkeleton />
                </div>
            }
        >
            <OrderManagementContent />
        </Suspense>
    );
}
