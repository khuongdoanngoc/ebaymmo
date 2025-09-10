import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { useState } from 'react';
import { OrderComplaint } from '@/types/order';

interface ComplaintDialogProps {
    complaint: OrderComplaint;
    onResolve: (id: string, notes: string) => void;
    onReject: (id: string, notes: string) => void;
}

const ComplaintDialog = ({
    complaint,
    onResolve,
    onReject
}: ComplaintDialogProps) => {
    const [notes] = useState('');
    const [open, setOpen] = useState(false);

    const handleResolve = () => {
        onResolve(complaint.orderId, notes);
        setOpen(false);
    };

    const handleReject = () => {
        onReject(complaint.orderId, notes);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="default">
                    Review
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Review Order Complaint</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-lg font-medium mb-2">
                                Order Details
                            </h3>
                            <div className="space-y-2 text-sm">
                                <p>
                                    <span className="font-medium">
                                        Order ID:
                                    </span>{' '}
                                    {complaint.orderId}
                                </p>
                                <p>
                                    <span className="font-medium">
                                        Product:
                                    </span>{' '}
                                    {complaint.product?.productName || 'N/A'}
                                </p>
                                <p>
                                    <span className="font-medium">Amount:</span>{' '}
                                    {complaint.price} USDT
                                </p>
                                <p>
                                    <span className="font-medium">Buyer:</span>{' '}
                                    {complaint.user?.username || 'N/A'}
                                </p>
                                <p>
                                    <span className="font-medium">Seller:</span>{' '}
                                    {complaint.product?.store?.user?.username ||
                                        'N/A'}
                                </p>
                                <p>
                                    <span className="font-medium">Date:</span>{' '}
                                    {new Date(
                                        complaint.createAt
                                    ).toLocaleString()}
                                </p>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-medium mb-2">
                                Complaint Content
                            </h3>
                            <div className="p-3 bg-gray-50 rounded-md mb-4">
                                <p className="whitespace-pre-wrap">
                                    {complaint.complainOrders[0].content}
                                </p>
                            </div>
                            {complaint.complainOrders[0].image && (
                                <div>
                                    <p className="font-medium mb-1">
                                        Evidence Image:
                                    </p>
                                    <img
                                        src={complaint.complainOrders[0].image}
                                        alt="Complaint evidence"
                                        className="max-w-full h-auto rounded-md border"
                                        onError={(e) => {
                                            const target =
                                                e.target as HTMLImageElement;
                                            target.src =
                                                'https://placehold.co/400x200?text=Image+Not+Available';
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        {/* <label className="text-sm font-medium">
                            Resolution Notes
                        </label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Enter notes about the resolution..."
                            rows={4}
                        /> */}
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            onClick={handleResolve}
                            className="flex-1"
                            variant="default"
                        >
                            Resolve Complaint
                        </Button>
                        <Button
                            onClick={handleReject}
                            className="flex-1"
                            variant="destructive"
                        >
                            Reject Complaint
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ComplaintDialog;
