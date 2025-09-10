import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

interface BulkActionsProps {
    selectedCount: number;
    onActivate: () => void;
    onDeactivate: () => void;
    onDelete: () => void;
}

export function BulkActions({
    selectedCount,
    onActivate,
    onDeactivate,
    onDelete
}: BulkActionsProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="bg-muted/50 p-2 rounded flex items-center justify-between">
            <span className="text-sm font-medium pl-2">
                {selectedCount} stores selected
            </span>
            <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={onActivate}>
                    <CheckCircle size={16} className="mr-1" /> Activate
                </Button>
                <Button size="sm" variant="outline" onClick={onDeactivate}>
                    <XCircle size={16} className="mr-1" /> Deactivate
                </Button>
                <Button size="sm" variant="destructive" onClick={onDelete}>
                    Delete
                </Button>
            </div>
        </div>
    );
}
