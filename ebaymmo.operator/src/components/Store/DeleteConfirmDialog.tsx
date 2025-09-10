import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';

interface DeleteConfirmDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    selectedCount: number;
    onConfirm: () => void;
}

export function DeleteConfirmDialog({
    isOpen,
    onOpenChange,
    selectedCount,
    onConfirm
}: DeleteConfirmDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p>
                        Are you sure you want to delete {selectedCount} selected
                        stores?
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        This action cannot be undone.
                    </p>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
