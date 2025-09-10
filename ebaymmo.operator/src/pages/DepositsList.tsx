import { useState, useMemo, KeyboardEvent } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, BarChart2 } from 'lucide-react';
import { useGetDepositsQuery } from '@/generated/graphql';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';
import { ExportDataDropdown } from '@/components/ui/exportDataDropdown';

interface Deposit {
    id: string;
    userName: string;
    userEmail: string;
    amount: number;
    status: 'pending' | 'completed' | 'failed';
    depositDate: string;
    description: string | null | undefined;
    txHash: string | null | undefined;
}

interface DepositDetailsDialogProps {
    deposit: Deposit;
}

const DepositDetailsDialog = ({ deposit }: DepositDetailsDialogProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Details
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Deposit Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-lg font-medium mb-2">
                                User Information
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p>
                                    <span className="font-medium">Name:</span>{' '}
                                    {deposit.userName}
                                </p>
                                <p>
                                    <span className="font-medium">Email:</span>{' '}
                                    {deposit.userEmail}
                                </p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2">
                                Transaction Information
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p>
                                    <span className="font-medium">Amount:</span>{' '}
                                    {deposit.amount.toFixed(2)} USDT
                                </p>
                                <p>
                                    <span className="font-medium">Status:</span>
                                    <Badge
                                        className={`ml-2 
                                        ${deposit.status === 'completed' ? 'bg-green-100 text-green-800' : ''} 
                                        ${deposit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                        ${deposit.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                                    `}
                                    >
                                        {deposit.status}
                                    </Badge>
                                </p>
                                <p>
                                    <span className="font-medium">Date:</span>{' '}
                                    {new Date(
                                        deposit.depositDate
                                    ).toLocaleString()}
                                </p>
                                {deposit.txHash && (
                                    <div className="break-all">
                                        <p>
                                            <div className="font-medium">
                                                Transaction Hash:
                                            </div>{' '}
                                            {deposit.txHash}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {deposit.description && (
                        <div>
                            <h3 className="text-lg font-medium mb-2">
                                Description
                            </h3>
                            <div className="p-3 bg-muted rounded-md">
                                <p className="whitespace-pre-wrap">
                                    {deposit.description}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function DepositsList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearchTerm, setActiveSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<
        'all' | 'pending' | 'completed' | 'failed'
    >('all');
    const [activeTab, setActiveTab] = useState<
        'all' | 'pending' | 'completed' | 'failed'
    >('all');
    const { page, limit, setPage, offset } = usePagination(
        '/admin/deposits',
        10,
        1
    );

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setActiveSearchTerm(searchTerm);
        }
    };

    const whereFilter = useMemo(() => {
        const filters: any = {};

        if (activeTab !== 'all') {
            filters.depositStatus = { _eq: activeTab };
        }

        if (activeSearchTerm) {
            filters._or = [
                { user: { fullName: { _ilike: `%${activeSearchTerm}%` } } },
                { user: { email: { _ilike: `%${activeSearchTerm}%` } } }
            ];
        }

        if (statusFilter !== 'all') {
            filters.depositStatus = { _eq: statusFilter };
        }

        return filters;
    }, [activeSearchTerm, statusFilter, activeTab]);

    const { data, loading: isLoading } = useGetDepositsQuery({
        variables: {
            where: whereFilter,
            limit: limit,
            offset: offset
        }
    });

    const totalDeposits = data?.depositsAggregate?.aggregate?.count || 0;

    const deposits = useMemo(() => {
        if (!data || !data.deposits) return [];

        return data.deposits.map((deposit) => ({
            id: deposit.depositId,
            userName: deposit.user?.fullName || 'unknown',
            userEmail: deposit.user?.email || 'unknown',
            amount: deposit.amount,
            status: deposit.depositStatus,
            depositDate: deposit.createAt,
            description: deposit.description,
            txHash: deposit.depositLogs?.[0]?.txhash || ''
        }));
    }, [data]);

    const filteredDeposits = useMemo(() => {
        if (!deposits) return [];

        return deposits.filter((deposit) => {
            if (activeTab !== 'all' && deposit.status !== activeTab) {
                return false;
            }

            if (
                activeSearchTerm &&
                !deposit.userName
                    .toLowerCase()
                    .includes(activeSearchTerm.toLowerCase()) &&
                !deposit.userEmail
                    .toLowerCase()
                    .includes(activeSearchTerm.toLowerCase())
            ) {
                return false;
            }

            if (statusFilter !== 'all' && deposit.status !== statusFilter) {
                return false;
            }

            return true;
        });
    }, [deposits, activeSearchTerm, statusFilter, activeTab]);

    const stats = useMemo(() => {
        if (!deposits)
            return {
                totalAmount: 0,
                totalCount: 0,
                pendingCount: 0,
                completedAmount: 0,
                pendingAmount: 0
            };

        const totalCount = deposits.length;
        const pendingCount = deposits.filter(
            (d) => d.status === 'pending'
        ).length;
        const completedAmount = deposits
            .filter((d) => d.status === 'completed')
            .reduce((sum, d) => sum + d.amount, 0);
        const pendingAmount = deposits
            .filter((d) => d.status === 'pending')
            .reduce((sum, d) => sum + d.amount, 0);
        const totalAmount = deposits.reduce((sum, d) => sum + d.amount, 0);

        return {
            totalAmount,
            totalCount,
            pendingCount,
            completedAmount,
            pendingAmount
        };
    }, [deposits]);

    const handleSearch = () => {
        setActiveSearchTerm(searchTerm);
    };

    // Add headers for export
    const exportHeaders = [
        'ID',
        'User Name',
        'Email',
        'Amount',
        'Status',
        'Date',
        'Tx Hash',
        'Description'
    ];

    // Add new query for exporting all data
    const { data: allData } = useGetDepositsQuery({
        variables: {
            where: whereFilter
        },
        fetchPolicy: 'network-only'
    });

    // Format deposits data for export with pagination option
    const getExportData = (exportAll: boolean) => {
        const dataToExport = exportAll ? allData?.deposits : data?.deposits;

        if (!dataToExport) return [];

        return dataToExport.map((deposit) => ({
            ID: deposit.depositId,
            'User Name': deposit.user?.fullName || 'unknown',
            Email: deposit.user?.email || 'unknown',
            Amount: deposit.amount,
            Status: deposit.depositStatus,
            Date: new Date(deposit.createAt).toLocaleString(),
            'Tx Hash': deposit.depositLogs?.[0]?.txhash || '',
            Description: deposit.description || ''
        }));
    };

    // Export configuration
    const exportConfig = {
        options: [
            {
                label: 'Current Page',
                value: 'current',
                getData: () => getExportData(false)
            },
            {
                label: 'All Data',
                value: 'all',
                getData: () => getExportData(true)
            }
        ]
    };

    if (isLoading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Seller Deposits</h1>
                    <p className="text-muted-foreground">
                        Manage and track all deposits from sellers
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ExportDataDropdown
                        data={getExportData(false)}
                        headers={exportHeaders}
                        filename="deposits-export"
                        label="Export Data"
                        exportConfig={exportConfig}
                    />
                    <Button>
                        <BarChart2 className="mr-2 h-4 w-4" />
                        View Reports
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">
                            Total Deposits
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalAmount.toFixed(2)} USDT
                        </div>
                        <p className="text-xs text-muted-foreground">
                            All time deposit value
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">
                            Completed Deposits
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.completedAmount.toFixed(2)} USDT
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Successfully processed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">
                            Pending Deposits
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.pendingCount}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting confirmation
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">
                            Pending Amount
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.pendingAmount.toFixed(2)} USDT
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Value awaiting confirmation
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={(value: string) => setActiveTab(value as any)}
            >
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="all">All Deposits</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="failed">Failed</TabsTrigger>
                    </TabsList>

                    <div className="hidden md:block text-sm text-muted-foreground">
                        Showing <strong>{filteredDeposits.length}</strong>{' '}
                        deposits
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 my-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            type="text"
                            placeholder="Search by user... (Press Enter to search)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={handleSearch} size="sm">
                        Search
                    </Button>
                    <div>
                        <Select
                            value={statusFilter}
                            onValueChange={(value: any) =>
                                setStatusFilter(value)
                            }
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Statuses
                                </SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">
                                    Completed
                                </SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <TabsContent value={activeTab} className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDeposits.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="text-center py-4"
                                            >
                                                No deposits found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredDeposits.map((deposit) => (
                                            <TableRow key={deposit.id}>
                                                <TableCell>
                                                    <div>
                                                        {deposit.userName}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {deposit.userEmail}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {deposit.amount.toFixed(2)}{' '}
                                                    USDT
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        deposit.depositDate
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`
                                                        ${
                                                            deposit.status ===
                                                            'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : ''
                                                        } 
                                                        ${
                                                            deposit.status ===
                                                            'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : ''
                                                        }
                                                        ${deposit.status === 'failed' ? 'bg-red-100 text-red-800' : ''}
                                                    `}
                                                    >
                                                        {deposit.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <DepositDetailsDialog
                                                        deposit={deposit}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <div className="mt-4 flex justify-center">
                        <Pagination
                            total={totalDeposits}
                            limit={limit}
                            page={page}
                            setPage={setPage}
                        />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
