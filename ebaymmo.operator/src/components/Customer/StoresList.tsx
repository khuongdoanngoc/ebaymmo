import { Badge } from '@/components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Store } from './types';

interface StoresListProps {
    stores: Store[];
    isExpanded: boolean;
    onToggleExpand: () => void;
}

export default function StoresList({
    stores,
    isExpanded,
    onToggleExpand
}: StoresListProps) {
    return (
        <Collapsible
            open={isExpanded}
            onOpenChange={onToggleExpand}
            className="w-full"
        >
            <div className="flex items-center justify-between">
                <div className="font-medium">
                    {stores.length} {stores.length === 1 ? 'Store' : 'Stores'}
                </div>
                <CollapsibleTrigger asChild>
                    <button className="p-1 rounded-md hover:bg-muted">
                        {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                        ) : (
                            <ChevronDown className="h-4 w-4" />
                        )}
                    </button>
                </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mt-2">
                <div className="space-y-2">
                    {stores.map((store, index) => (
                        <div
                            key={index}
                            className="text-sm px-2 py-1 rounded-md border bg-background"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-medium">
                                        {store.storeName}
                                    </div>
                                </div>
                                <Badge
                                    className={
                                        store.status === 'active'
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200'
                                            : 'bg-red-100 text-red-800 hover:bg-red-200 transition-colors duration-200'
                                    }
                                >
                                    {store.status ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div className="mt-1 text-xs">
                                <Badge variant="outline">
                                    {store.category?.categoryName}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
