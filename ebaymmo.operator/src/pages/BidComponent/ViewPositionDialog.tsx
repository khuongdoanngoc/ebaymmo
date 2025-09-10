import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog';
import { BidPosition } from '@/types/bid';
import { Eye } from 'lucide-react';

interface ViewPositionDialogProps {
    position: BidPosition;
}

export const ViewPositionDialog = ({ position }: ViewPositionDialogProps) => {
    const [open, setOpen] = React.useState(false);

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString();
        } catch (e) {
            return dateString || 'N/A';
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" /> View
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Position Details</DialogTitle>
                    <DialogDescription>
                        Full information about this position
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2 border-b pb-2">
                            <div className="font-medium">Position ID</div>
                            <div>{position.id}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-b pb-2">
                            <div className="font-medium">Position Name</div>
                            <div>{position.name}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-b pb-2">
                            <div className="font-medium">Current Bid</div>
                            <div>{position.currentBid} USDT</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-b pb-2">
                            <div className="font-medium">Store</div>
                            <div>{position.store.storeName}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-b pb-2">
                            <div className="font-medium">Store ID</div>
                            <div>{position.store.storeId || 'N/A'}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-b pb-2">
                            <div className="font-medium">Current Winner</div>
                            <div>
                                {position.currentWinner || 'No winner yet'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-b pb-2">
                            <div className="font-medium">Status</div>
                            <div>
                                <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        position.status === 'active'
                                            ? 'bg-green-100 text-green-800'
                                            : position.status === 'pending'
                                              ? 'bg-yellow-100 text-yellow-800'
                                              : 'bg-gray-100 text-gray-800'
                                    }`}
                                >
                                    {position.status}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-b pb-2">
                            <div className="font-medium">Category</div>
                            <div>
                                {position.category?.categoryName || 'None'}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-b pb-2">
                            <div className="font-medium">Start Time</div>
                            <div>{formatDate(position.startTime)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-b pb-2">
                            <div className="font-medium">End Time</div>
                            <div>{formatDate(position.endTime)}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="font-medium">Bid Count</div>
                            <div>{position.bids.length}</div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ViewPositionDialog;
