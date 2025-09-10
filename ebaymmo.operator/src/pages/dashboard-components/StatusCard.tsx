import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatusItemProps {
    label: string;
    value: string | number;
    color: string;
}

const StatusItem: React.FC<StatusItemProps> = ({ label, value, color }) => (
    <div className="flex items-center justify-between text-sm">
        <div className="flex items-center">
            <div
                className={`h-2.5 w-2.5 rounded-full mr-2`}
                style={{ backgroundColor: color }}
            ></div>
            <span>{label}</span>
        </div>
        <span>{value}</span>
    </div>
);

interface StatusCardProps {
    title: string;
    value: string | number;
    icon: React.ElementType;
    description: string;
    items: { label: string; value: string | number; color: string }[];
    trend?: { value: number; label: string };
}

const StatusCard: React.FC<StatusCardProps> = ({
    title,
    value,
    icon: Icon,
    description,
    items,
    trend
}) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">{title}</CardTitle>
            <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <div className="text-3xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground">
                    {description}
                </div>
                <div className="space-y-2">
                    {items.map((item, index) => (
                        <StatusItem
                            key={index}
                            label={item.label}
                            value={item.value}
                            color={item.color}
                        />
                    ))}
                </div>
                {trend && (
                    <div className="flex items-center text-sm">
                        {trend.value >= 0 ? (
                            <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                        ) : (
                            <ArrowDownRight className="mr-1 h-4 w-4 text-red-500" />
                        )}
                        <span
                            className={
                                trend.value >= 0
                                    ? 'text-green-500'
                                    : 'text-red-500'
                            }
                        >
                            {Math.abs(trend.value)}% {trend.label}
                        </span>
                    </div>
                )}
            </div>
        </CardContent>
    </Card>
);

export default StatusCard;
