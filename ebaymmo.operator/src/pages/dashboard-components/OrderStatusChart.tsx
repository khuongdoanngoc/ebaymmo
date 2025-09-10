import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { useGetOrderStatusDataQuery } from '@/generated/graphql';

interface OrderStatusChartProps {
    title?: string;
    description?: string;
    colors?: string[];
}

const OrderStatusChart: React.FC<OrderStatusChartProps> = ({
    title = 'Order Status',
    description = 'Distribution of orders by status'
}) => {
    const { data } = useGetOrderStatusDataQuery({
        pollInterval: 5000 // Tự động refetch mỗi 5 giây
    });
    const allOrderStatusData = [
        {
            name: 'Completed',
            value: data?.successed?.aggregate?.count || 0,
            color: '#16a34a'
        },
        {
            name: 'Refunded',
            value: data?.refunded?.aggregate?.count || 0,
            color: '#0ea5e9'
        },
        {
            name: 'Pending',
            value: data?.pending?.aggregate?.count || 0,
            color: '#eab308'
        },
        {
            name: 'Complained',
            value: data?.complained?.aggregate?.count || 0,
            color: '#ef4444'
        }
    ];

    // Filter out statuses with count equal to 0
    const orderStatusData = allOrderStatusData.filter((item) => item.value > 0);
    return (
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                        <Pie
                            data={
                                orderStatusData.length > 0
                                    ? orderStatusData
                                    : []
                            }
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={110}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            labelLine={false}
                        >
                            {orderStatusData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number) => [
                                `${value} orders`,
                                ''
                            ]}
                        />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default OrderStatusChart;
