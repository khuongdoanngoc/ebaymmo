import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus } from 'lucide-react';
import { toast } from '@/components/ui/toast';

// Types cho dữ liệu position
interface PositionData {
    positionName: string;
    description: string;
    bidAmount: number;
    startDate: string;
    endDate: string;
    status: 'active' | 'completed';
    categoryId?: string;
}

// Types cho dữ liệu bid
interface BidData {
    positionId: string;
    bidAmount: number;
    bidStatus: 'active' | 'completed';
    bidDate: string;
}

// Props cho component
interface AddItemDialogProps {
    type: 'position' | 'bid';
    onSave: (data: PositionData | BidData) => void;
    buttonText?: string;
    categories?: { categoryId: string; categoryName: string }[];
    positions?: {
        positionId: string;
        description: string;
        bidAmount?: number;
    }[];
}

const AddItemDialog = ({
    type,
    onSave,
    buttonText,
    categories = [],
    positions = []
}: AddItemDialogProps) => {
    const [open, setOpen] = React.useState(false);
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    // State cho position
    const [positionData, setPositionData] = React.useState<PositionData>({
        positionName: '',
        description: '',
        bidAmount: 0,
        startDate: new Date().toISOString().slice(0, 16),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 16),
        status: 'active'
    });

    // State cho bid
    const [bidData, setBidData] = React.useState<BidData>({
        positionId: '',
        bidAmount: 0,
        bidStatus: 'active',
        bidDate: new Date().toISOString().slice(0, 16)
    });

    // Validate Position
    const validatePosition = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!positionData.positionName.trim()) {
            newErrors.positionName = 'Position name is required';
        }
        if (!positionData.description.trim()) {
            newErrors.description = 'Description is required';
        }
        if (positionData.bidAmount <= 0) {
            newErrors.bidAmount = 'Bid amount must be greater than 0';
        }
        if (!positionData.startDate) {
            newErrors.startDate = 'Start date is required';
        } else {
            const startDate = new Date(positionData.startDate);
            const now = new Date();
            if (
                startDate < now &&
                startDate.toDateString() !== now.toDateString()
            ) {
                newErrors.startDate = 'Start date cannot be in the past';
            }
        }
        if (!positionData.endDate) {
            newErrors.endDate = 'End date is required';
        }
        if (
            new Date(positionData.endDate) <= new Date(positionData.startDate)
        ) {
            newErrors.endDate = 'End date must be after start date';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validate Bid
    const validateBid = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!bidData.positionId) {
            newErrors.positionId = 'Position is required';
        }
        if (bidData.bidAmount <= 0) {
            newErrors.bidAmount = 'Bid amount must be greater than 0';
        }
        const selectedPosition = positions.find(
            (p) => p.positionId === bidData.positionId
        );
        if (
            selectedPosition &&
            bidData.bidAmount <= (selectedPosition.bidAmount || 0)
        ) {
            newErrors.bidAmount = `Bid amount must be greater than current minimum bid (${selectedPosition.bidAmount} USDT)`;
        }
        if (!bidData.bidDate) {
            newErrors.bidDate = 'Bid date is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Xử lý thay đổi cho position
    const handlePositionChange = (
        field: keyof PositionData,
        value: string | number
    ) => {
        setPositionData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    // Xử lý thay đổi cho bid
    const handleBidChange = (field: keyof BidData, value: string | number) => {
        setBidData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    // Xử lý submit form
    const handleSubmit = () => {
        const isValid =
            type === 'position' ? validatePosition() : validateBid();
        if (!isValid) {
            toast({
                title: 'Validation Error',
                description: 'Please check the form for errors',
                variant: 'destructive'
            });
            return;
        }
        if (type === 'position') {
            onSave(positionData);
        } else {
            onSave(bidData);
        }
        setOpen(false);
        setErrors({});
        if (type === 'position') {
            setPositionData({
                positionName: '',
                description: '',
                bidAmount: 0,
                startDate: new Date().toISOString().slice(0, 16),
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .slice(0, 16),
                status: 'active'
            });
        } else {
            setBidData({
                positionId: '',
                bidAmount: 0,
                bidStatus: 'active',
                bidDate: new Date().toISOString().slice(0, 16)
            });
        }
    };

    const selectedPosition = positions.find(
        (p) => p.positionId === bidData.positionId
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {buttonText ||
                        (type === 'position' ? 'Add Position' : 'Add Bid')}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {type === 'position'
                            ? 'Add New Position'
                            : 'Add New Bid'}
                    </DialogTitle>
                </DialogHeader>

                {type === 'position' ? (
                    // Form cho position
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Position Name*
                            </label>
                            <Input
                                value={positionData.positionName}
                                onChange={(e) =>
                                    handlePositionChange(
                                        'positionName',
                                        e.target.value
                                    )
                                }
                                placeholder="Enter position name"
                                className={
                                    errors.positionName ? 'border-red-500' : ''
                                }
                            />
                            {errors.positionName && (
                                <p className="text-sm text-red-500">
                                    {errors.positionName}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Description*
                            </label>
                            <Textarea
                                value={positionData.description}
                                onChange={(e) =>
                                    handlePositionChange(
                                        'description',
                                        e.target.value
                                    )
                                }
                                placeholder="Enter position description"
                                rows={3}
                                className={
                                    errors.description ? 'border-red-500' : ''
                                }
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500">
                                    {errors.description}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Starting Bid (USDT)*
                            </label>
                            <Input
                                type="number"
                                value={positionData.bidAmount}
                                onChange={(e) =>
                                    handlePositionChange(
                                        'bidAmount',
                                        parseFloat(e.target.value)
                                    )
                                }
                                placeholder="0.00"
                                className={
                                    errors.bidAmount ? 'border-red-500' : ''
                                }
                            />
                            {errors.bidAmount && (
                                <p className="text-sm text-red-500">
                                    {errors.bidAmount}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Status*
                            </label>
                            <Select
                                value={positionData.status}
                                onValueChange={(value: string) =>
                                    handlePositionChange(
                                        'status',
                                        value as 'active' | 'completed'
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="completed">
                                        Completed
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Category
                            </label>
                            <Select
                                value={positionData.categoryId || ''}
                                onValueChange={(value: string) =>
                                    handlePositionChange('categoryId', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.categoryId}
                                            value={category.categoryId}
                                        >
                                            {category.categoryName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Start Time*
                            </label>
                            <Input
                                type="datetime-local"
                                value={positionData.startDate}
                                onChange={(e) =>
                                    handlePositionChange(
                                        'startDate',
                                        e.target.value
                                    )
                                }
                                className={
                                    errors.startDate ? 'border-red-500' : ''
                                }
                            />
                            {errors.startDate && (
                                <p className="text-sm text-red-500">
                                    {errors.startDate}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                End Time*
                            </label>
                            <Input
                                type="datetime-local"
                                value={positionData.endDate}
                                onChange={(e) =>
                                    handlePositionChange(
                                        'endDate',
                                        e.target.value
                                    )
                                }
                                className={
                                    errors.endDate ? 'border-red-500' : ''
                                }
                            />
                            {errors.endDate && (
                                <p className="text-sm text-red-500">
                                    {errors.endDate}
                                </p>
                            )}
                        </div>
                    </div>
                ) : (
                    // Form cho bid
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Position*
                            </label>
                            <Select
                                value={bidData.positionId}
                                onValueChange={(value: string) =>
                                    handleBidChange('positionId', value)
                                }
                            >
                                <SelectTrigger
                                    className={
                                        errors.positionId
                                            ? 'border-red-500'
                                            : ''
                                    }
                                >
                                    <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                    {positions.map((position) => (
                                        <SelectItem
                                            key={position.positionId}
                                            value={position.positionId}
                                        >
                                            {position.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.positionId && (
                                <p className="text-sm text-red-500">
                                    {errors.positionId}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Bid Amount (USDT)*
                            </label>
                            <Input
                                type="number"
                                value={bidData.bidAmount}
                                onChange={(e) =>
                                    handleBidChange(
                                        'bidAmount',
                                        parseFloat(e.target.value)
                                    )
                                }
                                placeholder="0.00"
                                className={
                                    errors.bidAmount ? 'border-red-500' : ''
                                }
                            />
                            {errors.bidAmount && (
                                <p className="text-sm text-red-500">
                                    {errors.bidAmount}
                                </p>
                            )}
                            {selectedPosition && !errors.bidAmount && (
                                <p className="text-xs text-gray-500">
                                    Current minimum bid:{' '}
                                    {selectedPosition.bidAmount || 0} USDT
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Bid Date*
                            </label>
                            <Input
                                type="datetime-local"
                                value={bidData.bidDate}
                                onChange={(e) =>
                                    handleBidChange('bidDate', e.target.value)
                                }
                                className={
                                    errors.bidDate ? 'border-red-500' : ''
                                }
                            />
                            {errors.bidDate && (
                                <p className="text-sm text-red-500">
                                    {errors.bidDate}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Status*
                            </label>
                            <Select
                                value={bidData.bidStatus}
                                onValueChange={(value: string) =>
                                    handleBidChange(
                                        'bidStatus',
                                        value as 'active' | 'completed'
                                    )
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="completed">
                                        Completed
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button onClick={() => setOpen(false)} variant="outline">
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit}>
                        {type === 'position' ? 'Create Position' : 'Create Bid'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default AddItemDialog;
