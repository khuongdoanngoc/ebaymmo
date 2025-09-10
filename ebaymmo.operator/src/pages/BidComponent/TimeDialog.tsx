import React from 'react';
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
import { BidPosition } from '@/types/bid';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Edit } from 'lucide-react';

interface EditPositionDialogProps {
    position: BidPosition;
    onSave: (
        id: string,
        startTime: string,
        endTime: string,
        updates: Partial<BidPosition>
    ) => void;
}

const EditPositionDialog = ({ position, onSave }: EditPositionDialogProps) => {
    const [startTime, setStartTime] = React.useState(position.startTime);
    const [endTime, setEndTime] = React.useState(position.endTime);
    const [name, setName] = React.useState(position.name);
    const [currentBid, setCurrentBid] = React.useState(
        position.currentBid.toString()
    );
    const [status, setStatus] = React.useState(position.status);
    const [categoryName, setCategoryName] = React.useState(
        position.category?.categoryName || ''
    );
    const [open, setOpen] = React.useState(false);

    const formatDateForInput = (dateString: string) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return '';
            }
            return date.toISOString().slice(0, 16);
        } catch (e) {
            console.error('Error formatting date:', e);
            return '';
        }
    };

    React.useEffect(() => {
        setStartTime(formatDateForInput(position.startTime));
        setEndTime(formatDateForInput(position.endTime));
        setName(position.name);
        setCurrentBid(position.currentBid.toString());
        setStatus(position.status);
        setCategoryName(position.category?.categoryName || '');
    }, [position, open]);

    const handleSave = () => {
        const updates: Partial<BidPosition> = {
            name,
            currentBid: parseFloat(currentBid) || 0,
            status,
            category: categoryName
                ? {
                      categoryName
                  }
                : undefined
        };

        onSave(position.id, startTime, endTime, updates);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Position</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Position Name
                        </label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Position name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Current Bid (USDT)
                        </label>
                        <Input
                            type="number"
                            value={currentBid}
                            onChange={(e) => setCurrentBid(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <Select
                            value={status}
                            onValueChange={(value: string) =>
                                setStatus(
                                    value as 'active' | 'completed' | 'pending'
                                )
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">
                                    Completed
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Input
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder="Category name"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">
                            Start Time
                        </label>
                        <Input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">End Time</label>
                        <Input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default EditPositionDialog;
