import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';
import { ThemeProvider } from './components/theme-provider';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Customers from './pages/Customers';
import Layout from './components/Layout';
import StoreRequests from '@/pages/StoreRequests';
import BidPositions from '@/pages/BidPositions';
import WithdrawalRequests from '@/pages/WithdrawalRequests';
import StoreManagement from '@/pages/StoreManagement';
import OrderComplaints from '@/pages/OrderComplaints';
import DepositsList from '@/pages/DepositsList';
import Analytics from '@/pages/Analytics';
import Notifications from '@/pages/Notifications';
import Security from '@/pages/Security';
import Messages from '@/pages/Messages';
import Favorites from '@/pages/Favorites';
import AdminLogin from '@/pages/AdminLogin';
import NotFound from '@/pages/NotFound';
import { useEffect, useState } from 'react';
import { ApolloProvider } from '@apollo/client';
import client from './lib/apolloClient';
import SupportChat from '@/pages/SupportChat';

// Protected route component that checks for authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('accessToken');

        setIsAuthenticated(!!token);
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                Loading...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
};

function App() {
    return (
        <ApolloProvider client={client}>
            <ThemeProvider defaultTheme="light" storageKey="ebaymmo-theme">
                <Router>
                    <Routes>
                        {/* Admin Login Route */}
                        <Route path="/admin/login" element={<AdminLogin />} />

                        {/* Default to admin login */}
                        <Route
                            path="/"
                            element={<Navigate to="/admin/login" replace />}
                        />

                        {/* Redirect /admin to /admin/dashboard */}
                        <Route
                            path="/admin"
                            element={<Navigate to="/admin/dashboard" replace />}
                        />

                        {/* All Routes - Protected */}
                        <Route
                            path="/"
                            element={
                                // <ProtectedRoute>
                                    <Layout />
                                // </ProtectedRoute>
                            }
                        >
                            {/* Admin Routes */}
                            <Route
                                path="/admin/dashboard"
                                element={<Dashboard />}
                            />
                            <Route
                                path="/admin/analytics"
                                element={<Analytics />}
                            />
                            <Route
                                path="/admin/store-requests"
                                element={<StoreRequests />}
                            />
                            <Route
                                path="/admin/stores"
                                element={<StoreManagement />}
                            />
                            <Route path="/admin/orders" element={<Orders />} />
                            <Route
                                path="/admin/bid-positions"
                                element={<BidPositions />}
                            />
                            {/* <Route
                                path="/admin/products"
                                element={<Products />}
                            /> */}
                            <Route
                                path="/admin/customers"
                                element={<Customers />}
                            />
                            <Route
                                path="/admin/favorites"
                                element={<Favorites />}
                            />
                            <Route
                                path="/admin/withdrawals"
                                element={<WithdrawalRequests />}
                            />
                            <Route
                                path="/admin/deposits"
                                element={<DepositsList />}
                            />
                            <Route
                                path="/admin/payments"
                                element={<Messages />}
                            />
                            <Route
                                path="/admin/complaints"
                                element={<OrderComplaints />}
                            />
                            <Route
                                path="/admin/chatbox"
                                element={<SupportChat />}
                            />
                            <Route
                                path="/admin/notifications"
                                element={<Notifications />}
                            />
                            <Route
                                path="/admin/security"
                                element={<Security />}
                            />
                            {/* <Route
                                path="/admin/settings"
                                element={<Settings />}
                            /> */}
                            {/* <Route
                                path="/admin/services"
                                element={<Services />}
                            /> */}

                            {/* Catch-all route for undefined paths within Layout */}
                            <Route path="*" element={<NotFound />} />
                        </Route>

                        {/* Catch-all route for undefined paths outside the protected routes */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Router>
            </ThemeProvider>
        </ApolloProvider>
    );
}

export default App;
