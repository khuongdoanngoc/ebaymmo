import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';
import {
    OrderBy,
    useGetAnalyticStatsQuery,
    useGetFromLastMonthQuery,
    useTopPerformingStoresSubscription,
    useTopSellingProductsSubscription,
    useGetOrderDailyQuery
} from '@/generated/graphql';

interface AnalyticsData {
    revenue: {
        daily: { date: string; amount: number }[];
        monthly: { month: string; amount: number }[];
    };
    orders: {
        daily: { date: string; count: number }[];
        byStatus: { status: string; count: number }[];
    };
    users: {
        newSignups: { date: string; count: number }[];
        activeUsers: { date: string; count: number }[];
    };
    topProducts: {
        id: string;
        name: string;
        sales: number;
        revenue: number;
    }[];
    topStores: {
        id: string;
        name: string;
        sales: number;
        revenue: number;
    }[];
}

const calculateGrowth = (current?: number, previous?: number): number => {
    if (!previous) return 0;
    if (!current) return -100;
    return Number((((current - previous) / previous) * 100).toFixed(2));
};

const ChartCard = ({
    title,
    description,
    children
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) => (
    <Card className="w-full">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent>{children}</CardContent>
    </Card>
);

const getDateRange = (range: string) => {
    const now = new Date();
    const end = new Date(now.setHours(23, 59, 59, 999));
    let start = new Date();

    switch (range) {
        case '7days':
            start = new Date(now);
            start.setDate(start.getDate() - 7);
            break;
        case '30days':
            start = new Date(now);
            start.setDate(start.getDate() - 30);
            break;
        case '90days':
            start = new Date(now);
            start.setDate(start.getDate() - 90);
            break;
        case 'year':
            start = new Date(now.getFullYear(), 0, 1); // Đầu năm hiện tại
            break;
        default:
            start = new Date(now);
            start.setDate(start.getDate() - 7);
    }

    start.setHours(0, 0, 0, 0);
    return { start, end };
};

export default function Analytics() {
    const [timeRange, setTimeRange] = useState('7days');

    const queryVariables = useMemo(() => {
        const range = getDateRange(timeRange);
        return {
            where: {
                orderDate: {
                    _gte: range.start,
                    _lte: range.end
                }
            }
        };
    }, [timeRange]);

    const { data, isLoading } = useQuery<AnalyticsData>({
        queryKey: ['admin', 'analytics', timeRange],
        queryFn: () => {
            // Ngay lập tức trả về dữ liệu giả thay vì gọi API
            return Promise.resolve(generateMockData());

            // Nếu muốn sử dụng cả API thật và dữ liệu giả, bạn có thể dùng:
            // return api.get(`/admin/analytics?range=${timeRange}`)
            //   .then((res) => res.data)
            //   .catch(() => generateMockData());
        },
        retry: false, // Tắt cơ chế retry
        staleTime: 60000 // Cache kết quả trong 1 phút
    });

    const generateMockData = (): AnalyticsData => {
        const dailyRevenue = Array(30)
            .fill(0)
            .map((_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0],
                amount: Math.floor(Math.random() * 5000) + 1000
            }));

        const monthlyRevenue = Array(12)
            .fill(0)
            .map((_, i) => ({
                month: new Date(2023, i, 1).toLocaleString('default', {
                    month: 'short'
                }),
                amount: Math.floor(Math.random() * 50000) + 10000
            }));

        const dailyOrders = Array(30)
            .fill(0)
            .map((_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0],
                count: Math.floor(Math.random() * 100) + 20
            }));

        const ordersByStatus = [
            { status: 'Completed', count: 258 },
            { status: 'Processing', count: 147 },
            { status: 'Shipped', count: 115 },
            { status: 'Cancelled', count: 32 }
        ];

        const newSignups = Array(30)
            .fill(0)
            .map((_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0],
                count: Math.floor(Math.random() * 50) + 5
            }));

        const activeUsers = Array(30)
            .fill(0)
            .map((_, i) => ({
                date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0],
                count: Math.floor(Math.random() * 500) + 100
            }));

        const topProducts = Array(10)
            .fill(0)
            .map((_, i) => ({
                id: `prod-${i + 1}`,
                name: `Product ${i + 1}`,
                sales: Math.floor(Math.random() * 300) + 50,
                revenue: Math.floor(Math.random() * 15000) + 3000
            }));

        const topStores = Array(10)
            .fill(0)
            .map((_, i) => ({
                id: `store-${i + 1}`,
                name: `Store ${i + 1}`,
                sales: Math.floor(Math.random() * 500) + 100,
                revenue: Math.floor(Math.random() * 50000) + 10000
            }));

        return {
            revenue: { daily: dailyRevenue, monthly: monthlyRevenue },
            orders: { daily: dailyOrders, byStatus: ordersByStatus },
            users: { newSignups, activeUsers },
            topProducts,
            topStores
        };
    };
    const now = new Date();
    const today = new Date(now.setHours(0, 0, 0, 0));
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
    const { data: fromLastMonth } = useGetFromLastMonthQuery({
        variables: {
            endOfThisMonth,
            lastMonthEnd,
            startOfThisMonth: thisMonth,
            lastMonth
        },
        fetchPolicy: 'network-only'
    });
    const { data: topSellingProducts } = useTopSellingProductsSubscription({
        variables: {
            limit: 5,
            offset: 0,
            orderBy: { soldCount: OrderBy.Desc },
            where: { soldCount: { _isNull: false } }
        },
        fetchPolicy: 'network-only'
    });

    const productsWithRevenue = useMemo(() => {
        if (!topSellingProducts?.products) return [];

        return topSellingProducts.products.map((product) => ({
            ...product,
            revenue: product.price * (product.soldCount || 0)
        }));
    }, [topSellingProducts?.products]);

    const totalRevenue = useMemo(() => {
        return productsWithRevenue.reduce(
            (total, product) => total + product.revenue,
            0
        );
    }, [productsWithRevenue]);

    const { data: topPerformingStores } = useTopPerformingStoresSubscription({
        variables: {
            limit: 5,
            offset: 0,
            orderBy: { quantity: OrderBy.Desc },
            where: { quantity: { _isNull: false } }
        },
        fetchPolicy: 'network-only'
    });

    const { data: analyticStats } = useGetAnalyticStatsQuery({
        variables: {
            startDate: getDateRange(timeRange).start,
            endDate: getDateRange(timeRange).end
        },
        fetchPolicy: 'network-only'
    });

    const storesWithRevenue = useMemo(() => {
        if (!topPerformingStores?.orders) return [];
        return topPerformingStores.orders.map((order) => ({
            ...order,
            revenue: order.price * (order.quantity || 0)
        }));
    }, [topPerformingStores?.orders]);

    const totalRevenueStores = useMemo(() => {
        return storesWithRevenue.reduce(
            (total, store) => total + store.revenue,
            0
        );
    }, [storesWithRevenue]);

    const displayData = data as AnalyticsData;

    const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTimeRange(e.target.value);
    };

    const userGrowth = calculateGrowth(
        fromLastMonth?.users_this_month?.aggregate?.count,
        fromLastMonth?.users_last_month?.aggregate?.count
    );

    const storeGrowth = calculateGrowth(
        fromLastMonth?.stores_this_month?.aggregate?.count,
        fromLastMonth?.stores_last_month?.aggregate?.count
    );

    const orderGrowth = calculateGrowth(
        fromLastMonth?.orders_this_month?.aggregate?.count,
        fromLastMonth?.orders_last_month?.aggregate?.count
    );

    const revenueGrowth = calculateGrowth(
        fromLastMonth?.revenue_this_month?.aggregate?.sum?.totalAmount,
        fromLastMonth?.revenue_last_month?.aggregate?.sum?.totalAmount
    );

    const { data: orderData, loading: orderLoading } = useGetOrderDailyQuery({
        variables: queryVariables,
        fetchPolicy: 'network-only'
    });

    const formatOrderData = (data: any) => {
        if (!data?.ordersPerDay) return [];

        return data.ordersPerDay.map((item: any) => ({
            date: new Date(item.orderDate).toLocaleDateString(),
            count: item.totalOrders
        }));
    };

    const formattedOrderData = useMemo(
        () => formatOrderData(orderData),
        [orderData]
    );

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                <div className="flex items-center space-x-2">
                    <select
                        className="border rounded-md px-3 py-1 bg-background"
                        value={timeRange}
                        onChange={handleRangeChange}
                    >
                        <option value="7days">Last 7 days</option>
                        <option value="30days">Last 30 days</option>
                        <option value="90days">Last 90 days</option>
                        <option value="year">This year</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                            Total Revenue
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? (
                                <div className="h-8 bg-muted/20 rounded animate-pulse w-24"></div>
                            ) : (
                                `${analyticStats?.revenue_in_range?.aggregate?.sum?.totalAmount || '0'} USDT`
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {`${revenueGrowth}% from last month`}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                            Orders
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? (
                                <div className="h-8 bg-muted/20 rounded animate-pulse w-24"></div>
                            ) : (
                                `${analyticStats?.orders_in_range?.aggregate?.count || '0'}`
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {`${orderGrowth}% from last month`}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                            New Users
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? (
                                <div className="h-8 bg-muted/20 rounded animate-pulse w-24"></div>
                            ) : (
                                `${analyticStats?.users_in_range?.aggregate?.count || '0'}`
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {`${userGrowth}% from last month`}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                            Active Stores
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {isLoading ? (
                                <div className="h-8 bg-muted/20 rounded animate-pulse w-24"></div>
                            ) : (
                                `${analyticStats?.stores_in_range?.aggregate?.count || '0'}`
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {`${storeGrowth}% from last month`}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <ChartCard
                    title="Revenue Over Time"
                    description="Daily revenue for the selected period"
                >
                    {isLoading ? (
                        <div className="h-80 bg-muted/20 rounded animate-pulse"></div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                                data={displayData.revenue.daily}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis
                                    tickFormatter={(value) => `${value} USDT`}
                                />
                                <Tooltip
                                    formatter={(value) => [
                                        `${value} USDT`,
                                        'Revenue'
                                    ]}
                                    labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="amount"
                                    stroke="#8884d8"
                                    name="Revenue"
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>
                <ChartCard
                    title="Orders Over Time"
                    description="Daily order count for the selected period"
                >
                    {orderLoading ? (
                        <div className="h-80 bg-muted/20 rounded animate-pulse"></div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart
                                data={formattedOrderData}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 5
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip
                                    formatter={(value) => [value, 'Orders']}
                                    labelFormatter={(label) => `Date: ${label}`}
                                />
                                <Legend />
                                <Bar
                                    dataKey="count"
                                    name="Orders"
                                    fill="#82ca9d"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Top Selling Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                {Array(5)
                                    .fill(0)
                                    .map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-12 bg-muted/20 rounded animate-pulse"
                                        ></div>
                                    ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 text-sm font-medium text-muted-foreground">
                                    <div>Product</div>
                                    <div className="text-right">Sold</div>
                                    <div className="text-right">Price</div>
                                    <div className="text-right">Revenue</div>
                                </div>
                                <div className="space-y-2">
                                    {productsWithRevenue.map((product, i) => (
                                        <div
                                            key={i}
                                            className="grid grid-cols-4 items-center"
                                        >
                                            <div className="font-medium">
                                                {product.productName}
                                            </div>
                                            <div className="text-right">
                                                <strong>
                                                    {product.soldCount}
                                                </strong>
                                            </div>
                                            <div className="text-right">
                                                <strong>
                                                    {product.price.toLocaleString()}{' '}
                                                </strong>
                                                USDT
                                            </div>
                                            <div className="text-right">
                                                <strong>
                                                    {product.revenue.toLocaleString()}{' '}
                                                </strong>
                                                USDT
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="grid grid-cols-4">
                                        <div className="col-span-3 font-medium text-right">
                                            Total Revenue:
                                        </div>
                                        <div className="text-right font-bold">
                                            {totalRevenue.toLocaleString()} USDT
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Top Performing Stores</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                {Array(5)
                                    .fill(0)
                                    .map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-12 bg-muted/20 rounded animate-pulse"
                                        ></div>
                                    ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-4 text-sm font-medium text-muted-foreground">
                                    <div>Stores</div>
                                    <div className="text-right">Orders</div>
                                    <div className="text-right">Price</div>
                                    <div className="text-right">Revenue</div>
                                </div>
                                <div className="space-y-2">
                                    {storesWithRevenue.map((order, i) => (
                                        <div
                                            key={i}
                                            className="grid grid-cols-4 items-center"
                                        >
                                            <div className="font-medium">
                                                {
                                                    order.product?.store
                                                        ?.storeName
                                                }
                                            </div>
                                            <div className="text-right">
                                                <strong>
                                                    {order.quantity}
                                                </strong>
                                            </div>
                                            <div className="text-right">
                                                <strong>
                                                    {order.price.toLocaleString()}{' '}
                                                </strong>
                                                USDT
                                            </div>
                                            <div className="text-right">
                                                <strong>
                                                    {order.revenue.toLocaleString()}{' '}
                                                </strong>
                                                USDT
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="grid grid-cols-4">
                                        <div className="col-span-3 font-medium text-right">
                                            Total Revenue:
                                        </div>
                                        <div className="text-right font-bold">
                                            {totalRevenueStores.toLocaleString()}{' '}
                                            USDT
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
