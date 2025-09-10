import { useState, useEffect } from 'react';
import {
    useGetPendingWithdrawalsCountQuery,
    usePendingWithdrawalsCountSubscription
} from '@/generated/graphql';

export function useWithdrawalCount() {
    const [pendingCount, setPendingCount] = useState(0);

    // Query để lấy dữ liệu ban đầu
    const { data: queryData, refetch } = useGetPendingWithdrawalsCountQuery();

    // Subscription để cập nhật real-time
    const { data: subscriptionData } = usePendingWithdrawalsCountSubscription();

    // Cập nhật từ query ban đầu
    useEffect(() => {
        if (queryData?.pendingWithdrawals?.aggregate?.count !== undefined) {
            setPendingCount(queryData.pendingWithdrawals.aggregate.count);
        }
    }, [queryData]);

    // Cập nhật từ subscription khi có thay đổi
    useEffect(() => {
        if (
            subscriptionData?.withdrawalsAggregate?.aggregate?.count !==
            undefined
        ) {
            setPendingCount(
                subscriptionData.withdrawalsAggregate.aggregate.count
            );
        }
    }, [subscriptionData]);

    return {
        pendingCount,
        refetch
    };
}
