import React from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useGetMonthlyRevenueQuery } from '@/generated/graphql';

interface RevenueChartProps {
    title?: string;
    description?: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({
    title = 'Revenue Overview',
    description = 'Monthly revenue for the current year'
}) => {
    // Tạo biến ngày bắt đầu và kết thúc động dựa trên năm hiện tại
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // Ngày 1 tháng 1 năm hiện tại
    const endDate = new Date(currentYear + 1, 0, 1); // Ngày 1 tháng 1 năm tiếp theo

    const { data: apiData } = useGetMonthlyRevenueQuery({
        variables: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        }
    });

    // Chuyển đổi dữ liệu API sang định dạng cho biểu đồ
    const transformedData = React.useMemo(() => {
        // Tạo mảng tháng mặc định, tất cả các tháng đều có total = 0
        const months = [
            { name: 'Jan', total: 0 },
            { name: 'Feb', total: 0 },
            { name: 'Mar', total: 0 },
            { name: 'Apr', total: 0 },
            { name: 'May', total: 0 },
            { name: 'Jun', total: 0 },
            { name: 'Jul', total: 0 },
            { name: 'Aug', total: 0 },
            { name: 'Sep', total: 0 },
            { name: 'Oct', total: 0 },
            { name: 'Nov', total: 0 },
            { name: 'Dec', total: 0 }
        ];

        // Nếu có dữ liệu API thì cập nhật vào mảng tương ứng
        if (apiData?.monthlyRevenue) {
            apiData.monthlyRevenue.forEach((item) => {
                const date = new Date(item.month);
                const monthIndex = date.getMonth(); // 0 for Jan, 1 for Feb, etc.
                months[monthIndex].total = item.totalAmount;
            });
        }

        return months;
    }, [apiData]);

    return (
        <Card className="lg:col-span-4">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={transformedData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                        <Tooltip
                            formatter={(value: number) => [
                                `$${value.toLocaleString()}`,
                                'Revenue'
                            ]}
                            labelFormatter={(label) => `Month: ${label}`}
                        />
                        <Bar
                            dataKey="total"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default RevenueChart;
