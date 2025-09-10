import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGetBidByPositionIdSubscription } from '@/generated/graphql';

export default function BidHistoryDialog({
    positionId
}: {
    positionId: string;
}) {
    console.log(positionId);
    const { data: positionData } = useGetBidByPositionIdSubscription({
        variables: {
            limit: 10,
            offset: 0,
            where: {
                positionId: {
                    _eq: positionId
                }
            }
        }
    });
    const [open, setOpen] = React.useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Bid History
                </Button>
            </DialogTrigger>
            <DialogContent className="min-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        Bid History for{' '}
                        {positionData?.bids[0]?.position?.positionName}
                    </DialogTitle>
                </DialogHeader>
                <div className="max-h-[400px] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order ID</TableHead>
                                <TableHead>Amount (USDT)</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Position Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {positionData?.bids &&
                            positionData.bids.length > 0 ? (
                                positionData.bids.map((bid) => (
                                    <TableRow key={bid.bidId}>
                                        <TableCell>{bid.bidId}</TableCell>
                                        <TableCell>{bid.bidAmount}</TableCell>
                                        <TableCell>
                                            {new Date(
                                                bid.bidDate
                                            ).toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    bid.bidStatus === 'active'
                                                        ? 'bg-green-100 text-green-800'
                                                        : bid.bidStatus ===
                                                            'pending'
                                                          ? 'bg-yellow-100 text-yellow-800'
                                                          : bid.bidStatus ===
                                                              'won'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {bid.bidStatus}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {bid.position?.positionName}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={4}
                                        className="text-center py-4"
                                    >
                                        No bid history found
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
