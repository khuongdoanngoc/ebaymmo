import { useState } from 'react';
import { Clock, Globe, Bell, Shield, User, Key } from 'lucide-react';
import { useTheme } from '../components/theme-provider';

const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Key },
    { id: 'appearance', label: 'Appearance', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'activity', label: 'Activity', icon: Clock }
];

export default function Settings() {
    const [activeTab, setActiveTab] = useState('profile');
    const { theme, setTheme } = useTheme();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences.
                </p>
            </div>

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 overflow-auto pb-2 lg:pb-0">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                                    activeTab === tab.id
                                        ? 'bg-secondary text-secondary-foreground'
                                        : 'hover:bg-secondary/50 hover:text-secondary-foreground'
                                }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </aside>
                <div className="flex-1 lg:max-w-2xl">
                    {activeTab === 'profile' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium">Profile</h3>
                                <p className="text-sm text-muted-foreground">
                                    Update your personal information.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Name
                                    </label>
                                    <input
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Your email"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Bio
                                    </label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Tell us about yourself"
                                    />
                                </div>
                                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium">
                                    Appearance
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Customize the appearance of the app.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none">
                                        Theme
                                    </label>
                                    <div className="flex flex-col space-y-1.5">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                checked={theme === 'light'}
                                                onChange={() =>
                                                    setTheme('light')
                                                }
                                            />
                                            <span>Light</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                checked={theme === 'dark'}
                                                onChange={() =>
                                                    setTheme('dark')
                                                }
                                            />
                                            <span>Dark</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="radio"
                                                checked={theme === 'system'}
                                                onChange={() =>
                                                    setTheme('system')
                                                }
                                            />
                                            <span>System</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium">
                                    Notifications
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Configure how you receive notifications.
                                </p>
                            </div>
                            <div className="space-y-4">
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" defaultChecked />
                                    <span>Email notifications</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" defaultChecked />
                                    <span>Push notifications</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" defaultChecked />
                                    <span>SMS notifications</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" defaultChecked />
                                    <span>Order updates</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" defaultChecked />
                                    <span>Product updates</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {(activeTab === 'account' ||
                        activeTab === 'security' ||
                        activeTab === 'activity') && (
                        <div className="flex items-center justify-center p-12 text-muted-foreground">
                            {activeTab.charAt(0).toUpperCase() +
                                activeTab.slice(1)}{' '}
                            settings will be displayed here.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
