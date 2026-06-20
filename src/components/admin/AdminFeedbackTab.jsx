import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const AdminFeedbackTabContent = ({ feedbackList, handleMarkFeedbackAsRead }) => {
  const unreadFeedbacks = feedbackList.filter(f => !f.is_read);
  
  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>משובים חדשים ({unreadFeedbacks.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {unreadFeedbacks.length > 0 ? unreadFeedbacks.map(item => (
            <div key={item.id} className="p-4 border rounded-lg bg-amber-50 border-amber-200 relative">
              <div className="absolute top-2 left-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              <p className="text-slate-800">{item.content}</p>
              <div className="text-xs text-slate-500 mt-2 pt-2 border-t">
                <p>נשלח על ידי: {item.created_by}</p>
                <p>בתאריך: {new Date(item.created_date).toLocaleString('he-IL')}</p>
                {item.page_url && <p>מדף: {item.page_url}</p>}
              </div>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => handleMarkFeedbackAsRead(item.id)}>
                סמן כנקרא
              </Button>
            </div>
          )) : <p>אין משובים חדשים.</p>}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle>כל המשובים ({feedbackList.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedbackList.length > 0 ? feedbackList.map(item => (
            <div key={item.id} className="p-4 border rounded-lg bg-slate-50">
              <div className="flex justify-between items-start mb-2">
                <Badge variant={item.is_read ? 'secondary' : 'default'}>
                  {item.is_read ? 'נקרא' : 'חדש'}
                </Badge>
              </div>
              <p className="text-slate-800">{item.content}</p>
              <div className="text-xs text-slate-500 mt-2 pt-2 border-t">
                <p>נשלח על ידי: {item.created_by}</p>
                <p>בתאריך: {new Date(item.created_date).toLocaleString('he-IL')}</p>
                {item.page_url && <p>מדף: {item.page_url}</p>}
              </div>
            </div>
          )) : <p>אין משובים.</p>}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminFeedbackTabContent;