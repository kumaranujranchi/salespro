import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Search, Download, User } from 'lucide-react';
import { Profile } from '../../types/database';

export function EmployeeDirectory() {
    const [employees, setEmployees] = useState<Profile[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEmployees();
    }, []);

    const loadEmployees = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('is_active', true)
                .neq('role', 'super_admin')
                .order('full_name');
            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            console.error('Error loading employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp =>
        emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (emp.phone && emp.phone.includes(searchTerm))
    );

    const exportCSV = () => {
        const headers = ['Full Name', 'Role', 'Email', 'Phone', 'Department', 'Employee ID'];
        const csvData = filteredEmployees.map(emp => [
            emp.full_name,
            emp.role,
            emp.email,
            emp.phone || '',
            emp.department_id || '',
            emp.employee_id
        ]);

        const csvContent = [headers, ...csvData].map(e => e.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'employee_directory.csv';
        link.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-slate-100 dark:border-white/10">
                <div className="w-1/3">
                    <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        rightIcon={<Search size={18} />}
                        className="dark:bg-white/5 dark:text-white dark:border-white/10"
                    />
                </div>
                <Button onClick={exportCSV} variant="outline" className="flex items-center gap-2 dark:text-white dark:border-white/10 dark:hover:bg-white/10">
                    <Download size={18} /> Export CSV
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {loading ? (
                    <p className="col-span-3 text-center py-10 text-gray-500 dark:text-gray-400">Loading directory...</p>
                ) : filteredEmployees.map((emp) => (
                    <Card key={emp.id} className="hover:shadow-md transition-shadow overflow-hidden dark:bg-surface-dark dark:border-white/10">
                        <CardContent className="p-4 md:p-6 flex items-center gap-4">
                            <div className="flex-shrink-0 h-16 w-16 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center overflow-hidden border-2 border-white dark:border-white/10 shadow-sm">
                                {emp.image_url ? (
                                    <img
                                        src={emp.image_url}
                                        alt={emp.full_name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                    />
                                ) : null}
                                <User size={32} className={`text-gray-400 dark:text-gray-500 ${emp.image_url ? 'hidden' : ''}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-slate-800 dark:text-white truncate" title={emp.full_name}>{emp.full_name}</h3>
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium capitalize truncate">{emp.role.replace('_', ' ')}</p>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                                    <p className="truncate" title={emp.email}>{emp.email}</p>
                                    <p className="truncate">{emp.phone}</p>
                                    <p className="text-xs bg-gray-100 dark:bg-white/10 inline-block px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 mt-1">ID: {emp.employee_id}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {!loading && filteredEmployees.length === 0 && (
                <div className="text-center py-10 text-gray-500">No employees found matching your search.</div>
            )}
        </div>
    );
}
