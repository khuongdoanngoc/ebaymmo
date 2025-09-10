import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '@/components/ui/popover';
import { AlertCircle, Check, MoreHorizontal, X } from 'lucide-react';
import { CustomerAction } from './types';

interface CustomerActionsProps {
    status: string;
    username: string;
    onAction: (action: CustomerAction) => void;
    onBanned: (username: string, status: string) => void;
}

export default function CustomerActions({
    status,
    username,
    onAction,
    onBanned
}: CustomerActionsProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-md p-2 text-sm font-medium text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                </button>
            </PopoverTrigger>

            <PopoverContent align="end" className="w-56">
                <div className="space-y-1">
                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() =>
                            onAction({
                                type:
                                    status === 'active'
                                        ? 'suspended'
                                        : status === 'banned'
                                          ? 'activated'
                                          : 'activated',
                                userId: username
                            })
                        }
                    >
                        {status === 'active' ? (
                            <X className="mr-2 h-4 w-4" />
                        ) : (
                            <Check className="mr-2 h-4 w-4" />
                        )}
                        {status === 'active'
                            ? 'Suspended Seller'
                            : status === 'banned'
                              ? 'Unban Seller'
                              : 'Activate Seller'}
                    </Button>

                    {status !== 'banned' && (
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-100"
                            onClick={() => onBanned(username, 'banned')}
                        >
                            <AlertCircle className="mr-2 h-4 w-4" />
                            Banned
                        </Button>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
