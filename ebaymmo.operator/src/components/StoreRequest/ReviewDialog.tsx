import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { useUpdateStoreMutation } from '@/generated/graphql';
import { StoreRequest } from '@/types/store';

interface ReviewDialogProps {
    request: StoreRequest;
    onApprove: (id: string, notes: string) => void;
    onReject: (id: string, notes: string) => void;
}

export const ReviewDialog = ({
    request,
    onApprove,
    onReject
}: ReviewDialogProps) => {
    const [updateStore] = useUpdateStoreMutation();
    const [open, setOpen] = React.useState(false);

    const handleApprove = async () => {
        try {
            await updateStore({
                variables: {
                    _set: {
                        status: 'active'
                    },
                    where: {
                        storeId: { _eq: request.storeId }
                    }
                }
            });
            onApprove(request.storeId, '');
            setOpen(false);
        } catch (error) {
            console.error('Error approving store:', error);
            toast.error('Failed to approve store');
        }
    };

    const handleReject = async () => {
        try {
            await updateStore({
                variables: {
                    _set: {
                        status: 'inactive'
                    },
                    where: {
                        storeId: { _eq: request.storeId }
                    }
                }
            });
            onReject(request.storeId, '');
            setOpen(false);
        } catch (error) {
            console.error('Error rejecting store:', error);
            toast.error('Failed to reject store');
        }
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Review
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Review Store Request</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Store Name:
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium">
                                    {request.storeName}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Owner:
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium">
                                    {request.sellerName}
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Email:
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium">
                                    {request.email}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Date Sent:
                                </p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-sm font-medium">
                                    {new Date(
                                        request.createAt
                                    ).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">
                                Description:
                            </p>
                            <div className="p-3 bg-muted rounded-md">
                                <p className="text-sm">
                                    {request.shortDescription}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            onClick={handleApprove}
                            className="flex-1"
                            variant="default"
                        >
                            Approve
                        </Button>
                        <Button
                            onClick={handleReject}
                            className="flex-1"
                            variant="destructive"
                        >
                            Reject
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
