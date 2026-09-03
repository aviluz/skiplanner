const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { createPageUrl } from "@/utils";

/**
 * שדות קלים הדרושים להצגת רשימת מאמרים / כרטיסים / מאמרים קשורים.
 * לא כולל content, meta/OG, canonical_url או שדות כבדים אחרים.
 * מטרה: להוריד את תגובת רשימת המאמרים מ-~41MB לנפח זעיר.
 */
export const ARTICLE_SUMMARY_FIELDS = [
  "id",
  "title",
  "slug",
  "excerpt",
  "featured_image_url",
  "featured_image_alt",
  "category",
  "published_at",
  "author_name",
  "is_visible_on_articles",
];

/**
 * בונה כתובת מאמר לפי Slug תקין, עם נפילה ל-id לתאימות לאחור.
 * @param {{id:string, slug?:string}} article
 * @returns {string}
 */
export function articleUrl(article) {
  if (!article) return createPageUrl("Articles");
  const slugOk = article.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug);
  if (slugOk) return createPageUrl(`ArticlePage?slug=${encodeURIComponent(article.slug)}`);
  return createPageUrl(`ArticlePage?id=${article.id}`);
}

/**
 * בונה canonical URL למאמר — מעדיף slug, אחרת id.
 */
export function articleCanonical(article, baseUrl = "https://skiplanner.db.app") {
  if (!article) return `${baseUrl}/Articles`;
  const slugOk = article.slug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug);
  if (slugOk) return `${baseUrl}/ArticlePage?slug=${encodeURIComponent(article.slug)}`;
  return `${baseUrl}/ArticlePage?id=${article.id}`;
}

/**
 * ולידציית slug: אותיות אנגליות קטנות, מספרים, מקפים; בלי רווחים/תווים מיוחדים;
 * בלי מקפים כפולים; לא מתחיל/מסתיים במקף; לא ריק.
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== "string") return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * מזהה שגיאת rate-limit (429 / traffic volume limit) מתוך אובייקט שגיאה.
 */
export function isRateLimitError(e) {
  const msg = String(e?.message || e || "").toLowerCase();
  return msg.includes("429") || msg.includes("traffic volume limit");
}

/**
 * מחלץ Retry-After מאובייקט שגיאה (שניות).
 * מנסה מספר נתיבים אפשריים; אם לא נמצא — מחזיר 60 שניות כברירת מחדל.
 */
export function extractRetryAfter(e) {
  const raw =
    e?.response?.headers?.get?.("retry-after") ||
    e?.headers?.get?.("retry-after") ||
    e?.retryAfter ||
    e?.retry_after ||
    null;
  if (raw != null) {
    const seconds = parseInt(String(raw), 10);
    if (!isNaN(seconds) && seconds > 0) return seconds;
  }
  const msg = String(e?.message || e || "");
  const match = msg.match(/retry[^\d]*(\d+)/i);
  if (match) {
    const seconds = parseInt(match[1], 10);
    if (!isNaN(seconds) && seconds > 0) return seconds;
  }
  return 60;
}