import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { ShieldAlert, Lock, KeyRound, CheckCircle } from 'lucide-react';

// Create a mock Switch component since it might not exist
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

interface SecuritySettings {
    twoFactorAuth: boolean;
    loginNotifications: boolean;
    ipRestriction: boolean;
    passwordExpiry: number; // Days
    sessionTimeout: number; // Minutes
}

interface ActivityLog {
    id: string;
    action: string;
    user: string;
    userRole: string;
    ip: string;
    timestamp: string;
    status: 'success' | 'warning' | 'failed';
    details: string;
}

export default function Security() {
    const [activeTab, setActiveTab] = useState('settings');
    const [settings, setSettings] = useState<SecuritySettings>({
        twoFactorAuth: true,
        loginNotifications: true,
        ipRestriction: false,
        passwordExpiry: 90,
        sessionTimeout: 30
    });

    const { data: _activityLogs, isLoading: loadingLogs } = useQuery<
        ActivityLog[]
    >({
        queryKey: ['admin', 'security', 'activity-logs'],
        queryFn: () =>
            api.get('/admin/security/activity-logs').then((res) => res.data),
        enabled: activeTab === 'activity'
    });

    const handleSettingChange = (
        key: keyof SecuritySettings,
        value: boolean | number
    ) => {
        setSettings((prev) => ({
            ...prev,
            [key]: value
        }));
    };

    // Mock activity logs
    const mockActivityLogs: ActivityLog[] = Array(10)
        .fill(0)
        .map((_, i) => {
            const actionTypes = [
                'User Login',
                'Password Change',
                'Admin Login',
                'Permission Change',
                'API Key Generated',
                'User Locked',
                'Settings Changed'
            ];
            const status = ['success', 'warning', 'failed'] as const;
            const selectedStatus =
                status[
                    Math.floor(Math.random() * (i === 0 ? 1 : status.length))
                ];

            return {
                id: `log-${i + 1}`,
                action: actionTypes[
                    Math.floor(Math.random() * actionTypes.length)
                ],
                user:
                    i % 3 === 0 ? 'admin@example.com' : `user${i}@example.com`,
                userRole: i % 3 === 0 ? 'Administrator' : 'Staff',
                ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                timestamp: new Date(
                    Date.now() -
                        Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000
                ).toISOString(),
                status: selectedStatus,
                details:
                    selectedStatus === 'failed'
                        ? 'Authentication failed - Invalid credentials'
                        : selectedStatus === 'warning'
                          ? 'Login from new IP address detected'
                          : 'Operation completed successfully'
            };
        });

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Security</h1>
            </div>

            <Tabs
                defaultValue="settings"
                value={activeTab}
                onValueChange={setActiveTab}
            >
                <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="settings">
                        Security Settings
                    </TabsTrigger>
                    <TabsTrigger value="activity">Activity Log</TabsTrigger>
                    <TabsTrigger value="permissions">
                        Access Control
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="settings">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock size={18} />
                                    Authentication Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="font-medium">
                                            Two-Factor Authentication
                                        </label>
                                        <p className="text-sm text-muted-foreground">
                                            Require 2FA for all admin users
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.twoFactorAuth}
                                        onCheckedChange={(checked) =>
                                            handleSettingChange(
                                                'twoFactorAuth',
                                                checked
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="font-medium">
                                            Login Notifications
                                        </label>
                                        <p className="text-sm text-muted-foreground">
                                            Send email for new login locations
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.loginNotifications}
                                        onCheckedChange={(checked) =>
                                            handleSettingChange(
                                                'loginNotifications',
                                                checked
                                            )
                                        }
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <label className="font-medium">
                                            IP Restriction
                                        </label>
                                        <p className="text-sm text-muted-foreground">
                                            Restrict admin access to specific
                                            IPs
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.ipRestriction}
                                        onCheckedChange={(checked) =>
                                            handleSettingChange(
                                                'ipRestriction',
                                                checked
                                            )
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="font-medium">
                                        Password Expiry
                                    </label>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Days until password must be changed
                                    </p>
                                    <Select
                                        value={settings.passwordExpiry.toString()}
                                        onValueChange={(value) =>
                                            handleSettingChange(
                                                'passwordExpiry',
                                                parseInt(value)
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="30">
                                                30 days
                                            </SelectItem>
                                            <SelectItem value="60">
                                                60 days
                                            </SelectItem>
                                            <SelectItem value="90">
                                                90 days
                                            </SelectItem>
                                            <SelectItem value="180">
                                                180 days
                                            </SelectItem>
                                            <SelectItem value="0">
                                                Never
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="font-medium">
                                        Session Timeout
                                    </label>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Minutes until inactive sessions log out
                                    </p>
                                    <Select
                                        value={settings.sessionTimeout.toString()}
                                        onValueChange={(value) =>
                                            handleSettingChange(
                                                'sessionTimeout',
                                                parseInt(value)
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15">
                                                15 minutes
                                            </SelectItem>
                                            <SelectItem value="30">
                                                30 minutes
                                            </SelectItem>
                                            <SelectItem value="60">
                                                1 hour
                                            </SelectItem>
                                            <SelectItem value="120">
                                                2 hours
                                            </SelectItem>
                                            <SelectItem value="0">
                                                Never
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button className="w-full">
                                    Save Security Settings
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <KeyRound size={18} />
                                        API Keys
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Manage API keys for external
                                            integrations
                                        </p>
                                        <div className="flex items-end gap-2">
                                            <div className="flex-1">
                                                <Input
                                                    type="text"
                                                    placeholder="API Key Description"
                                                    disabled
                                                    value="Production API Key"
                                                />
                                            </div>
                                            <Button variant="outline">
                                                Regenerate
                                            </Button>
                                            <Button variant="destructive">
                                                Revoke
                                            </Button>
                                        </div>
                                        <Button
                                            variant="outline"
                                            className="w-full"
                                        >
                                            Generate New API Key
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <ShieldAlert size={18} />
                                        Security Audit
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Run security checks on your system
                                        </p>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle
                                                    size={16}
                                                    className="text-green-500"
                                                />
                                                <span className="text-sm">
                                                    Last scan: 2 days ago
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle
                                                    size={16}
                                                    className="text-green-500"
                                                />
                                                <span className="text-sm">
                                                    No critical issues found
                                                </span>
                                            </div>
                                        </div>
                                        <Button className="w-full">
                                            Run Security Scan
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Activity Log</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-4 border-b">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <Input placeholder="Search logs..." />
                                    <Select defaultValue="all">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by user" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Users
                                            </SelectItem>
                                            <SelectItem value="admin">
                                                Administrators
                                            </SelectItem>
                                            <SelectItem value="staff">
                                                Staff
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select defaultValue="all">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by action" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                All Actions
                                            </SelectItem>
                                            <SelectItem value="login">
                                                Logins
                                            </SelectItem>
                                            <SelectItem value="changes">
                                                System Changes
                                            </SelectItem>
                                            <SelectItem value="failed">
                                                Failed Attempts
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                    >
                                        Export Logs
                                    </Button>
                                </div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loadingLogs
                                        ? Array(5)
                                              .fill(0)
                                              .map((_, i) => (
                                                  <TableRow key={i}>
                                                      <TableCell colSpan={6}>
                                                          <div className="h-10 bg-muted/20 rounded animate-pulse"></div>
                                                      </TableCell>
                                                  </TableRow>
                                              ))
                                        : mockActivityLogs.map((log) => (
                                              <TableRow key={log.id}>
                                                  <TableCell>
                                                      {new Date(
                                                          log.timestamp
                                                      ).toLocaleString()}
                                                  </TableCell>
                                                  <TableCell>
                                                      <div className="font-medium">
                                                          {log.user}
                                                      </div>
                                                      <div className="text-xs text-muted-foreground">
                                                          {log.userRole}
                                                      </div>
                                                  </TableCell>
                                                  <TableCell>
                                                      {log.action}
                                                  </TableCell>
                                                  <TableCell>
                                                      {log.ip}
                                                  </TableCell>
                                                  <TableCell>
                                                      <span
                                                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                              log.status ===
                                                              'success'
                                                                  ? 'bg-green-100 text-green-800'
                                                                  : log.status ===
                                                                      'warning'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                          }`}
                                                      >
                                                          {log.status}
                                                      </span>
                                                  </TableCell>
                                                  <TableCell className="max-w-[200px] truncate">
                                                      {log.details}
                                                  </TableCell>
                                              </TableRow>
                                          ))}
                                </TableBody>
                            </Table>
                            <div className="p-4 flex justify-between items-center border-t">
                                <div className="text-sm text-muted-foreground">
                                    Showing {mockActivityLogs.length} of{' '}
                                    {mockActivityLogs.length} logs
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled
                                    >
                                        Previous
                                    </Button>
                                    <div className="text-sm">Page 1 of 1</div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="permissions">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Permissions Management</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b">
                                <Input placeholder="Search users..." />
                                <Select defaultValue="all">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Roles
                                        </SelectItem>
                                        <SelectItem value="admin">
                                            Administrators
                                        </SelectItem>
                                        <SelectItem value="manager">
                                            Managers
                                        </SelectItem>
                                        <SelectItem value="staff">
                                            Staff
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button className="w-full">Add New User</Button>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Active</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {Array(5)
                                        .fill(0)
                                        .map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {i === 0
                                                            ? 'admin@example.com'
                                                            : `user${i}@example.com`}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                        {i === 0
                                                            ? 'Administrator'
                                                            : i === 1
                                                              ? 'Manager'
                                                              : 'Staff'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            i === 3
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-green-100 text-green-800'
                                                        }`}
                                                    >
                                                        {i === 3
                                                            ? 'Locked'
                                                            : 'Active'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(
                                                        Date.now() -
                                                            Math.floor(
                                                                Math.random() *
                                                                    7
                                                            ) *
                                                                24 *
                                                                60 *
                                                                60 *
                                                                1000
                                                    ).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex space-x-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            {i === 3
                                                                ? 'Unlock'
                                                                : 'Lock'}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
