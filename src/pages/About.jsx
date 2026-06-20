const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

const DEFAULT_ABOUT_CONTENT = `ברוכים הבאים ל-SkiPlanner, הפלטפורמה המובילה בישראל עבור תכנון חופשת סקי באופן עצמאי וחכם. האתר שלנו נולד מתוך תשוקה עמוקה לעולם השלג והסנובורד, והוא נבנה על ידי קבוצת גולשים מנוסים ומומחי סקי שמכירים מקרוב כל מסלול, מעלית ועלות הכרוכים בחופשת חורף מושלמת. מטרת העל שלנו היא להנגיש את עולם הסקי לקהל הישראלי, לנפץ את המיתוס שמדובר בספורט לעשירים בלבד, ולאפשר לכל אחד להרכיב חופשת סקי בזול ובהתאמה אישית מלאה.

המערכת של SkiPlanner מיועדת לגולשים מכל הרמות – החל מתיירים שרוצים להתנסות בפעם הראשונה ומחפשים אתרי סקי למתחילים כמו בנסקו בבולגריה או רוקראז'ה, ועד לגולשים מקצוענים ומנוסים שמחפשים את מרחבי הגלישה הגדולים ביותר באירופה כמו ואל טורנס, מאיירהופן או שאמוני. במקום לרכוש חבילות סקי סגורות ויקרות דרך סוכנויות נסיעות, האתר מאפשר לכם לפרק את רכיבי החופשה ולהשוות עלויות בצורה שקופה: החל מאיתור טיסות ליעדי הסקי, דרך בחירת מלונות סקי-אין סקי-אאוט מפנקים או דירות להשכרה, ועד להזמנת סקי-פס, הדרכות סקי והשכרת ציוד גלישה במחירים המשתלמים ביותר. בעזרת הכלים הדיגיטליים שפיתחנו, תוכלו לנהל את תקציב החופשה, לחשב הוצאות של קבוצות וחברים, ולתכנן מסלול נסיעה מדויק משדה התעופה אל האתר, כדי שתגיעו לשלג בראש שקט ובמקסימום חיסכון.`;

export default function About() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const settings = await db.entities.SiteSettings.filter({ setting_name: "about_page_content" });
        if (settings && settings.length > 0 && settings[0].value) {
          setContent(settings[0].value);
        } else {
          setContent(DEFAULT_ABOUT_CONTENT);
        }
      } catch {
        setContent(DEFAULT_ABOUT_CONTENT);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white py-12 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-8 text-center">אודות SkiPlanner</h1>
        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-lg whitespace-pre-line">
          {content}
        </div>
      </div>
    </main>
  );
}