const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CheckCircle, Mail, ArrowLeft, LogIn } from 'lucide-react';

export default function FeedbackPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('אנא מלא את תוכן המשוב.');
      return;
    }
    if (!user) {
      db.auth.redirectToLogin(window.location.href);
      return;
    }
    setLoading(true);
    try {
      await db.entities.Feedback.create({
        content,
        page_url: location.pathname + location.search,
        is_read: false
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback', error);
      alert('שגיאה בשליחת המשוב. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center" dir="rtl">
      <Card className="w-full max-w-2xl shadow-xl">
        {submitted ? (
          <CardContent className="p-10 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">תודה רבה!</h2>
            <p className="text-slate-600 mb-6">המשוב שלך נשלח בהצלחה ועוזר לנו להשתפר.</p>
            <Link to={createPageUrl('Home')}>
              <Button>
                <ArrowLeft className="w-4 h-4 ml-2" />
                חזרה לדף הבית
              </Button>
            </Link>
          </CardContent>
        ) : (
          <>
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center gap-2 bg-blue-100 rounded-full px-4 py-2 mb-4 mx-auto w-fit">
                <Mail className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">הערות והצעות לשיפור</span>
              </div>
              <CardTitle className="text-3xl font-bold">נשמח לשמוע ממך</CardTitle>
              <CardDescription className="text-lg text-slate-600">
                יש לך רעיון, הצעה לשיפור, או שמצאת תקלה? אנחנו כאן כדי להקשיב.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent>
                <Textarea
                  placeholder="כתוב את המשוב שלך כאן..."
                  className="min-h-[150px] text-base"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                {!user && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                    שליחת משוב דורשת התחברות. לחיצה על "שלח משוב" תעביר אותך להתחברות.
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? 'שולח...' : !user ? (
                    <><LogIn className="w-4 h-4 ml-2" />התחבר ושלח משוב</>
                  ) : 'שלח משוב'}
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}