import { EmployeeDirectory } from '../components/sales-executive/EmployeeDirectory';

export function DirectoryPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Team Directory</h1>
            <EmployeeDirectory />
        </div>
    );
}
