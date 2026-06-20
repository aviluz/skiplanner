const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function VipNotificationBell({ user }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentItems, setRecentItems] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadNotifications();
      
      // Refresh every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const vipRequests = await db.entities.VipRequest.filter({ is_read: false }).catch(() => []);
      const feedbacks = await db.entities.Feedback.filter({ is_read: false }).catch(() => []);
      
      const totalUnread = vipRequests.length + feedbacks.length;
      setUnreadCount(totalUnread);
      
      // Combine and sort by date
      const combined = [
        ...vipRequests.map(r => ({ ...r, type: 'vip' })),
        ...feedbacks.map(f => ({ ...f, type: 'feedback' }))
      ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      setRecentItems(combined.slice(0, 5));
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const markAsRead = async (item) => {
    try {
      if (item.type === 'vip') {
        await db.entities.VipRequest.update(item.id, { is_read: true });
      } else {
        await db.entities.Feedback.update(item.id, { is_read: true });
      }
      await loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" dir="rtl">
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-800 mb-3">התראות חדשות</h3>
          
          {recentItems.length > 0 ? (
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {recentItems.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => {
                      markAsRead(item);
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-sm">
                        {item.type === 'vip' 
                          ? `VIP: ${item.user_name || 'אורח'}` 
                          : `משוב: ${item.created_by?.split('@')[0] || 'משתמש'}`}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${item.type === 'vip' ? 'bg-pink-100 text-pink-800' : 'bg-blue-100 text-blue-800'}`}
                      >
                        {item.type === 'vip' ? 'VIP' : 'משוב'}
                      </Badge>
                    </div>
                    {item.type === 'vip' ? (
                      <p className="text-xs text-slate-600">{item.user_email}</p>
                    ) : (
                      <p className="text-xs text-slate-600 line-clamp-2">{item.content}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(item.created_date).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-slate-500 text-center py-8">אין התראות חדשות</p>
          )}
          
          {unreadCount > 0 && (
            <Link to={createPageUrl('AdminPanel')} className="block">
              <Button variant="outline" className="w-full mt-2" onClick={() => setIsOpen(false)}>
                צפה בכל ההתראות ({unreadCount})
              </Button>
            </Link>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}