import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { FileText } from 'lucide-react';

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#0A1C37] dark:text-white mb-2">Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Access and download reports</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText size={20} />
            <CardTitle>Available Reports</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No reports available</p>
        </CardContent>
      </Card>
    </div>
  );
}
