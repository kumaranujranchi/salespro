import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Info, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useQuery, useMutation } from "convex/react";
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';

export function NotificationBell() {
    const { profile } = useAuth();
    const notifications = useQuery(api.notifications.list, 
        profile?._id ? { user_id: profile._id as Id<"profiles">, limit: 10 } : "skip"
    ) || [];
    
    const unreadCount = notifications.filter(n => !n.is_read).length;
    const markReadMutation = useMutation(api.notifications.markRead);
    const markAllReadMutation = useMutation(api.notifications.markAllRead);
    
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Handle click outside to close
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    // Show popup on fresh login if unread notifications exist
    const [showPopup, setShowPopup] = useState(false);
    useEffect(() => {
        if (unreadCount > 0 && profile?._id) {
            const storageKey = `hasSeenNotificationPopup_${profile._id}`;
            const hasSeen = sessionStorage.getItem(storageKey);
            
            if (!hasSeen) {
                setShowPopup(true);
                sessionStorage.setItem(storageKey, 'true');
                
                // Auto-hide after 5 seconds
                const timer = setTimeout(() => setShowPopup(false), 5000);
                return () => clearTimeout(timer);
            }
        }
    }, [unreadCount, profile?._id]);

    const markAsRead = async (id: string) => {
        await markReadMutation({ id: id as Id<"notifications"> });
    };

    const markAllRead = async () => {
        if (profile?._id) {
            await markAllReadMutation({ user_id: profile._id as Id<"profiles"> });
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} className="text-green-500" />;
            case 'error': return <XCircle size={16} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-orange-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Tooltip content="Notifications" position="bottom">
                <button
                    onClick={() => {
                        setIsOpen(!isOpen);
                        setShowPopup(false);
                    }}
                    className="relative p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-[#1673FF]"
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] bg-red-600 text-white text-[10px] font-bold rounded-full animate-bounce ring-2 ring-white shadow-sm px-1">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </button>
            </Tooltip>

            {/* Fresh Login Notification Popup */}
            {showPopup && (
                <div className="absolute top-12 -right-4 w-48 bg-[#00C853] text-[#0A1C37] text-sm p-3 rounded-lg shadow-xl z-50 animate-bounce cursor-pointer" 
                    onClick={() => {
                        setIsOpen(true);
                        setShowPopup(false);
                    }}
                >
                    <div className="absolute -top-1 right-6 w-3 h-3 bg-[#00C853] rotate-45 transform"></div>
                    <div className="font-bold mb-1">New Notifications! 🔔</div>
                    <div className="text-xs font-medium opacity-90">Check out the latest announcements and updates.</div>
                </div>
            )}

            {isOpen && (
                <div className="fixed left-4 right-4 top-[72px] w-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:left-auto sm:w-80 max-w-[calc(100vw-2rem)] sm:max-w-[320px] bg-white rounded-lg shadow-lg py-1 border border-gray-100 z-50 animate-fadeIn">
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-lg">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-[#1673FF] hover:underline">
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                No notifications
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                                    onClick={() => {
                                        markAsRead(notification.id);
                                        if (notification.related_entity_type === 'announcement') {
                                            navigate('/announcements');
                                            setIsOpen(false);
                                        }
                                    }}
                                >
                                    <div className="flex gap-3 items-start">
                                        <div className="mt-0.5 shrink-0">
                                            {getIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium text-gray-900 ${!notification.is_read ? 'font-semibold' : ''}`}>
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">
                                                {new Date(notification.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        {!notification.is_read && (
                                            <div className="w-1.5 h-1.5 bg-[#1673FF] rounded-full shrink-0 mt-2"></div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
