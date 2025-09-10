import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, UserCheck } from 'lucide-react';

interface CustomerStatisticsProps {
    stats: {
        total: number;
        users: number;
        sellers: number;
        active: number;
        totalStores: number;
    };
}

export default function CustomerStatistics({ stats }: CustomerStatisticsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">
                        Total Customers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">Users</CardTitle>
                </CardHeader>
                <CardContent className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{stats.users}</div>
                    <UserCheck className="h-4 w-4 text-blue-500" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">
                        Sellers
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">{stats.sellers}</div>
                    <Store className="h-4 w-4 text-purple-500" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">
                        Total Stores
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex items-baseline justify-between">
                    <div className="text-2xl font-bold">
                        {stats.totalStores}
                    </div>
                    <Store className="h-4 w-4 text-indigo-500" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium">
                        Active
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.active}</div>
                </CardContent>
            </Card>
        </div>
    );
}
