import { useState, useMemo } from 'react';
import {
    useGetWithdrawalRequestsQuery,
    useApproveWithdrawalMutation,
    useRejectWithdrawalMutation,
    WithdrawalsBoolExp
} from '@/generated/graphql';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Check, X, Clock } from 'lucide-react';
import { ExportDataDropdown } from '@/components/ui/exportDataDropdown';
import usePagination from '@/hooks/usePagination';
import Pagination from '@/components/Pagination';
import { useWithdrawalCount } from '@/hooks/useWithdrawalCount';

interface WithdrawalRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    amount: number;
    status: 'pending' | 'completed' | 'canceled';
    requestDate: string;
    processedDate: string | null;
    description: string;
    balanceAddress: string;
}

interface ProcessDialogProps {
    request: WithdrawalRequest;
    onApprove: (id: string, notes: string) => void;
    onReject: (id: string, notes: string) => void;
}

const ProcessDialog = ({
    request,
    onApprove,
    onReject
}: ProcessDialogProps) => {
    const [notes, setNotes] = useState('');
    const [open, setOpen] = useState(false);

    const handleApprove = () => {
        onApprove(request.id, notes);
        setOpen(false);
    };

    const handleReject = () => {
        onReject(request.id, notes);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Process
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Process Withdrawal Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <p className="text-sm font-medium mb-2">
                            Request Details
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-medium">Amount:</p>
                                <p>{Number(request.amount)} USDT</p>
                            </div>
                            <div>
                                <p className="font-medium">User:</p>
                                <p>{request.userName}</p>
                            </div>
                            <div>
                                <p className="font-medium">Request Date:</p>
                                <p>
                                    {new Date(
                                        request.requestDate
                                    ).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="font-medium">Balance Address:</p>
                                <p className="truncate">
                                    {request.balanceAddress}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Admin Notes
                        </label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Enter notes about this transaction..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter className="sm:justify-start">
                        <div className="flex space-x-2 w-full">
                            <Button
                                onClick={handleApprove}
                                className="flex-1"
                                variant="default"
                            >
                                <Check className="mr-2 h-4 w-4" /> Approve
                            </Button>
                            <Button
                                onClick={handleReject}
                                className="flex-1"
                                variant="destructive"
                            >
                                <X className="mr-2 h-4 w-4" /> Reject
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// const prepareExportData = (data: WithdrawalRequest[]) => {
//     return data.map((item) => ({
//         ID: item.id || '',
//         'User Name': item.userName || '',
//         'User Email': item.userEmail || '',
//         'Amount (USDT)': Number(item.amount) || 0,
//         Status: item.status || '',
//         'Wallet Address': item.balanceAddress || '',
//         'Request Date': item.requestDate
//             ? new Date(item.requestDate).toISOString()
//             : '',
//         'Processed Date': item.processedDate
//             ? new Date(item.processedDate).toISOString()
//             : ''
//     }));
// };

export default function WithdrawalRequests() {
    const [activeTab, setActiveTab] = useState<
        'pending' | 'completed' | 'canceled' | 'all'
    >('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const { page, limit, setPage, offset } = usePagination(
        '/admin/withdrawals',
        10,
        1
    );

    const { pendingCount: totalPendingCount, refetch: refetchPendingCount } =
        useWithdrawalCount();

    const whereFilter = useMemo(() => {
        const filters: WithdrawalsBoolExp = {};

        if (activeTab !== 'all') {
            filters.withdrawalStatus = { _eq: activeTab };
        }

        if (searchQuery) {
            filters._or = [
                { user: { username: { _ilike: `%${searchQuery}%` } } },
                { user: { email: { _ilike: `%${searchQuery}%` } } },
                { balanceAddress: { _ilike: `%${searchQuery}%` } }
            ];
        }

        return filters;
    }, [searchQuery, activeTab]);

    const {
        data,
        loading: isLoading,
        refetch: refetchWithdrawals
    } = useGetWithdrawalRequestsQuery({
        variables: {
            where: whereFilter,
            limit,
            offset
        }
    });

    const {
        data: allData,
        loading: isLoadingAllData,
        refetch: refetchAllData
    } = useGetWithdrawalRequestsQuery({
        variables: {
            where: whereFilter,
            limit: 999999
        },
        fetchPolicy: 'network-only'
    });

    const refetchAll = () => {
        refetchWithdrawals();
        refetchAllData();
        refetchPendingCount();
    };

    const totalWithdrawals = data?.withdrawalsAggregate?.aggregate?.count || 0;

    const withdrawals: WithdrawalRequest[] = useMemo(() => {
        if (!data?.withdrawals) return [];

        return data.withdrawals.map((withdrawal, index) => ({
            id: withdrawal.withdrawalId || `wd-${index + 1000}`,
            userId: withdrawal.user?.userId || `user-${index + 100}`,
            userName: withdrawal.user?.username || 'Unknown',
            userEmail: withdrawal.user?.email || 'Unknown',
            amount:
                typeof withdrawal.amount === 'number'
                    ? withdrawal.amount
                    : parseFloat(withdrawal.amount || '0'),
            status: (withdrawal.withdrawalStatus || 'pending') as
                | 'pending'
                | 'completed'
                | 'canceled',
            requestDate: withdrawal.requestDate || new Date().toISOString(),
            processedDate: withdrawal.processedDate || null,
            description: '',
            balanceAddress: withdrawal.balanceAddress || ''
        }));
    }, [data]);

    const [approveWithdrawalMutation] = useApproveWithdrawalMutation({
        onCompleted: () => {
            refetchAll();
            toast({
                title: 'Success',
                description: 'Withdrawal request approved successfully'
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description:
                    error.message || 'Failed to approve withdrawal request',
                variant: 'destructive'
            });
        }
    });

    const [rejectWithdrawalMutation] = useRejectWithdrawalMutation({
        onCompleted: () => {
            refetchAll();
            toast({
                title: 'Success',
                description: 'Withdrawal request rejected successfully'
            });
        },
        onError: (error: any) => {
            toast({
                title: 'Error',
                description:
                    error.message || 'Failed to reject withdrawal request',
                variant: 'destructive'
            });
        }
    });

    const handleApprove = (id: string, notes: string) => {
        approveWithdrawalMutation({
            variables: {
                withdrawId: id,
                notes: notes
            }
        });
    };

    const handleReject = (id: string, notes: string) => {
        rejectWithdrawalMutation({
            variables: {
                withdrawId: id,
                notes: notes
            }
        });
    };

    const filteredWithdrawals = useMemo(() => {
        if (!withdrawals) return [];

        return withdrawals.filter((withdrawal) => {
            const statusMatch =
                activeTab === 'all' || withdrawal.status === activeTab;

            const searchMatch =
                !searchQuery ||
                withdrawal.userName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                withdrawal.userEmail
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                withdrawal.balanceAddress
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase());

            return statusMatch && searchMatch;
        });
    }, [withdrawals, activeTab, searchQuery]);

    const completedWithdrawals = useMemo(
        () => withdrawals.filter((w) => w.status === 'completed') || [],
        [withdrawals]
    );

    const totalCompletedAmount = useMemo(
        () => completedWithdrawals.reduce((sum, w) => sum + w.amount, 0),
        [completedWithdrawals]
    );

    const pendingWithdrawals = useMemo(
        () => withdrawals.filter((w) => w.status === 'pending') || [],
        [withdrawals]
    );

    const totalPendingAmount = useMemo(
        () => pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0),
        [pendingWithdrawals]
    );

    const getExportData = (exportAll: boolean) => {
        const dataToExport = exportAll
            ? allData?.withdrawals
            : data?.withdrawals;

        if (!dataToExport) return [];

        console.log(
            `Preparing export data. Export all: ${exportAll}, Records: ${dataToExport.length}`
        );

        return dataToExport.map((withdrawal, index) => ({
            ID: withdrawal.withdrawalId || `wd-${index + 1000}`,
            'User Name': withdrawal.user?.username || 'Unknown',
            'User Email': withdrawal.user?.email || 'Unknown',
            'Amount (USDT)':
                typeof withdrawal.amount === 'number'
                    ? withdrawal.amount
                    : parseFloat(withdrawal.amount || '0'),
            Status: withdrawal.withdrawalStatus || 'pending',
            'Wallet Address': withdrawal.balanceAddress || '',
            'Request Date': withdrawal.requestDate
                ? new Date(withdrawal.requestDate).toLocaleString()
                : '',
            'Processed Date': withdrawal.processedDate
                ? new Date(withdrawal.processedDate).toLocaleString()
                : ''
        }));
    };

    const exportConfig = {
        options: [
            {
                label: 'Current Page',
                value: 'current',
                getData: () => getExportData(false)
            },
            {
                label: `All Data${isLoadingAllData ? ' (Loading...)' : ''}`,
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
                    <h1 className="text-2xl font-bold">Withdrawal Requests</h1>
                    <p className="text-muted-foreground">
                        Manage and process sellers' withdrawal requests
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <ExportDataDropdown
                        data={getExportData(false)}
                        filename="withdrawal_requests"
                        headers={[
                            'ID',
                            'User Name',
                            'User Email',
                            'Amount (USDT)',
                            'Status',
                            'Wallet Address',
                            'Request Date',
                            'Processed Date'
                        ]}
                        label="Export Data"
                        exportConfig={exportConfig}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">
                            Pending Requests
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {totalPendingCount}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting approval
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">
                            Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {completedWithdrawals.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Successfully processed
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
                            {Number(totalPendingAmount)} USDT
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Awaiting approval
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium">
                            Total Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Number(totalCompletedAmount)} USDT
                        </div>
                        <p className="text-xs text-muted-foreground">
                            All time completed withdrawals
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={(value) =>
                    setActiveTab(value as typeof activeTab)
                }
            >
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger
                            value="pending"
                            className="flex gap-2 items-center"
                        >
                            <Clock className="h-4 w-4" />
                            Pending
                        </TabsTrigger>
                        <TabsTrigger
                            value="completed"
                            className="flex gap-2 items-center"
                        >
                            <Check className="h-4 w-4" />
                            Completed
                        </TabsTrigger>
                        <TabsTrigger
                            value="canceled"
                            className="flex gap-2 items-center"
                        >
                            <X className="h-4 w-4" />
                            Canceled
                        </TabsTrigger>
                        <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>

                    <div className="hidden md:block text-sm text-muted-foreground">
                        Showing <strong>{filteredWithdrawals.length}</strong>{' '}
                        requests
                    </div>
                </div>

                <div className="relative my-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search by user, email or wallet address..."
                        className="pl-10 max-w-md"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <TabsContent value={activeTab} className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Wallet Address</TableHead>
                                        <TableHead>Request Date</TableHead>
                                        <TableHead>Process Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredWithdrawals.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="text-center py-4"
                                            >
                                                No withdrawal requests found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredWithdrawals.map(
                                            (withdrawal) => (
                                                <TableRow key={withdrawal.id}>
                                                    <TableCell>
                                                        <div>
                                                            {
                                                                withdrawal.userName
                                                            }
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                withdrawal.userEmail
                                                            }
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-medium">
                                                            {Number(
                                                                withdrawal.amount
                                                            )}{' '}
                                                            USDT
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="max-w-xs truncate">
                                                        {
                                                            withdrawal.balanceAddress
                                                        }
                                                    </TableCell>
                                                    <TableCell>
                                                        {new Date(
                                                            withdrawal.requestDate
                                                        ).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell>
                                                        {withdrawal.processedDate
                                                            ? new Date(
                                                                  withdrawal.processedDate
                                                              ).toLocaleDateString()
                                                            : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            className={`
                                                        ${
                                                            withdrawal.status ===
                                                            'completed'
                                                                ? 'bg-green-100 text-green-800'
                                                                : ''
                                                        }
                                                        ${
                                                            withdrawal.status ===
                                                            'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : ''
                                                        }
                                                        ${
                                                            withdrawal.status ===
                                                            'canceled'
                                                                ? 'bg-red-100 text-red-800'
                                                                : ''
                                                        }
                                                    `}
                                                        >
                                                            {withdrawal.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {withdrawal.status ===
                                                            'pending' && (
                                                            <ProcessDialog
                                                                request={
                                                                    withdrawal
                                                                }
                                                                onApprove={
                                                                    handleApprove
                                                                }
                                                                onReject={
                                                                    handleReject
                                                                }
                                                            />
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        )
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <div className="mt-4 flex justify-center">
                        <Pagination
                            total={totalWithdrawals}
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
