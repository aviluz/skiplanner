const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, LogIn } from 'lucide-react';

export default function GuestModeBanner({ onLogin }) {
  const handleLogin = () => {
    if (onLogin) {
      onLogin();
    } else {
      db.auth.redirectToLogin(window.location.href);
    }
  };

  return (
    <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-900">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <AlertTitle className="font-bold text-amber-900">מצב אורח</AlertTitle>
            <AlertDescription className="text-amber-800 text-sm">
              הנתונים נשמרים רק בדפדפן שלך. התחבר/י כדי לשמור את הטיול לצמיתות.
            </AlertDescription>
          </div>
        </div>
        <Button 
          onClick={handleLogin}
          size="sm"
          className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
        >
          <LogIn className="w-4 h-4 ml-2" />
          התחברות
        </Button>
      </div>
    </Alert>
  );
}