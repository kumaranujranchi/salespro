import React, { useState, useEffect, useCallback } from 'react';
// @ts-ignore - WidthProvider/Responsive are often on default export in ESM build
import GridLayout from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Button } from '../ui/Button';
import { RotateCcw, GripVertical } from 'lucide-react';
import clsx from 'clsx';

const { Responsive, WidthProvider } = GridLayout;
const ResponsiveGridLayout = WidthProvider(Responsive);

export interface DashboardItem {
    id: string;
    content: React.ReactNode;
    defaultLayout: {
        w: number;
        h: number; // 1 unit approx 100px? RGL uses rowHeight
        x: number;
        y: number;
        minW?: number;
        minH?: number;
        maxW?: number;
        maxH?: number;
    };
}

interface DraggableDashboardProps {
    items: DashboardItem[];
    dashboardId: string;
    className?: string;
    rowHeight?: number;
}

export function DraggableDashboard({ items, dashboardId, className = '', rowHeight = 100 }: DraggableDashboardProps) {
    const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({});
    const [isLoaded, setIsLoaded] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Define breakpoints
    const breakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
    const cols = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

    // Generate default layout from items
    const generateDefaultLayout = useCallback((): Layout[] => {
        return items.map(item => ({
            i: item.id,
            x: item.defaultLayout.x,
            y: item.defaultLayout.y,
            w: item.defaultLayout.w,
            h: item.defaultLayout.h,
            minW: item.defaultLayout.minW || 2,
            minH: item.defaultLayout.minH || 2,
            maxW: item.defaultLayout.maxW,
            maxH: item.defaultLayout.maxH,
        })) as unknown as Layout[];
    }, [items]);

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem(`dashboard_layout_${dashboardId}`);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setLayouts(parsed);
            } catch (e) {
                console.error("Failed to load layout", e);
                // Fallback to default
                const defaultL = generateDefaultLayout();
                setLayouts({ lg: defaultL, md: defaultL, sm: defaultL, xs: defaultL, xxs: defaultL });
            }
        } else {
            const defaultL = generateDefaultLayout();
            setLayouts({ lg: defaultL, md: defaultL, sm: defaultL, xs: defaultL, xxs: defaultL });
        }
        setIsLoaded(true);
    }, [dashboardId, generateDefaultLayout]);

    const handleLayoutChange = (_currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
        if (!isLoaded || isResetting) return;
        setLayouts(allLayouts);
        localStorage.setItem(`dashboard_layout_${dashboardId}`, JSON.stringify(allLayouts));
    };

    const handleReset = () => {
        if (!window.confirm("Are you sure you want to reset the dashboard layout?")) return;

        setIsResetting(true);
        localStorage.removeItem(`dashboard_layout_${dashboardId}`);

        // Animate reset
        const defaultL = generateDefaultLayout();
        setLayouts({ lg: defaultL, md: defaultL, sm: defaultL, xs: defaultL, xxs: defaultL });

        setTimeout(() => {
            setIsResetting(false);
        }, 500);
    };

    if (!isLoaded) return <div className="p-10 text-center">Loading dashboard Layout...</div>;

    return (
        <div className={clsx("relative", className)}>
            <div className="flex justify-end mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="flex items-center gap-2 text-gray-500 hover:text-red-500 transition-colors"
                >
                    <RotateCcw size={14} />
                    Reset Layout
                </Button>
            </div>

            <ResponsiveGridLayout
                className={clsx("layout", isResetting && "animate-pulse")}
                layouts={layouts}
                breakpoints={breakpoints}
                cols={cols}
                rowHeight={rowHeight}
                draggableHandle=".drag-handle"
                onLayoutChange={handleLayoutChange}
                margin={[16, 16]}
                containerPadding={[0, 0]}
                isDraggable={true}
                isResizable={true}
            >
                {items.map(item => (
                    <div key={item.id} className="relative group h-full">
                        {/* Drag Handle */}
                        <div className="drag-handle absolute top-2 right-2 z-50 cursor-move p-2 rounded-md bg-blue-50 text-blue-600 hover:bg-white hover:shadow-md transition-all shadow-sm border border-blue-100">
                            <GripVertical size={20} />
                        </div>

                        {/* Content Container */}
                        <div className="h-full w-full overflow-hidden">
                            {item.content}
                        </div>
                    </div>
                ))}
            </ResponsiveGridLayout>
        </div>
    );
}
