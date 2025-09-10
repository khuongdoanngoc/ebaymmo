import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';

interface Transaction {
    id: string;
    transactionId: string;
    amount: number;
    fee: number;
    type: 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'refund';
    status: 'completed' | 'pending' | 'failed';
    description: string;
    userId: string;
    userName: string;
    storeId?: string;
    storeName?: string;
    date: string;
}

export default function Transactions() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [filter, setFilter] = useState<{
        type: string;
        status: string;
        search: string;
        dateFrom: string;
        dateTo: string;
    }>({
        type: '',
        status: '',
        search: '',
        dateFrom: '',
        dateTo: ''
    });

    const { isLoading } = useQuery<{
        transactions: Transaction[];
        total: number;
    }>({
        queryKey: ['admin', 'transactions', page, limit, filter],
        queryFn: () =>
            api
                .get('/admin/transactions', {
                    params: {
                        page,
                        limit,
                        type: filter.type,
                        status: filter.status,
                        search: filter.search,
                        dateFrom: filter.dateFrom,
                        dateTo: filter.dateTo
                    }
                })
                .then((res) => res.data)
    });

    const handleFilterChange = (key: string, value: string) => {
        setFilter((prev) => ({ ...prev, [key]: value }));
        setPage(1);
    };

    // Mock transaction data
    const mockTransactions: Transaction[] = Array(10)
        .fill(0)
        .map((_, i) => ({
            id: `tx-${i + 1}`,
            transactionId: `TX${Math.floor(Math.random() * 1000000)}`,
            amount: parseFloat((Math.random() * 1000 + 10).toFixed(2)),
            fee: parseFloat((Math.random() * 10).toFixed(2)),
            type: ['deposit', 'withdrawal', 'purchase', 'sale', 'refund'][
                Math.floor(Math.random() * 5)
            ] as any,
            status: ['completed', 'pending', 'failed'][
                Math.floor(Math.random() * 3)
            ] as any,
            description: `Transaction ${i + 1} description`,
            userId: `user-${i + 1}`,
            userName: `User ${i + 1}`,
            storeId: Math.random() > 0.3 ? `store-${i + 1}` : undefined,
            storeName: Math.random() > 0.3 ? `Store ${i + 1}` : undefined,
            date: new Date(
                Date.now() -
                    Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
            ).toISOString()
        }));

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Transactions</h1>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Filter Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Transaction Type
                            </label>
                            <Select
                                value={filter.type}
                                onValueChange={(value) =>
                                    handleFilterChange('type', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Types</SelectItem>
                                    <SelectItem value="deposit">
                                        Deposit
                                    </SelectItem>
                                    <SelectItem value="withdrawal">
                                        Withdrawal
                                    </SelectItem>
                                    <SelectItem value="purchase">
                                        Purchase
                                    </SelectItem>
                                    <SelectItem value="sale">Sale</SelectItem>
                                    <SelectItem value="refund">
                                        Refund
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Status
                            </label>
                            <Select
                                value={filter.status}
                                onValueChange={(value) =>
                                    handleFilterChange('status', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">
                                        All Statuses
                                    </SelectItem>
                                    <SelectItem value="completed">
                                        Completed
                                    </SelectItem>
                                    <SelectItem value="pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="failed">
                                        Failed
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                From Date
                            </label>
                            <Input
                                type="date"
                                value={filter.dateFrom}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'dateFrom',
                                        e.target.value
                                    )
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                To Date
                            </label>
                            <Input
                                type="date"
                                value={filter.dateTo}
                                onChange={(e) =>
                                    handleFilterChange('dateTo', e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Search
                            </label>
                            <div className="flex space-x-2">
                                <Input
                                    placeholder="Search by ID, name..."
                                    value={filter.search}
                                    onChange={(e) =>
                                        handleFilterChange(
                                            'search',
                                            e.target.value
                                        )
                                    }
                                />
                                <Button variant="outline">Reset</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Store</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading
                                ? Array(10)
                                      .fill(0)
                                      .map((_, i) => (
                                          <TableRow key={i}>
                                              <TableCell colSpan={8}>
                                                  <div className="h-10 bg-muted/20 rounded animate-pulse"></div>
                                              </TableCell>
                                          </TableRow>
                                      ))
                                : mockTransactions.map((transaction) => (
                                      <TableRow key={transaction.id}>
                                          <TableCell className="font-medium">
                                              {transaction.transactionId}
                                          </TableCell>
                                          <TableCell>
                                              <span
                                                  className={`capitalize ${
                                                      transaction.type ===
                                                      'deposit'
                                                          ? 'text-green-600'
                                                          : transaction.type ===
                                                              'withdrawal'
                                                            ? 'text-blue-600'
                                                            : transaction.type ===
                                                                'purchase'
                                                              ? 'text-purple-600'
                                                              : transaction.type ===
                                                                  'sale'
                                                                ? 'text-teal-600'
                                                                : 'text-orange-600'
                                                  }`}
                                              >
                                                  {transaction.type}
                                              </span>
                                          </TableCell>
                                          <TableCell>
                                              ${transaction.amount.toFixed(2)}
                                          </TableCell>
                                          <TableCell>
                                              {transaction.userName}
                                          </TableCell>
                                          <TableCell>
                                              {transaction.storeName || '-'}
                                          </TableCell>
                                          <TableCell>
                                              {new Date(
                                                  transaction.date
                                              ).toLocaleString()}
                                          </TableCell>
                                          <TableCell>
                                              <span
                                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                      transaction.status ===
                                                      'completed'
                                                          ? 'bg-green-100 text-green-800'
                                                          : transaction.status ===
                                                              'pending'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                  }`}
                                              >
                                                  {transaction.status}
                                              </span>
                                          </TableCell>
                                          <TableCell>
                                              <Button
                                                  variant="outline"
                                                  size="sm"
                                              >
                                                  View Details
                                              </Button>
                                          </TableCell>
                                      </TableRow>
                                  ))}
                        </TableBody>
                    </Table>

                    <div className="flex items-center justify-between px-4 py-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            Showing {(page - 1) * limit + 1} to{' '}
                            {Math.min(page * limit, 100)} of {100} transactions
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setPage((p) => Math.max(1, p - 1))
                                }
                                disabled={page === 1}
                            >
                                Previous
                            </Button>
                            <div className="text-sm">
                                Page {page} of {10}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    setPage((p) => Math.min(10, p + 1))
                                }
                                disabled={page === 10}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
