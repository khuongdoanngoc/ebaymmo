import { Badge } from '@/components/ui/badge';
import { Mail, Store, UserCheck } from 'lucide-react';
import { Customer, CustomerType } from './types';
import StoresList from './StoresList';
import CustomerActions from './CustomersAction';

interface CustomerTableRowProps {
    customer: Customer;
    isExpanded: boolean;
    toggleExpand: () => void;
    onCustomerAction: (action: any) => void;
    onBanned: (username: string, status: string) => void;
    formatCurrency: (amount: number) => string;
    formatDateTime: (date: string) => string;
    activeTab: CustomerType | 'all';
}

export default function CustomerTableRow({
    customer,
    isExpanded,
    toggleExpand,
    onCustomerAction,
    onBanned,
    formatCurrency,
    formatDateTime,
    activeTab
}: CustomerTableRowProps) {
    // Render badge cho từng loại khách hàng với màu sắc riêng
    const renderCustomerTypeBadge = (type: CustomerType) => {
        switch (type) {
            case 'user':
                return (
                    <Badge className="bg-blue-100 text-blue-800">User</Badge>
                );
            case 'seller':
                return (
                    <Badge className="bg-purple-100 text-purple-800">
                        Seller
                    </Badge>
                );
            case 'reseller':
                return (
                    <Badge className="bg-green-100 text-green-800">
                        Reseller
                    </Badge>
                );
        }
    };

    // Render icon cho từng loại khách hàng
    const renderCustomerTypeIcon = (type: CustomerType) => {
        switch (type) {
            case 'user':
                return <UserCheck className="h-4 w-4" />;
            case 'seller':
                return <Store className="h-4 w-4" />;
            case 'reseller':
                return <Store className="h-4 w-4" />;
        }
    };

    return (
        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <td className="p-4 align-middle">{customer.username}</td>
            <td className="p-4 align-middle font-medium">
                {customer.name ? customer.name : 'N/A'}
            </td>
            <td className="p-4 align-middle">
                <div className="flex items-center gap-1">
                    {renderCustomerTypeIcon(customer.role)}
                    {renderCustomerTypeBadge(customer.role)}
                </div>
            </td>
            <td className="p-4 align-middle">
                {customer.sellerSince
                    ? formatDateTime(customer.sellerSince)
                    : 'N/A'}
            </td>
            <td className="p-4 align-middle">
                <div className="flex flex-col space-y-1">
                    <div className="flex items-center gap-1 text-xs">
                        <Mail className="h-3 w-3" />
                        <span>{customer.email}</span>
                    </div>
                </div>
            </td>

            {(activeTab === 'seller' ||
                activeTab === 'reseller' ||
                activeTab === 'all') && (
                <td className="p-4 align-middle">
                    {customer.role === 'user' ? (
                        <span className="text-muted-foreground text-xs">
                            N/A
                        </span>
                    ) : customer.role === 'seller' && customer.stores ? (
                        <StoresList
                            stores={customer.stores}
                            isExpanded={isExpanded}
                            onToggleExpand={toggleExpand}
                        />
                    ) : (
                        <span className="text-muted-foreground text-xs">
                            None
                        </span>
                    )}
                </td>
            )}

            <td className="p-4 align-middle">{customer.orders}</td>
            <td className="p-4 align-middle">
                {formatCurrency(customer.totalSpent)}
            </td>
            <td className="p-4 align-middle">
                <Badge
                    className={
                        customer.status === 'active'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200'
                            : customer.status === 'suspended'
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors duration-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200 transition-colors duration-200'
                    }
                >
                    {customer.status === 'active'
                        ? 'Active'
                        : customer.status === 'suspended'
                          ? 'Suspended'
                          : 'Banned'}
                </Badge>
            </td>
            <td className="p-4 align-middle">
                <CustomerActions
                    status={customer.status}
                    username={customer.username}
                    onAction={onCustomerAction}
                    onBanned={onBanned}
                />
            </td>
        </tr>
    );
}
