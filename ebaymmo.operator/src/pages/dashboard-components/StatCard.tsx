import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    description?: string;
    trend?: number;
    loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    description,
    trend,
    loading
}) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="animate-pulse space-y-2">
                    <div className="h-6 bg-muted rounded w-24"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                </div>
            ) : (
                <>
                    <div className="text-3xl font-bold">{value}</div>
                    {description && (
                        <p className="text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                    {trend !== undefined && (
                        <div className="flex items-center mt-2">
                            {trend >= 0 ? (
                                <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                            ) : (
                                <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                            )}
                            <span
                                className={cn(
                                    'text-sm font-medium',
                                    trend >= 0
                                        ? 'text-green-500'
                                        : 'text-red-500'
                                )}
                            >
                                {Math.abs(trend)}% from last month
                            </span>
                        </div>
                    )}
                </>
            )}
        </CardContent>
    </Card>
);

export default StatCard;
