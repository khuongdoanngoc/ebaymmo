import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Users,
    Store,
    ShoppingCart,
    DollarSign,
    Wallet,
    CreditCard,
    TrendingUp
} from 'lucide-react';

import {
    DashboardStats,
    mockDashboardData
} from './dashboard-components/ChartData';
import RevenueChart from './dashboard-components/RevenueChart';
import SalesChart from './dashboard-components/SalesChart';
import StatusCard from './dashboard-components/StatusCard';
import StatCard from './dashboard-components/StatCard';
import OrderStatusChart from './dashboard-components/OrderStatusChart';
import { useGetDashboardStatsQuery } from '@/generated/graphql';

const calculateGrowth = (current?: number, previous?: number): number => {
    if (!previous) return 0;
    if (!current) return -100;
    return Number((((current - previous) / previous) * 100).toFixed(2));
};
export default function Dashboard() {
    // For demo purposes, we'll use mock data instead of relying on the API
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const thisWeek = new Date(today);
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());

    const lastWeek = new Date(thisWeek);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekEnd = new Date(lastWeek);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfThisMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
    );

    const lastMonth = new Date(thisMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthEnd = new Date(
        lastMonth.getFullYear(),
        lastMonth.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
    );
    const { data } = useGetDashboardStatsQuery({
        variables: {
            today,
            yesterday,
            yesterdayEnd,
            thisWeek,
            lastWeek,
            lastWeekEnd,
            startOfThisMonth: thisMonth,
            endOfThisMonth,
            lastMonth,
            lastMonthEnd
        }
    });

    const demoStats = useMemo(() => mockDashboardData, []);

    const transformedData: any = {
        users: {
            total: data?.users_total?.aggregate?.count || 0,
            active: data?.users_active?.aggregate?.count || 0,
            suspended: data?.users_suspended?.aggregate?.count || 0,
            growth: calculateGrowth(
                data?.users_this_month?.aggregate?.count,
                data?.users_last_month?.aggregate?.count
            )
        },
        stores: {
            total: data?.stores_total?.aggregate?.count || 0,
            active: data?.stores_active?.aggregate?.count || 0,
            pending: data?.stores_pending?.aggregate?.count || 0,
            growth: calculateGrowth(
                data?.stores_this_month?.aggregate?.count,
                data?.stores_last_month?.aggregate?.count
            )
        },
        orders: {
            total: data?.orders_total?.aggregate?.count || 0,
            completed: data?.orders_completed?.aggregate?.count || 0,
            pending: data?.orders_pending?.aggregate?.count || 0,
            totalAmount: data?.orders_total?.aggregate?.sum?.totalAmount || 0,
            growth: calculateGrowth(
                data?.orders_this_month?.aggregate?.count,
                data?.orders_last_month?.aggregate?.count
            )
        },
        revenue: {
            today: data?.revenue_today?.aggregate?.sum?.totalAmount || 0,
            yesterday:
                data?.revenue_yesterday?.aggregate?.sum?.totalAmount || 0,
            thisWeek: data?.revenue_this_week?.aggregate?.sum?.totalAmount || 0,
            lastWeek: data?.revenue_last_week?.aggregate?.sum?.totalAmount || 0,
            thisMonth:
                data?.revenue_this_month?.aggregate?.sum?.totalAmount || 0,
            lastMonth:
                data?.revenue_last_month?.aggregate?.sum?.totalAmount || 0
        }
    };

    // Simulating API call (disabled for demo)
    const { isLoading } = useQuery<DashboardStats>({
        queryKey: ['admin', 'dashboard-stats'],
        queryFn: () =>
            api.get('/admin/dashboard/stats').then((res) => res.data),
        enabled: false // Disable the actual API call for now
    });

    const formatNumber = (num: number) => num.toLocaleString();

    return (
        <div className="p-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">
                    Admin Dashboard
                </h1>
                <p className="text-muted-foreground">
                    Overview of your marketplace performance and statistics.
                </p>
            </div>

            {/* Key stats row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={formatNumber(transformedData?.users.total)}
                    icon={Users}
                    description={`${formatNumber(transformedData?.users.active)} active users`}
                    trend={transformedData?.users.growth}
                    loading={isLoading}
                />
                <StatCard
                    title="Active Stores"
                    value={formatNumber(transformedData?.stores.active)}
                    icon={Store}
                    description={`${transformedData?.stores.pending} stores awaiting approval`}
                    trend={transformedData?.stores.growth}
                    loading={isLoading}
                />
                <StatCard
                    title="Total Orders"
                    value={formatNumber(transformedData?.orders.total)}
                    icon={ShoppingCart}
                    description={`${formatNumber(transformedData?.orders.pending)} pending orders`}
                    trend={transformedData?.orders.growth}
                    loading={isLoading}
                />
                <StatCard
                    title="Revenue"
                    value={`${formatNumber(transformedData?.revenue.thisMonth)} USDT`}
                    icon={DollarSign}
                    description="Total revenue this month"
                    trend={Number(
                        (
                            ((transformedData?.revenue.thisMonth -
                                transformedData?.revenue.lastMonth) /
                                transformedData?.revenue.lastMonth) *
                            100
                        ).toFixed(2)
                    )}
                    loading={isLoading}
                />
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                <RevenueChart />
                <OrderStatusChart />
            </div>

            {/* Transactions & Sales section */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
                <SalesChart />

                {/* Financial Cards - 4 columns */}
                <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatusCard
                        title="Deposits"
                        value={`${formatNumber(demoStats.deposits.totalAmount)} USDT`}
                        icon={Wallet}
                        description="Total deposits amount"
                        items={[
                            {
                                label: 'Completed',
                                value: formatNumber(
                                    demoStats.deposits.completed
                                ),
                                color: '#16a34a'
                            },
                            {
                                label: 'Pending',
                                value: formatNumber(demoStats.deposits.pending),
                                color: '#eab308'
                            }
                        ]}
                    />

                    <StatusCard
                        title="Withdrawals"
                        value={`${formatNumber(demoStats.withdrawals.totalAmount)} USDT`}
                        icon={CreditCard}
                        description="Total withdrawals amount"
                        items={[
                            {
                                label: 'Completed',
                                value: formatNumber(
                                    demoStats.withdrawals.completed
                                ),
                                color: '#16a34a'
                            },
                            {
                                label: 'Pending',
                                value: formatNumber(
                                    demoStats.withdrawals.pending
                                ),
                                color: '#eab308'
                            }
                        ]}
                        trend={{
                            value: demoStats.withdrawals.growth,
                            label: 'from previous month'
                        }}
                    />

                    <StatusCard
                        title="Weekly Growth"
                        value="+8.4%"
                        icon={TrendingUp}
                        description="Compared to previous week"
                        items={[
                            {
                                label: 'Orders',
                                value: '+12.5%',
                                color: '#3b82f6'
                            },
                            {
                                label: 'Revenue',
                                value: '+9.2%',
                                color: '#3b82f6'
                            },
                            { label: 'Users', value: '+6.8%', color: '#3b82f6' }
                        ]}
                    />

                    <StatusCard
                        title="System Status"
                        value="All Systems Operational"
                        icon={() => (
                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                        )}
                        description=""
                        items={[
                            {
                                label: 'API',
                                value: '99.9% uptime',
                                color: '#16a34a'
                            },
                            {
                                label: 'Website',
                                value: '100% uptime',
                                color: '#16a34a'
                            },
                            {
                                label: 'Database',
                                value: '99.99% uptime',
                                color: '#16a34a'
                            }
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}
