// Demo data for charts
export const salesData = [
    { name: 'Jan', value: 4000 },
    { name: 'Feb', value: 3000 },
    { name: 'Mar', value: 5000 },
    { name: 'Apr', value: 2780 },
    { name: 'May', value: 1890 },
    { name: 'Jun', value: 2390 },
    { name: 'Jul', value: 3490 },
    { name: 'Aug', value: 4000 },
    { name: 'Sep', value: 3000 },
    { name: 'Oct', value: 2000 },
    { name: 'Nov', value: 2780 },
    { name: 'Dec', value: 3890 }
];

export const orderStatusData = [
    { name: 'Completed', value: 540, color: '#16a34a' },
    { name: 'Processing', value: 215, color: '#0ea5e9' },
    { name: 'Pending', value: 148, color: '#eab308' },
    { name: 'Cancelled', value: 92, color: '#ef4444' }
];

export const COLORS = ['#16a34a', '#0ea5e9', '#eab308', '#ef4444'];

export interface DashboardStats {
    users: {
        total: number;
        active: number;
        suspended: number;
        growth: number;
    };
    stores: {
        total: number;
        active: number;
        pending: number;
        growth: number;
    };
    orders: {
        total: number;
        completed: number;
        pending: number;
        totalAmount: number;
        growth: number;
    };
    deposits: {
        total: number;
        completed: number;
        pending: number;
        totalAmount: number;
        growth: number;
    };
    withdrawals: {
        total: number;
        completed: number;
        pending: number;
        totalAmount: number;
        growth: number;
    };
    revenue: {
        today: number;
        yesterday: number;
        thisWeek: number;
        lastWeek: number;
        thisMonth: number;
        lastMonth: number;
    };
}

// Mock dashboard data
export const mockDashboardData: DashboardStats = {
    users: {
        total: 12489,
        active: 10872,
        suspended: 231,
        growth: 12.4
    },
    stores: {
        total: 964,
        active: 824,
        pending: 82,
        growth: 8.7
    },
    orders: {
        total: 35920,
        completed: 29752,
        pending: 3421,
        totalAmount: 1284790.52,
        growth: 15.8
    },
    revenue: {
        today: 12540,
        yesterday: 10230,
        thisWeek: 74580,
        lastWeek: 68220,
        thisMonth: 298760,
        lastMonth: 278430
    },
    deposits: {
        total: 4891,
        completed: 4720,
        pending: 171,
        totalAmount: 582640.75,
        growth: 4.2
    },
    withdrawals: {
        total: 3215,
        completed: 3012,
        pending: 203,
        totalAmount: 421580.25,
        growth: -2.8
    }
};
