import React, { useState, useEffect } from 'react';
import { SiteSettings } from '@/entities/SiteSettings';
import { Card, CardContent } from '@/components/ui/card';
import { BookLock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function TermsOfUse() {
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const settings = await SiteSettings.list();
        const termsSetting = settings.find(s => s.setting_name === 'terms_of_use');
        if (termsSetting) {
          setTerms(termsSetting.value);
        }
      } catch (error) {
        console.error("Failed to fetch terms of use", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-slate-200 rounded-full px-4 py-2 mb-4">
            <BookLock className="w-5 h-5 text-slate-600" />
            <span className="text-slate-800 font-medium">מסמך משפטי</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">תנאי שימוש</h1>
        </div>

        <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6 md:p-8">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
              </div>
            ) : (
              <div className="prose prose-slate max-w-none prose-h2:font-bold prose-h2:text-slate-800 prose-a:text-blue-600 hover:prose-a:text-blue-800 text-right">
                <ReactMarkdown>{terms || 'לא נמצאו תנאי שימוש.'}</ReactMarkdown>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}