import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { ProductData } from '@/components/Store/StoreTable'; // Make sure ProductData is exported from StoreTable
import { format } from 'date-fns'; // For date formatting

interface ProductDetailDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    product: ProductData | null;
}

export function ProductDetailDialog({
    isOpen,
    onOpenChange,
    product
}: ProductDetailDialogProps) {
    if (!product) {
        return null; // Don't render if no product is selected
    }

    // Helper to format price
    const formatPrice = (price: number | null | undefined) => {
        if (price == null) return 'N/A';
        return `$${Number(price).toFixed(2)}`; // Ensure price is treated as number
    };

    // Helper to format date
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'PPP p'); // e.g., Jun 21, 2023 4:30 PM
        } catch (error) {
            console.error('Error formatting date:', dateString, error);
            return 'Invalid Date';
        }
    };

    // Helper to format discount
    const formatDiscount = (discount: number | boolean | null | undefined) => {
        if (typeof discount === 'boolean') {
            return discount ? 'Yes' : 'No';
        }
        if (typeof discount === 'number') {
            return discount > 0 ? 'Yes' : 'No'; // Example: Treat any number > 0 as having a discount
        }
        return 'N/A';
    };

    // Determine badge variant based on status
    const getStatusVariant = (
        status: string | null | undefined
    ): 'default' | 'secondary' | 'destructive' | 'outline' => {
        const lowerStatus = status?.toLowerCase();
        if (lowerStatus === 'active' || lowerStatus === 'available') {
            return 'default'; // Use 'default' for active/available (often green/primary)
        }
        if (lowerStatus === 'inactive' || lowerStatus === 'out_of_stock') {
            return 'secondary'; // Use 'secondary' for inactive/out_of_stock (often gray)
        }
        if (lowerStatus === 'suspended') {
            return 'destructive'; // Use 'destructive' for suspended (often red)
        }
        return 'outline'; // Fallback variant
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Product Details</DialogTitle>
                    <DialogDescription>
                        Detailed information for:{' '}
                        {product.productName || 'Unnamed Product'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold">Name:</span>
                        <span className="col-span-3">
                            {product.productName || 'N/A'}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold">Price:</span>
                        <span className="col-span-3">
                            {formatPrice(product.price)}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold">
                            Sold Count:
                        </span>
                        <span className="col-span-3">
                            {product.soldCount ?? 0}
                        </span>
                    </div>
                    {/* Uncomment if stockCount is available and needed
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold">Stock Count:</span>
                        <span className="col-span-3">{product.stockCount ?? 'N/A'}</span>
                    </div> */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold">
                            Status:
                        </span>
                        <span className="col-span-3">
                            {product.status ? (
                                <Badge
                                    variant={getStatusVariant(product.status)}
                                >
                                    {product.status}
                                </Badge>
                            ) : (
                                'N/A'
                            )}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold">
                            Has Discount:
                        </span>
                        <span className="col-span-3">
                            {formatDiscount(product.hasDiscount)}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <span className="text-right font-semibold">
                            Created At:
                        </span>
                        <span className="col-span-3">
                            {formatDate(product.createAt)}
                        </span>
                    </div>
                    {/* Add more fields from ProductData as needed */}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
