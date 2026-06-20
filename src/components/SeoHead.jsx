import { useEffect } from "react";

/**
 * SeoHead - מנהל meta tags דינמית לפי עמוד
 * אין שינויים ויזואליים - רק עדכון ה-<head>
 */
export default function SeoHead({ title, description, googleVerification }) {
  useEffect(() => {
    // עדכון כותרת
    if (title) {
      document.title = title;
    }

    // עדכון meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    if (description) {
      metaDesc.content = description;
    }

    // עדכון / הוספת קוד אימות Google Search Console
    if (googleVerification) {
      let metaVerify = document.querySelector('meta[name="google-site-verification"]');
      if (!metaVerify) {
        metaVerify = document.createElement("meta");
        metaVerify.name = "google-site-verification";
        document.head.appendChild(metaVerify);
      }
      metaVerify.content = googleVerification;
    }
  }, [title, description, googleVerification]);

  return null;
}