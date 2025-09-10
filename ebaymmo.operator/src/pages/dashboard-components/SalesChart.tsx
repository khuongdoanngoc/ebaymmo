import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { salesData } from './ChartData';
import { useGetSuccessedOrdersByMonthSubscription } from '@/generated/graphql';

interface SalesChartProps {
    title?: string;
    description?: string;
    data?: typeof salesData;
}

const SalesChart: React.FC<SalesChartProps> = ({
    title = 'Sales Trend',
    description = 'Monthly sales throughout the year'
}) => {
    const { data: successedOrdersByMonth } =
        useGetSuccessedOrdersByMonthSubscription({});

    // Tạo dữ liệu cho tất cả 12 tháng
    const fullYearData = React.useMemo(() => {
        // Mảng tên tất cả các tháng
        const monthNames = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec'
        ];

        // Khởi tạo mảng với 12 tháng, giá trị mặc định là 0
        const allMonths = monthNames.map((name, index) => ({
            monthNumber: index + 1,
            name,
            value: 0
        }));

        // Cập nhật giá trị từ API nếu có
        if (successedOrdersByMonth?.ordersByMonth) {
            successedOrdersByMonth.ordersByMonth.forEach((item) => {
                if (
                    item.monthNumber &&
                    item.monthNumber >= 1 &&
                    item.monthNumber <= 12
                ) {
                    allMonths[item.monthNumber - 1].value =
                        item.successedCount || 0;
                }
            });
        }

        return allMonths;
    }, [successedOrdersByMonth]);

    return (
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={fullYearData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                            formatter={(value: number) => [
                                `${value} orders`,
                                ''
                            ]}
                        />
                        <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{
                                r: 6,
                                stroke: '#8884d8',
                                strokeWidth: 2,
                                fill: 'white'
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default SalesChart;
