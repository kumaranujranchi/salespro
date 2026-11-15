import { EmployeeDirectory } from '../components/sales-executive/EmployeeDirectory';

export function DirectoryPage() {
    return (
        <div className="space-y-4 sm:space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Team Directory</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    Browse team members, organizational roles, and direct communication channels
                </p>
            </div>
            <EmployeeDirectory />
        </div>
    );
}
