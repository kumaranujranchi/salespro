import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Id, Doc } from '../../../convex/_generated/dataModel';
import { Card, CardContent } from '../ui/Card';
import { Search, Bookmark } from 'lucide-react';
import { Input } from '../ui/Input';

export function AnnouncementCenter() {
    const { profile } = useAuth();
    const tenantId = profile?.tenant_id as Id<"tenants">;
    const [filter, setFilter] = useState('');

    const announcementsData = useQuery(api.announcements.listPublished, 
        tenantId ? { tenant_id: tenantId, limit: 50 } : "skip"
    );

    const loading = !announcementsData;
    const announcements = announcementsData || [];

    const filteredList = (announcements as Doc<"announcements">[]).filter((a: Doc<"announcements">) =>
        a.title.toLowerCase().includes(filter.toLowerCase()) ||
        a.content.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-2xl font-bold text-[#0A1C37]">Announcement Center</h2>
                <div className="md:w-1/3">
                    <Input placeholder="Search announcements..." value={filter} onChange={e => setFilter(e.target.value)} rightIcon={<Search size={18} />} />
                </div>
            </div>

            <div className="space-y-4">
                {filteredList.map((ann: Doc<"announcements">) => (
                    <Card key={ann._id} className={`border-l-4 ${ann.is_important ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        {ann.is_important && <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-medium">Important</span>}
                                        <span className="text-sm text-gray-500">{new Date(ann.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#0A1C37]">{ann.title}</h3>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                                </div>
                                <button className="text-gray-400 hover:text-yellow-500 transition-colors"><Bookmark size={20} /></button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {!loading && filteredList.length === 0 && <p className="text-center text-gray-500 py-10">No new announcements found.</p>}
            </div>
        </div>
    );
}
