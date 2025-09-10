import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { Bid } from '@/types/bid';

// Định nghĩa dữ liệu đầu vào cho sửa Bid
interface EditBidData {
    bidId: string;
    bidAmount: number;
    bidStatus: 'active' | 'completed';
    bidDate: string;
    description: string | undefined;
}

interface EditBidDialogProps {
    bid: Bid;
    onSave: (data: EditBidData) => void;
}

const EditBidDialog = ({ bid, onSave }: EditBidDialogProps) => {
    const [open, setOpen] = useState(false);
    //console.log('bid', bid.bidDate);

    // Chuyển đổi bidDate thành định dạng phù hợp với input datetime-local
    //const initialDate = new Date(bid.bidDate || bid.createAt);
    //const initialLocalDateString = initialDate.toISOString().slice(0, 16);

    const [data, setData] = useState<EditBidData>({
        bidId: bid.bidId,
        bidAmount: bid.bidAmount,
        bidStatus: bid.bidStatus,
        bidDate: bid.bidDate,
        description: bid.position?.description
    });

    const handleChange = (field: keyof EditBidData, value: string | number) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        onSave(data);
        setOpen(false);
    };

    const isFormValid = () => {
        return data.bidAmount > 0;
    };

    // Cập nhật data khi bid thay đổi
    useEffect(() => {
        // Chuyển đổi bidDate thành định dạng phù hợp với input datetime-local
        const formattedDate = new Date(bid.bidDate || bid.createAt);
        const localDateString = formattedDate.toISOString().slice(0, 16);

        setData({
            bidId: bid.bidId,
            bidAmount: bid.bidAmount,
            bidStatus: bid.bidStatus,
            description: bid.position?.description || '',
            bidDate: localDateString
        });
    }, [bid]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Bid</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Position
                            </label>
                            <p className="text-sm text-gray-700">
                                {bid.position?.positionName || 'N/A'}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Store</label>
                            <p className="text-sm text-gray-700">
                                {bid.position?.description || 'N/A'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Bid Amount (USDT)*
                        </label>
                        <Input
                            type="number"
                            value={data.bidAmount}
                            onChange={(e) =>
                                handleChange(
                                    'bidAmount',
                                    parseFloat(e.target.value)
                                )
                            }
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Bid Date*</label>
                        <Input
                            type="datetime-local"
                            value={data.bidDate}
                            onChange={(e) =>
                                handleChange('bidDate', e.target.value)
                            }
                        />
                        <p className="text-xs text-blue-500">
                            Current:{' '}
                            {new Date(bid.bidDate).toLocaleString('vi-VN', {
                                timeZone: 'Asia/Ho_Chi_Minh',
                                hour12: false,
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status*</label>
                        <Select
                            value={data.bidStatus}
                            onValueChange={(value: string) =>
                                handleChange(
                                    'bidStatus',
                                    value as 'active' | 'completed'
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="completed">
                                    Completed
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => setOpen(false)} variant="outline">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!isFormValid()}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditBidDialog;
