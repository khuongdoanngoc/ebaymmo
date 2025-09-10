import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Info,
    MessageSquare,
    DollarSign,
    ShoppingCart,
    User
} from 'lucide-react';

// Create a mock Switch component since it doesn't exist
const Switch = ({
    checked,
    onCheckedChange
}: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
}) => (
    <button
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            checked ? 'bg-primary' : 'bg-input'
        }`}
        onClick={() => onCheckedChange(!checked)}
    >
        <span
            className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                checked ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
    </button>
);

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    date: string;
    category: 'system' | 'user' | 'order' | 'payment' | 'support';
}

interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    categories: {
        system: boolean;
        user: boolean;
        order: boolean;
        payment: boolean;
        support: boolean;
    };
}

export default function Notifications() {
    const [activeTab, setActiveTab] = useState('all');
    const [settings, setSettings] = useState<NotificationSettings>({
        emailNotifications: true,
        pushNotifications: true,
        categories: {
            system: true,
            user: true,
            order: true,
            payment: true,
            support: true
        }
    });

    const { isLoading } = useQuery<Notification[]>({
        queryKey: ['admin', 'notifications'],
        queryFn: () => api.get('/admin/notifications').then((res) => res.data)
    });

    const handleToggleSetting = (key: string, value: boolean) => {
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            setSettings((prev) => {
                if (parent === 'categories') {
                    return {
                        ...prev,
                        categories: {
                            ...prev.categories,
                            [child]: value
                        }
                    };
                }
                return prev;
            });
        } else {
            setSettings((prev) => ({
                ...prev,
                [key]: value
            }));
        }
    };

    const handleMarkAllAsRead = () => {
        // This would call an API endpoint to mark all notifications as read
        console.log('Marking all notifications as read');
    };

    // Mock notification data
    const mockNotifications: Notification[] = Array(15)
        .fill(0)
        .map((_, i) => {
            const types = ['info', 'success', 'warning', 'error'] as const;
            const categories = [
                'system',
                'user',
                'order',
                'payment',
                'support'
            ] as const;
            const type = types[Math.floor(Math.random() * types.length)];
            const category =
                categories[Math.floor(Math.random() * categories.length)];

            return {
                id: `notif-${i + 1}`,
                title: getCategoryTitle(category),
                message: getNotificationMessage(category),
                type,
                read: Math.random() > 0.3,
                date: new Date(
                    Date.now() -
                        Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000
                ).toISOString(),
                category
            };
        });

    function getCategoryTitle(category: string): string {
        switch (category) {
            case 'system':
                return 'System Update';
            case 'user':
                return 'User Activity';
            case 'order':
                return 'Order Status';
            case 'payment':
                return 'Payment Update';
            case 'support':
                return 'Support Request';
            default:
                return 'Notification';
        }
    }

    function getNotificationMessage(category: string): string {
        switch (category) {
            case 'system':
                return 'System maintenance scheduled for tonight at 2 AM.';
            case 'user':
                return 'New user registration requires verification.';
            case 'order':
                return 'Order #3845 has been completed and shipped.';
            case 'payment':
                return 'New withdrawal request needs approval.';
            case 'support':
                return 'New support ticket opened by Customer 342.';
            default:
                return 'You have a new notification.';
        }
    }

    function getNotificationIcon(type: string, category: string) {
        if (type === 'info')
            return <Info size={18} className="text-blue-500" />;
        if (type === 'success')
            return <CheckCircle size={18} className="text-green-500" />;
        if (type === 'warning')
            return <AlertTriangle size={18} className="text-amber-500" />;
        if (type === 'error')
            return <AlertTriangle size={18} className="text-red-500" />;

        switch (category) {
            case 'system':
                return <Bell size={18} className="text-purple-500" />;
            case 'user':
                return <User size={18} className="text-blue-500" />;
            case 'order':
                return <ShoppingCart size={18} className="text-green-500" />;
            case 'payment':
                return <DollarSign size={18} className="text-yellow-500" />;
            case 'support':
                return <MessageSquare size={18} className="text-red-500" />;
            default:
                return <Bell size={18} />;
        }
    }

    const filteredNotifications =
        activeTab === 'all'
            ? mockNotifications
            : activeTab === 'unread'
              ? mockNotifications.filter((n) => !n.read)
              : mockNotifications.filter((n) => n.category === activeTab);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Notifications</h1>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleMarkAllAsRead}>
                        Mark All as Read
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                    <Tabs
                        defaultValue="all"
                        value={activeTab}
                        onValueChange={setActiveTab}
                    >
                        <TabsList className="grid grid-cols-6">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="unread">Unread</TabsTrigger>
                            <TabsTrigger value="system">System</TabsTrigger>
                            <TabsTrigger value="user">Users</TabsTrigger>
                            <TabsTrigger value="order">Orders</TabsTrigger>
                            <TabsTrigger value="payment">Payments</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-6">
                            <Card>
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                        {isLoading ? (
                                            Array(5)
                                                .fill(0)
                                                .map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className="p-4"
                                                    >
                                                        <div className="h-16 bg-muted/20 rounded animate-pulse"></div>
                                                    </div>
                                                ))
                                        ) : filteredNotifications.length ===
                                          0 ? (
                                            <div className="p-8 text-center">
                                                <p className="text-muted-foreground">
                                                    No notifications found
                                                </p>
                                            </div>
                                        ) : (
                                            filteredNotifications.map(
                                                (notification) => (
                                                    <div
                                                        key={notification.id}
                                                        className={`p-4 flex ${!notification.read ? 'bg-muted/10' : ''}`}
                                                    >
                                                        <div className="mr-4 mt-1">
                                                            {getNotificationIcon(
                                                                notification.type,
                                                                notification.category
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="font-medium">
                                                                    {
                                                                        notification.title
                                                                    }
                                                                </h3>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {new Date(
                                                                        notification.date
                                                                    ).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {
                                                                    notification.message
                                                                }
                                                            </p>
                                                            <div className="flex justify-between items-center mt-2">
                                                                <span
                                                                    className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                                                                        notification.type ===
                                                                        'info'
                                                                            ? 'bg-blue-100 text-blue-800'
                                                                            : notification.type ===
                                                                                'success'
                                                                              ? 'bg-green-100 text-green-800'
                                                                              : notification.type ===
                                                                                  'warning'
                                                                                ? 'bg-amber-100 text-amber-800'
                                                                                : 'bg-red-100 text-red-800'
                                                                    }`}
                                                                >
                                                                    {
                                                                        notification.type
                                                                    }
                                                                </span>
                                                                <div className="flex space-x-2">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                    >
                                                                        Mark as{' '}
                                                                        {notification.read
                                                                            ? 'unread'
                                                                            : 'read'}
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )
                                        )}
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between border-t p-4">
                                    <p className="text-sm text-muted-foreground">
                                        Showing {filteredNotifications.length}{' '}
                                        notifications
                                    </p>
                                    <Button variant="outline" size="sm">
                                        Load More
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                        Email Notifications
                                    </label>
                                    <Switch
                                        checked={settings.emailNotifications}
                                        onCheckedChange={(checked: boolean) =>
                                            handleToggleSetting(
                                                'emailNotifications',
                                                checked
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium">
                                        Push Notifications
                                    </label>
                                    <Switch
                                        checked={settings.pushNotifications}
                                        onCheckedChange={(checked: boolean) =>
                                            handleToggleSetting(
                                                'pushNotifications',
                                                checked
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold">
                                    Notification Categories
                                </h3>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium flex items-center">
                                        <Bell
                                            size={16}
                                            className="mr-2 text-purple-500"
                                        />
                                        System Notifications
                                    </label>
                                    <Switch
                                        checked={settings.categories.system}
                                        onCheckedChange={(checked: boolean) =>
                                            handleToggleSetting(
                                                'categories.system',
                                                checked
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium flex items-center">
                                        <User
                                            size={16}
                                            className="mr-2 text-blue-500"
                                        />
                                        User Notifications
                                    </label>
                                    <Switch
                                        checked={settings.categories.user}
                                        onCheckedChange={(checked: boolean) =>
                                            handleToggleSetting(
                                                'categories.user',
                                                checked
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium flex items-center">
                                        <ShoppingCart
                                            size={16}
                                            className="mr-2 text-green-500"
                                        />
                                        Order Notifications
                                    </label>
                                    <Switch
                                        checked={settings.categories.order}
                                        onCheckedChange={(checked: boolean) =>
                                            handleToggleSetting(
                                                'categories.order',
                                                checked
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium flex items-center">
                                        <DollarSign
                                            size={16}
                                            className="mr-2 text-yellow-500"
                                        />
                                        Payment Notifications
                                    </label>
                                    <Switch
                                        checked={settings.categories.payment}
                                        onCheckedChange={(checked: boolean) =>
                                            handleToggleSetting(
                                                'categories.payment',
                                                checked
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium flex items-center">
                                        <MessageSquare
                                            size={16}
                                            className="mr-2 text-red-500"
                                        />
                                        Support Notifications
                                    </label>
                                    <Switch
                                        checked={settings.categories.support}
                                        onCheckedChange={(checked: boolean) =>
                                            handleToggleSetting(
                                                'categories.support',
                                                checked
                                            )
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full">Save Settings</Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
