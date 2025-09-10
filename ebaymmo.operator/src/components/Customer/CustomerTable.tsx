import { ArrowUpDown } from 'lucide-react';
import { CustomerType, Customer, CustomerAction } from './types';
import CustomerTableRow from './CustomerTableRow';

interface CustomerTableProps {
    customers: Customer[];
    activeTab: CustomerType | 'all';
    expandedCustomers: Record<string, boolean>;
    toggleCustomerExpand: (customerId: string) => void;
    handleCustomerAction: (action: CustomerAction) => void;
    handleBanned: (username: string, status: string) => void;
    formatCurrency: (amount: number) => string;
    formatDateTime: (date: string) => string;
}

export default function CustomerTable({
    customers,
    activeTab,
    expandedCustomers,
    toggleCustomerExpand,
    handleCustomerAction,
    handleBanned,
    formatCurrency,
    formatDateTime
}: CustomerTableProps) {
    return (
        <div className="rounded-xl border shadow">
            <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    Username <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    Name <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Role
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Seller Since
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Contact
                            </th>
                            {(activeTab === 'seller' ||
                                activeTab === 'reseller' ||
                                activeTab === 'all') && (
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                    {activeTab === 'seller'
                                        ? 'Stores'
                                        : activeTab === 'reseller'
                                          ? 'Connected Stores'
                                          : 'Stores'}
                                </th>
                            )}
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    Orders <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    Total Spent{' '}
                                    <ArrowUpDown className="h-3 w-3" />
                                </div>
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Status
                            </th>
                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                        {customers.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="p-4 text-center">
                                    No customers found. Try adjusting your
                                    filter.
                                </td>
                            </tr>
                        ) : (
                            customers.map((customer, index) => (
                                <CustomerTableRow
                                    key={`${index}-${customer.username}`}
                                    customer={customer}
                                    isExpanded={
                                        expandedCustomers[customer.username]
                                    }
                                    toggleExpand={() =>
                                        toggleCustomerExpand(customer.username)
                                    }
                                    onCustomerAction={handleCustomerAction}
                                    onBanned={handleBanned}
                                    formatCurrency={formatCurrency}
                                    formatDateTime={formatDateTime}
                                    activeTab={activeTab}
                                />
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
