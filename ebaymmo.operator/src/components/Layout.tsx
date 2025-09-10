import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Users,
    Settings,
    Menu,
    X,
    BarChart2,
    Heart,
    MessageSquare,
    Bell,
    Store,
    Wallet,
    Wallet2,
    ShoppingBag,
    ShieldAlert,
    LogOut,
    User,
    ChevronDown,
    Moon,
    Sun,
    AlertTriangle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { useTheme } from './theme-provider';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { useWithdrawalCount } from '@/hooks/useWithdrawalCount';
import {
    OrderBy,
    useGetOrderComplaintSubscription,
    useGetStoreSubscription
} from '@/generated/graphql';

export default function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();
    const [userData, setUserData] = useState<{
        name: string;
        email: string;
        role: string;
    } | null>(null);

    const { data: pendingStoreRequests } = useGetStoreSubscription({
        variables: {
            limit: 200,
            offset: 0,
            orderBy: { status: OrderBy.Asc },
            where: { status: { _eq: 'pending' } }
        },
        fetchPolicy: 'network-only'
    });

    const { data: pendingOrderComplaints } = useGetOrderComplaintSubscription({
        variables: {
            limit: 200,
            offset: 0,
            orderBy: [{ updateAt: OrderBy.Desc }, { orderCode: OrderBy.Asc }],
            where: {
                _or: [
                    {
                        orderStatus: {
                            _eq: 'complained'
                        }
                    },
                    {
                        orderStatus: {
                            _eq: 'dispute'
                        }
                    }
                ]
            }
        }
    });

    // Thêm hook để lấy số lượng pending withdrawals
    const { pendingCount: pendingWithdrawals } = useWithdrawalCount();

    // Admin navigation items - di chuyển tất cả vào trong component
    const adminMainNavItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
        { icon: BarChart2, label: 'Analytics', href: '/admin/analytics' }
    ];

    const adminStoreItems = [
        {
            icon: Users,
            label: 'Store Requests',
            href: '/admin/store-requests',
            badge: pendingStoreRequests?.stores.length || ''
        },
        { icon: Store, label: 'Manage Stores', href: '/admin/stores' },
        { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
        {
            icon: ShoppingBag,
            label: 'Bid Positions',
            href: '/admin/bid-positions'
        },
        // { icon: Package, label: 'Products', href: '/admin/products' },
        // { icon: Settings, label: 'Services', href: '/admin/services' },
        { icon: Users, label: 'Customers', href: '/admin/customers' },
        { icon: Heart, label: 'Favorite Stores', href: '/admin/favorites' }
    ];

    const adminFinancialItems = [
        {
            icon: Wallet,
            label: 'Withdrawals',
            href: '/admin/withdrawals',
            badge: pendingWithdrawals > 0 ? pendingWithdrawals : undefined
        },
        { icon: Wallet2, label: 'Deposits', href: '/admin/deposits' }
    ];

    const adminSupportItems = [
        {
            icon: AlertTriangle,
            label: 'Order Complaints',
            href: '/admin/complaints',
            badge: pendingOrderComplaints?.orders.length || 0
        },
        { icon: MessageSquare, label: 'Support Chat', href: '/admin/chatbox' },
        { icon: Bell, label: 'Notifications', href: '/admin/notifications' }
    ];

    const adminSystemItems = [
        { icon: ShieldAlert, label: 'Security', href: '/admin/security' }
        // { icon: Settings, label: 'System Settings', href: '/admin/settings' }
    ];

    useEffect(() => {
        // Get user data from localStorage
        const userDataStr = localStorage.getItem('user');
        if (userDataStr) {
            try {
                const parsed = JSON.parse(userDataStr);
                setUserData(parsed);
            } catch (e) {
                console.error('Failed to parse user data', e);
            }
        }
    }, []);

    // Close mobile menu when location changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location]);

    // Handle screen resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsMobileMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Function to determine if a nav item is active
    const isActive = (href: string) => {
        if (href === '/admin/dashboard') {
            return location.pathname === href || location.pathname === '/admin';
        }
        return location.pathname.startsWith(href);
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');

        // Show toast
        toast({
            title: 'Logged out',
            description: 'You have been successfully logged out'
        });

        // Redirect to login page
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur">
                <div className="flex h-16 items-center px-4">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setIsMobileMenuOpen(!isMobileMenuOpen)
                                }
                                className="lg:hidden p-2"
                            >
                                {isMobileMenuOpen ? (
                                    <X size={20} />
                                ) : (
                                    <Menu size={20} />
                                )}
                            </button>
                            <Link
                                to="/admin/dashboard"
                                className="flex items-center gap-2"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                    E
                                </div>
                                <span className="font-bold text-xl hidden sm:inline-block">
                                    SHOP3 ADMIN
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Theme toggle button */}
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    setTheme(
                                        theme === 'dark' ? 'light' : 'dark'
                                    )
                                }
                                className="rounded-full"
                            >
                                {theme === 'dark' ? (
                                    <Sun className="h-5 w-5" />
                                ) : (
                                    <Moon className="h-5 w-5" />
                                )}
                                <span className="sr-only">Toggle theme</span>
                            </Button>

                            {/* Admin user profile dropdown */}
                            <>
                                <Bell className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            className="flex items-center gap-2"
                                        >
                                            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                                                <User className="h-4 w-4" />
                                            </div>
                                            {userData && (
                                                <div className="hidden md:block text-left">
                                                    <p className="text-sm font-medium">
                                                        {userData.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {userData.role}
                                                    </p>
                                                </div>
                                            )}
                                            <ChevronDown className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="w-56"
                                    >
                                        <div className="p-2">
                                            <p className="text-sm font-medium">
                                                {userData?.name || 'Admin User'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {userData?.email ||
                                                    'admin@example.com'}
                                            </p>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                navigate('/admin/security')
                                            }
                                        >
                                            <ShieldAlert className="mr-2 h-4 w-4" />
                                            <span>Security Settings</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                navigate('/admin/settings')
                                            }
                                        >
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Preferences</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onSelect={handleLogout}
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Log Out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex">
                {/* Sidebar for desktop */}
                <aside className="w-64 border-r bg-background hidden lg:block pt-6">
                    <div className="px-3 py-2">
                        <nav className="space-y-6">
                            {/* Admin navigation only */}
                            <>
                                <div className="space-y-1">
                                    <h2 className="px-4 text-xs font-semibold text-muted-foreground">
                                        Admin Dashboard
                                    </h2>
                                    {adminMainNavItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className={cn(
                                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                                isActive(item.href)
                                                    ? 'bg-secondary text-secondary-foreground'
                                                    : 'hover:bg-secondary/50 hover:text-secondary-foreground'
                                            )}
                                        >
                                            <item.icon size={16} />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>

                                <div className="space-y-1">
                                    <h2 className="px-4 text-xs font-semibold text-muted-foreground">
                                        Store Management
                                    </h2>
                                    {adminStoreItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className={cn(
                                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                                isActive(item.href)
                                                    ? 'bg-secondary text-secondary-foreground'
                                                    : 'hover:bg-secondary/50 hover:text-secondary-foreground'
                                            )}
                                        >
                                            <item.icon size={16} />
                                            <span className="flex-1">
                                                {item.label}
                                            </span>
                                            {item.badge && (
                                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                                </div>

                                <div className="space-y-1">
                                    <h2 className="px-4 text-xs font-semibold text-muted-foreground">
                                        Financial
                                    </h2>
                                    {adminFinancialItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className={cn(
                                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                                isActive(item.href)
                                                    ? 'bg-secondary text-secondary-foreground'
                                                    : 'hover:bg-secondary/50 hover:text-secondary-foreground'
                                            )}
                                        >
                                            <item.icon size={16} />
                                            <span className="flex-1">
                                                {item.label}
                                            </span>
                                            {item.badge && (
                                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                                </div>

                                <div className="space-y-1">
                                    <h2 className="px-4 text-xs font-semibold text-muted-foreground">
                                        Support
                                    </h2>
                                    {adminSupportItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className={cn(
                                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                                isActive(item.href)
                                                    ? 'bg-secondary text-secondary-foreground'
                                                    : 'hover:bg-secondary/50 hover:text-secondary-foreground'
                                            )}
                                        >
                                            <item.icon size={16} />
                                            <span className="flex-1">
                                                {item.label}
                                            </span>
                                            {item.badge && (
                                                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    ))}
                                </div>

                                <div className="space-y-1">
                                    <h2 className="px-4 text-xs font-semibold text-muted-foreground">
                                        System
                                    </h2>
                                    {adminSystemItems.map((item) => (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            className={cn(
                                                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                                isActive(item.href)
                                                    ? 'bg-secondary text-secondary-foreground'
                                                    : 'hover:bg-secondary/50 hover:text-secondary-foreground'
                                            )}
                                        >
                                            <item.icon size={16} />
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </>
                        </nav>
                    </div>
                </aside>

                {/* Mobile sidebar */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-40 lg:hidden">
                        <div
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
                            onClick={() => setIsMobileMenuOpen(false)}
                        ></div>
                        <div className="fixed left-0 top-0 h-full w-3/4 max-w-xs bg-background p-6 shadow-lg overflow-y-auto">
                            <div className="flex items-center justify-between mb-8">
                                <Link
                                    to="/admin/dashboard"
                                    className="flex items-center gap-2"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                                        E
                                    </div>
                                    <span className="font-bold text-xl">
                                        Admin Panel
                                    </span>
                                </Link>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <nav className="space-y-6">
                                {/* Admin mobile navigation only */}
                                <>
                                    <div className="space-y-1">
                                        <h2 className="px-4 text-xs font-semibold text-muted-foreground">
                                            Admin Dashboard
                                        </h2>
                                        {adminMainNavItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                                    isActive(item.href)
                                                        ? 'bg-secondary text-secondary-foreground'
                                                        : 'hover:bg-secondary/50 hover:text-secondary-foreground'
                                                )}
                                            >
                                                <item.icon size={16} />
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="space-y-1">
                                        <h2 className="px-4 text-xs font-semibold text-muted-foreground">
                                            Store Management
                                        </h2>
                                        {adminStoreItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                                    isActive(item.href)
                                                        ? 'bg-secondary text-secondary-foreground'
                                                        : 'hover:bg-secondary/50 hover:text-secondary-foreground'
                                                )}
                                            >
                                                <item.icon size={16} />
                                                <span className="flex-1">
                                                    {item.label}
                                                </span>
                                                {item.badge && (
                                                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="space-y-1">
                                        <h2 className="px-4 text-xs font-semibold text-muted-foreground">
                                            Financial
                                        </h2>
                                        {adminFinancialItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                                    isActive(item.href)
                                                        ? 'bg-secondary text-secondary-foreground'
                                                        : 'hover:bg-secondary/50 hover:text-secondary-foreground'
                                                )}
                                            >
                                                <item.icon size={16} />
                                                <span className="flex-1">
                                                    {item.label}
                                                </span>
                                                {item.badge && (
                                                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="space-y-1">
                                        <h2 className="px-4 text-xs font-semibold text-muted-foreground">
                                            Support
                                        </h2>
                                        {adminSupportItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                                    isActive(item.href)
                                                        ? 'bg-secondary text-secondary-foreground'
                                                        : 'hover:bg-secondary/50 hover:text-secondary-foreground'
                                                )}
                                            >
                                                <item.icon size={16} />
                                                <span className="flex-1">
                                                    {item.label}
                                                </span>
                                                {item.badge && (
                                                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-primary rounded-full">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        ))}
                                    </div>

                                    <div className="space-y-1">
                                        <h2 className="px-4 text-xs font-semibold text-muted-foreground">
                                            System
                                        </h2>
                                        {adminSystemItems.map((item) => (
                                            <Link
                                                key={item.href}
                                                to={item.href}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                                                    isActive(item.href)
                                                        ? 'bg-secondary text-secondary-foreground'
                                                        : 'hover:bg-secondary/50 hover:text-secondary-foreground'
                                                )}
                                            >
                                                <item.icon size={16} />
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                </>
                            </nav>
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main className="flex-1 p-6 pb-20 lg:pb-6 overflow-y-auto">
                    <Outlet />
                </main>
            </div>

            {/* Bottom nav for mobile - Admin */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-20">
                <div className="grid grid-cols-5 gap-1 p-2">
                    <Link
                        to="/admin/dashboard"
                        className={cn(
                            'flex flex-col items-center justify-center py-2 text-xs',
                            isActive('/admin/dashboard')
                                ? 'text-primary'
                                : 'text-muted-foreground'
                        )}
                    >
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link
                        to="/admin/store-requests"
                        className={cn(
                            'flex flex-col items-center justify-center py-2 text-xs',
                            isActive('/admin/store-requests')
                                ? 'text-primary'
                                : 'text-muted-foreground'
                        )}
                    >
                        <Store size={20} />
                        <span>Stores</span>
                    </Link>
                    <Link
                        to="/admin/withdrawals"
                        className={cn(
                            'flex flex-col items-center justify-center py-2 text-xs',
                            isActive('/admin/withdrawals')
                                ? 'text-primary'
                                : 'text-muted-foreground'
                        )}
                    >
                        <Wallet size={20} />
                        <span>Finance</span>
                    </Link>
                    <Link
                        to="/admin/complaints"
                        className={cn(
                            'flex flex-col items-center justify-center py-2 text-xs',
                            isActive('/admin/complaints')
                                ? 'text-primary'
                                : 'text-muted-foreground'
                        )}
                    >
                        <AlertTriangle size={20} />
                        <span>Support</span>
                    </Link>
                    <div
                        className="flex flex-col items-center justify-center py-2 text-xs text-muted-foreground cursor-pointer"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
