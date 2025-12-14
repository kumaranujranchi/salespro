import { TargetAchievement } from '../components/sales-executive/TargetAchievement';

export function MyPerformancePage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-[#0A1C37] dark:text-white">My Performance</h1>
            <TargetAchievement />
        </div>
    );
}
