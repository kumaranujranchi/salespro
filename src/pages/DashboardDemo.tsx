import { DraggableDashboard, DashboardItem } from '../components/layout/DraggableDashboard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { BarChart3, Users, DollarSign, Activity } from 'lucide-react';

export default function DashboardDemo() {
    const items: DashboardItem[] = [
        {
            id: 'welcome',
            content: (
                <Card className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                    <CardContent className="h-full flex flex-col justify-center">
                        <h1 className="text-2xl font-bold">Interactive Dashboard Demo</h1>
                        <p className="opacity-90">Drag cards by hovering over the top-right corner handle. Resize from the bottom-right.</p>
                    </CardContent>
                </Card>
            ),
            defaultLayout: { x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 }
        },
        {
            id: 'stat1',
            content: (
                <Card className="h-full">
                    <CardHeader><CardTitle className="flex gap-2"><Users size={18} /> Total Users</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold">1,234</p></CardContent>
                </Card>
            ),
            defaultLayout: { x: 0, y: 2, w: 3, h: 2, minW: 2, minH: 2 }
        },
        {
            id: 'stat2',
            content: (
                <Card className="h-full">
                    <CardHeader><CardTitle className="flex gap-2"><DollarSign size={18} /> Revenue</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold">$54,321</p></CardContent>
                </Card>
            ),
            defaultLayout: { x: 3, y: 2, w: 3, h: 2, minW: 2, minH: 2 }
        },
        {
            id: 'stat3',
            content: (
                <Card className="h-full">
                    <CardHeader><CardTitle className="flex gap-2"><Activity size={18} /> Active Sessions</CardTitle></CardHeader>
                    <CardContent><p className="text-3xl font-bold">89%</p></CardContent>
                </Card>
            ),
            defaultLayout: { x: 6, y: 2, w: 3, h: 2, minW: 2, minH: 2 }
        },
        {
            id: 'chart',
            content: (
                <Card className="h-full">
                    <CardHeader><CardTitle className="flex gap-2"><BarChart3 size={18} /> Performance Overview</CardTitle></CardHeader>
                    <CardContent className="flex items-center justify-center bg-slate-50 rounded-xl m-4 h-32">
                        <span className="text-gray-400">Chart Placeholder</span>
                    </CardContent>
                </Card>
            ),
            defaultLayout: { x: 0, y: 4, w: 8, h: 4, minW: 4, minH: 3 }
        },
        {
            id: 'sidebar',
            content: (
                <Card className="h-full bg-slate-800 text-white">
                    <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm opacity-80">
                            <li>• New user registered</li>
                            <li>• Server load high</li>
                            <li>• Payment received</li>
                        </ul>
                    </CardContent>
                </Card>
            ),
            defaultLayout: { x: 8, y: 2, w: 4, h: 6, minW: 2, minH: 4 }
        }
    ];

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <DraggableDashboard
                items={items}
                dashboardId="demo-dashboard"
            />
        </div>
    );
}
