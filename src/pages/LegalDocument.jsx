const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookLock, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

export default function LegalDocument() {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDocument();
  }, []);

  const loadDocument = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const docType = urlParams.get('type');
    const docId = urlParams.get('id');

    if (!docType && !docId) {
      setError('לא צוין מסמך להצגה');
      setLoading(false);
      return;
    }

    try {
      let docData;
      
      if (docId) {
        // טעינה לפי ID
        docData = await db.entities.LegalDocument.get(docId);
      } else {
        // טעינה לפי סוג מסמך
        const docs = await db.entities.LegalDocument.filter({ 
          document_type: docType,
          is_active: true 
        });
        docData = docs.length > 0 ? docs[0] : null;
      }

      if (!docData) {
        setError('המסמך המבוקש לא נמצא');
      } else {
        setDocument(docData);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      setError('שגיאה בטעינת המסמך');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-12 text-center">
              <BookLock className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-slate-800 mb-2">המסמך לא נמצא</h2>
              <p className="text-slate-600">{error || 'המסמך המבוקש אינו זמין'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6"
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-4xl mx-auto">
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex items-center gap-3">
              <BookLock className="w-8 h-8 text-blue-600" />
              <CardTitle className="text-2xl md:text-3xl text-slate-800">
                {document.document_name}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-700 prose-a:text-blue-600 prose-strong:text-slate-900">
              <ReactMarkdown>
                {document.content}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>עדכון אחרון: {new Date(document.updated_date).toLocaleDateString('he-IL', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
      </div>
    </motion.div>
  );
}