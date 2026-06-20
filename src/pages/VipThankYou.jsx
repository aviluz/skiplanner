import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, Home, Gem } from 'lucide-react';
import { motion } from 'framer-motion';

export default function VipThankYou() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        className="max-w-2xl w-full text-center"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-6" />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl p-8 md:p-12"
        >
          <Gem className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            הטופס נשלח בהצלחה!
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed">
            תודה שבחרת בשירות ה-VIP שלנו!
            <br />
            מומחה סקי יחזור אליך בהקדם עם הצעה מותאמת אישית לפי הפרטים שמילאת.
          </p>

          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              בינתיים, תוכל להמשיך לגלוש באתר ולקרוא על יעדי הסקי השונים
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('Home')}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 w-full sm:w-auto"
                >
                  <Home className="w-5 h-5 mr-2" />
                  חזור לעמוד הבית
                </Button>
              </Link>

              <Link to={createPageUrl('Destinations')}>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  גלה יעדי סקי
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-sm text-slate-500"
        >
          <p>
            יש שאלה דחופה? צור איתנו קשר דרך WhatsApp או המייל
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}