import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StoreStatsProps {
    totalStores: number;
    activeStores: number;
    inactiveStores: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
}

export function StoreStats({
    totalStores,
    activeStores,
    inactiveStores,
    totalProducts,
    totalOrders,
    totalRevenue
}: StoreStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Stores
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalStores}</div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Active: {activeStores}</span>
                        <span>Inactive: {inactiveStores}</span>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Products
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {totalProducts.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        Avg. {(totalProducts / totalStores).toFixed(1)} products
                        per store
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Orders
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {totalOrders.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        Avg. {(totalOrders / totalStores).toFixed(1)} orders per
                        store
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {totalRevenue.toLocaleString() + ' '} USDT
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                        Avg. {totalRevenue / totalStores + ' USDT'} per store
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
