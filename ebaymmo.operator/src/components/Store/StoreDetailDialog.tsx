import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';

type StoreStatus = 'active' | 'inactive' | 'pending' | 'suspended';

interface StoreData {
    id: string;
    name: string;
    sellerName: string;
    sellerId: string;
    email: string;
    productsCount: number;
    ordersCount: number;
    revenue: number;
    rating: number | string;
    dateCreated: string;
    lastActive: string;
    status: StoreStatus;
    verificationStatus: 'verified' | 'unverified';
    address?: string;
    phone?: string;
    category?: string;
    categoryId?: string;
    description?: string;
    logo?: string;
}

interface StoreDetailDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    store: StoreData | null;
    onUpdateStatus: (id: string, status: StoreStatus) => void;
    getNextStatus: (status: StoreStatus) => StoreStatus;
    products?: any[];
    productsLoading?: boolean;
    orders?: any[];
    ordersLoading?: boolean;
}

export function StoreDetailDialog({
    isOpen,
    onOpenChange,
    store,
    onUpdateStatus,
    getNextStatus,
    products = [], // Default to empty array
    productsLoading = false,
    orders = [],
    ordersLoading = false
}: StoreDetailDialogProps) {
    if (!store) return null;
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        {store.logo && (
                            <img
                                src={store.logo}
                                alt={store.name}
                                className="w-10 h-10 rounded-full mr-3"
                            />
                        )}
                        {store.name}
                        {store.verificationStatus === 'verified' && (
                            <Badge className="ml-2 bg-blue-50 text-blue-700">
                                Verified
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="overview">
                    <TabsList className="grid grid-cols-4 mb-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="products">Products</TabsTrigger>
                        <TabsTrigger value="orders">Orders</TabsTrigger>
                        <TabsTrigger value="activity">Activity</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">
                        {/* Store overview content */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 ">
                            <div className="space-y-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Seller Information
                                    </h3>
                                    <p className="text-base">
                                        {store.sellerName}
                                    </p>
                                    <p className="text-sm">{store.email}</p>
                                    <p className="text-sm">{store.phone}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Address
                                    </h3>
                                    <p className="text-sm">{store.address}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Store Category
                                    </h3>
                                    <p className="text-sm">{store.category}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">
                                        Description
                                    </h3>
                                    <p className="text-sm">
                                        {store.description}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader className="py-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                Products
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {store.productsCount}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="py-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                Orders
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {store.ordersCount}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="py-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                Revenue
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {store.revenue.toLocaleString()}{' '}
                                                USDT
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="py-2">
                                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                                Rating
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex items-center">
                                            <div className="text-2xl font-bold">
                                                {typeof store.rating ===
                                                'number'
                                                    ? store.rating.toFixed(1)
                                                    : Number(
                                                          store.rating
                                                      ).toFixed(1)}
                                                /5
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                        Account Information
                                    </h3>
                                    <table className="min-w-full">
                                        <tbody>
                                            <tr>
                                                <td className="text-sm text-muted-foreground pr-4">
                                                    Status
                                                </td>
                                                <td className="text-sm">
                                                    <Badge
                                                        className={`cursor-pointer transition-colors ${
                                                            store.status ===
                                                            'active'
                                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                : store.status ===
                                                                    'inactive'
                                                                  ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                                  : store.status ===
                                                                      'pending'
                                                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                        }`}
                                                        onClick={() =>
                                                            onUpdateStatus(
                                                                store.id,
                                                                getNextStatus(
                                                                    store.status as StoreStatus
                                                                )
                                                            )
                                                        }
                                                    >
                                                        {store.status}
                                                    </Badge>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-muted-foreground pr-4">
                                                    Date Created
                                                </td>
                                                <td className="text-sm">
                                                    {new Date(
                                                        store.dateCreated
                                                    ).toLocaleDateString()}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="text-sm text-muted-foreground pr-4">
                                                    Last Active
                                                </td>
                                                <td className="text-sm">
                                                    {new Date(
                                                        store.lastActive
                                                    ).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="products">
                        {productsLoading ? (
                            <div className="flex justify-center p-6">
                                Loading products...
                            </div>
                        ) : products.length > 0 ? (
                            <div className="rounded-md border">
                                <Table className="overflow-y-auto scrollbar scrollbar-thumb-green transition-transform duration-300">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product Name</TableHead>
                                            <TableHead className="w-[130px]">
                                                Price
                                            </TableHead>
                                            <TableHead className="w-[100px]">
                                                Sold
                                            </TableHead>
                                            <TableHead className="w-[100px]">
                                                Stock
                                            </TableHead>
                                            <TableHead className="w-[100px]">
                                                Status
                                            </TableHead>
                                            <TableHead className="w-[150px]">
                                                Created At
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.map((product, i) => (
                                            <TableRow key={product.id || i}>
                                                <TableCell className="font-medium">
                                                    {product.productName}
                                                    {product.isBestseller &&
                                                        ' ⭐'}
                                                    {product.isNew && ' 🆕'}
                                                </TableCell>
                                                <TableCell>
                                                    {parseInt(product.price) +
                                                        ' '}
                                                    USDT
                                                </TableCell>
                                                <TableCell>
                                                    {product.soldCount || 0}
                                                </TableCell>
                                                <TableCell>
                                                    {product.stockCount || 0}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            product.stockCount <=
                                                            0
                                                                ? 'bg-red-100 text-red-800'
                                                                : product.status ===
                                                                    'inactive'
                                                                  ? 'bg-gray-100 text-gray-800'
                                                                  : 'bg-green-100 text-green-800'
                                                        }
                                                    >
                                                        {product.stockCount <= 0
                                                            ? 'Out of stock'
                                                            : product.status ||
                                                              'Active'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(
                                                        product.createAt
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center p-6 border rounded-md">
                                <p>No products found for this store</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="orders">
                        {ordersLoading ? (
                            <div className="flex justify-center p-6">
                                Loading orders...
                            </div>
                        ) : orders.length > 0 ? (
                            <div className="rounded-md border max-h-[400px] overflow-y-scroll  transition-transform duration-300 ">
                                <Table className="h-32 ">
                                    <TableHeader className="sticky top-0 bg-white ">
                                        <TableRow>
                                            <TableHead className="w-[120px]">
                                                Order Code
                                            </TableHead>
                                            <TableHead className="w-[150px]">
                                                Customer
                                            </TableHead>
                                            <TableHead className="w-[250px]">
                                                Product
                                            </TableHead>
                                            <TableHead className="w-[120px]">
                                                Total
                                            </TableHead>
                                            <TableHead className="w-[80px]">
                                                Qty
                                            </TableHead>
                                            <TableHead className="w-[100px]">
                                                Status
                                            </TableHead>
                                            <TableHead className="w-[150px]">
                                                Order Date
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orders.map((order, i) => (
                                            <TableRow key={order.orderId || i}>
                                                <TableCell className="font-medium">
                                                    #{order.orderCode}
                                                    {order.isPreOrder &&
                                                        ' (Pre-order)'}
                                                    {order.referralCode &&
                                                        ' 🔗'}
                                                </TableCell>
                                                <TableCell>
                                                    {order.user?.fullName ||
                                                        'Unknown'}
                                                </TableCell>
                                                <TableCell>
                                                    {order.product
                                                        ?.productName ||
                                                        'Unknown product'}
                                                </TableCell>
                                                <TableCell>
                                                    {parseInt(
                                                        order.totalAmount ||
                                                            order.price
                                                    ) + ' '}
                                                    USDT
                                                </TableCell>
                                                <TableCell>
                                                    {order.quantity || 1}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`transition-colors ${
                                                            order.orderStatus ===
                                                            'successed'
                                                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                                : order.orderStatus ===
                                                                    'pending'
                                                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                                  : order.orderStatus ===
                                                                      'complained'
                                                                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                                                    : order.orderStatus ===
                                                                        'refunded'
                                                                      ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                                                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                        }`}
                                                    >
                                                        {order.orderStatus ||
                                                            'Pending'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(
                                                        order.orderDate
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex justify-center items-center p-6 border rounded-md">
                                <p>No orders found for this store</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="activity">
                        {/* Additional content for Activity tab */}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
