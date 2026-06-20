const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

export default function Insurances() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await db.entities.InsuranceProvider.filter(
        { is_active: true },
        "sort_order"
      );
      setProviders(data);
    } catch (error) {
      console.error("Error loading insurance providers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 bg-yellow-100 rounded-full px-4 py-2 mb-4">
            <Shield className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">ביטוח נסיעות</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            ביטוח נסיעות לחופשת סקי
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            אל תצאו לחופשת סקי בלי ביטוח מתאים! כאן תמצאו את ספקי הביטוח המומלצים שלנו
          </p>
        </motion.div>

        {/* Providers Grid */}
        {providers.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <Shield className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 text-lg">אין ספקי ביטוח זמינים כעת</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider, index) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                  <CardHeader className="text-center border-b pb-4">
                    {provider.logo_url && (
                      <img
                        src={provider.logo_url}
                        alt={`${provider.name} לוגו`}
                        className="w-20 h-20 mx-auto rounded-full mb-4 object-contain bg-white p-2"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <CardTitle className="text-xl md:text-2xl font-bold text-slate-800">
                      {provider.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 flex-grow">
                    <p className="text-sm md:text-base text-slate-600 leading-relaxed">
                      {provider.description || "מומלץ לביטוח נסיעות"}
                    </p>
                  </CardContent>
                  <div className="p-4 md:p-6 border-t mt-auto">
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                    >
                      <a
                        href={provider.action_link}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        aria-label={`קבל הצעה מ-${provider.name}`}
                      >
                        <ExternalLink className="w-4 h-4 ml-2" />
                        קבל הצעה
                      </a>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}