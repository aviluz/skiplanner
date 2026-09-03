const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from "react";

import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, ArrowRight, Calendar, Tag, Home as HomeIcon, BookOpen, AlertTriangle, RefreshCw, ChevronLeft } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import SeoHead from "@/components/SeoHead";
import ArticleCard from "@/components/articles/ArticleCard";
import RateLimitState from "@/components/RateLimitState";
import { articleCanonical, isRateLimitError, extractRetryAfter, ARTICLE_SUMMARY_FIELDS } from "@/lib/articleUtils";

const BASE_URL = "https://skiplanner.db.app";

/**
 * Fetch related articles using summary fields only (no content).
 * Preserves related_article_ids order, dedup, excludes current, max 3.
 * Fills from same category if not enough linked articles.
 * Uses targeted queries ($in / $nin) instead of pulling the whole article pool.
 */
async function fetchRelatedArticles(article) {
  const linkedIds = (article.related_article_ids || [])
    .filter((rid) => rid && rid !== article.id)
    .filter((rid, idx, arr) => arr.indexOf(rid) === idx);

  let related = [];
  if (linkedIds.length > 0) {
    try {
      const linked = await db.entities.BlogArticle.filter(
        { id: { $in: linkedIds }, status: "published" },
        "-published_at",
        linkedIds.length,
        0,
        ARTICLE_SUMMARY_FIELDS
      );
      // Preserve related_article_ids order
      const linkedMap = new Map((linked || []).map((a) => [a.id, a]));
      related = linkedIds.map((rid) => linkedMap.get(rid)).filter(Boolean);
    } catch {
      related = [];
    }
  }

  if (related.length < 3 && article.category) {
    const excludeIds = [article.id, ...related.map((r) => r.id)];
    try {
      const fillers = await db.entities.BlogArticle.filter(
        { status: "published", category: article.category, id: { $nin: excludeIds } },
        "-published_at",
        3 - related.length,
        0,
        ARTICLE_SUMMARY_FIELDS
      );
      related = [...related, ...(fillers || [])];
    } catch {
      // Failed to load fillers — keep what we have
    }
  }
  return related.slice(0, 3);
}

export default function ArticlePage() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const slug = urlParams.get("slug");
  const id = urlParams.get("id");

  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [toc, setToc] = useState([]);
  const [processedContent, setProcessedContent] = useState("");
  // status: 'loading' | 'not_found' | 'rate_limit' | 'error' | 'ready'
  const [status, setStatus] = useState("loading");
  const [retryAfter, setRetryAfter] = useState(null);
  const [retryCounter, setRetryCounter] = useState(0);
  const fetchAttemptedRef = useRef("");

  useEffect(() => {
    const currentKey = `${slug || ""}|${id || ""}|${retryCounter}`;
    if (fetchAttemptedRef.current === currentKey) return;
    fetchAttemptedRef.current = currentKey;

    (async () => {
      setStatus("loading");
      setArticle(null);
      setRelated([]);
      window.scrollTo(0, 0);
      try {
        // Fetch the single article WITH content (full record).
        // id -> get(id) (full record); slug -> filter limit 1 (full record).
        let found = null;
        if (id) {
          found = await db.entities.BlogArticle.get(id);
        } else if (slug) {
          const results = await db.entities.BlogArticle.filter({ slug }, undefined, 1);
          found = results?.[0] || null;
        }
        if (!found) {
          setStatus("not_found");
          return;
        }
        setArticle(found);

        // Related: targeted fetch, summary fields only (no content).
        try {
          const rel = await fetchRelatedArticles(found);
          setRelated(rel);
        } catch {
          setRelated([]);
        }
        setStatus("ready");
      } catch (e) {
        if (isRateLimitError(e)) {
          setRetryAfter(extractRetryAfter(e));
          setStatus("rate_limit");
        } else {
          setStatus("error");
        }
      }
    })();
  }, [slug, id, retryCounter]);

  // Build table of contents AND inject IDs into the HTML content in one pass
  useEffect(() => {
    if (!article?.content) {
      setToc([]);
      setProcessedContent("");
      return;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(article.content, "text/html");
    const headings = Array.from(doc.querySelectorAll("h2"));
    const tocItems = headings.map((h, i) => {
      h.id = `heading-${i}`;
      h.setAttribute("data-toc", "true");
      return { id: `heading-${i}`, text: h.textContent };
    });
    setToc(tocItems);
    setProcessedContent(doc.body.innerHTML);
  }, [article]);

  const handleRetry = () => {
    fetchAttemptedRef.current = "";
    setRetryCounter((c) => c + 1);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    sonnerToast.success("הקישור הועתק!");
  };

  // ── Loading ──
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  // ── Rate limit ──
  if (status === "rate_limit") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6" dir="rtl">
        <RateLimitState
          retryAfter={retryAfter || 60}
          onRetry={handleRetry}
          message="לא הצלחנו לטעון כרגע את המאמר בגלל עומס זמני."
        >
          <Link to={createPageUrl("Articles")} className="text-blue-600 hover:underline text-sm mt-2">
            חזרה לכל המאמרים
          </Link>
        </RateLimitState>
      </div>
    );
  }

  // ── General error ──
  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6" dir="rtl">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h1 className="text-xl font-bold text-slate-700">שגיאה בטעינת המאמר</h1>
        <p className="text-slate-500">אירעה שגיאה. אנא נסו שוב מאוחר יותר.</p>
        <Button variant="outline" onClick={handleRetry}>
          <RefreshCw className="w-4 h-4 ml-2" />
          נסה שוב
        </Button>
        <Link to={createPageUrl("Articles")} className="text-blue-600 hover:underline text-sm mt-2">
          חזרה לכל המאמרים
        </Link>
      </div>
    );
  }

  // ── Not found (only when call succeeded but no article returned) ──
  if (status === "not_found" || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6" dir="rtl">
        <BookOpen className="w-12 h-12 text-slate-300" />
        <h1 className="text-2xl font-bold text-slate-700">המאמר לא נמצא</h1>
        <Link to={createPageUrl("Articles")}>
          <Button>חזרה לכל המאמרים</Button>
        </Link>
      </div>
    );
  }

  const canonical = article.canonical_url || articleCanonical(article, BASE_URL);
  const ogTitle = article.og_title || article.meta_title || article.title;
  const ogDescription = article.og_description || article.meta_description || article.excerpt || "";
  const ogImage = article.og_image || article.featured_image_url || "";

  // JSON-LD Structured Data
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.meta_title || article.title,
    description: article.meta_description || article.excerpt,
    image: ogImage,
    datePublished: article.published_at || article.created_date,
    dateModified: article.updated_date,
    author: {
      "@type": article.author_name ? "Person" : "Organization",
      name: article.author_name || "SkiPlanner",
    },
    mainEntityOfPage: canonical,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <SeoHead title={article.meta_title || article.title} description={article.meta_description || article.excerpt} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }} />
      <CanonicalAndOg canonical={canonical} ogTitle={ogTitle} ogDescription={ogDescription} ogImage={ogImage} />

      {/* Hero Image */}
      {article.featured_image_url && (
        <div className="w-full h-56 md:h-80 overflow-hidden">
          <img
            src={article.featured_image_url}
            alt={article.featured_image_alt || article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 text-xs text-slate-400 mb-6 flex-row-reverse justify-end" aria-label="breadcrumb">
          <Link to={createPageUrl("Home")} className="flex items-center gap-1 hover:text-blue-600">
            <HomeIcon className="w-3 h-3" />
            דף הבית
          </Link>
          <ChevronLeft className="w-3 h-3" />
          <Link to={createPageUrl("Articles")} className="hover:text-blue-600">
            מאמרים וסקירות
          </Link>
          <ChevronLeft className="w-3 h-3" />
          <span className="text-slate-600 truncate max-w-[200px]">{article.title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* MAIN CONTENT */}
          <article className="flex-1 min-w-0">
            {/* Back link */}
            <Link to={createPageUrl("Articles")} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-6">
              <ArrowRight className="w-4 h-4" />
              חזרה לכל המאמרים
            </Link>

            {/* Meta badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              {article.category && (
                <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                  <Tag className="w-3 h-3 ml-1" />
                  {article.category}
                </Badge>
              )}
              {article.published_at && (
                <Badge variant="outline" className="text-slate-500">
                  <Calendar className="w-3 h-3 ml-1" />
                  {new Date(article.published_at).toLocaleDateString("he-IL")}
                </Badge>
              )}
              {article.author_name && (
                <Badge variant="outline" className="text-slate-500">
                  {article.author_name}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-4 leading-tight">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-lg text-slate-600 mb-8 leading-relaxed border-r-4 border-blue-400 pr-4">
                {article.excerpt}
              </p>
            )}

            {/* Article body */}
            <div
              className="article-content"
              dir="rtl"
              style={{
                maxWidth: "750px",
                fontSize: "18px",
                lineHeight: "1.8",
                color: "#334155",
                direction: "rtl",
                textAlign: "right",
              }}
              dangerouslySetInnerHTML={{ __html: processedContent || article.content }}
            />

            <style>{`
              .article-content { direction: rtl; text-align: right; }
              .article-content h2 {
                font-size: 1.5rem; font-weight: 700; color: #1e293b;
                margin-top: 2rem; margin-bottom: 1rem; scroll-margin-top: 80px;
              }
              .article-content h3 {
                font-size: 1.25rem; font-weight: 600; color: #1e293b;
                margin-top: 1.5rem; margin-bottom: 0.75rem;
              }
              .article-content p { margin-bottom: 1.25rem; }
              .article-content ul, .article-content ol { padding-right: 1.5rem; margin-bottom: 1.25rem; }
              .article-content li { margin-bottom: 0.4rem; }
              .article-content img { border-radius: 0.75rem; max-width: 100%; margin: 1.5rem 0; }
              .article-content a { color: #2563eb; text-decoration: underline; }
              .article-content blockquote {
                border-right: 4px solid #3b82c6; padding-right: 1rem;
                color: #475569; font-style: italic; margin: 1.5rem 0;
              }
            `}</style>
          </article>

          {/* SIDEBAR (desktop sticky) */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Share buttons */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="font-semibold text-slate-700 mb-3 text-sm">שיתוף המאמר</p>
                  <div className="flex flex-col gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent((article.title || "") + " " + window.location.href)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white rounded-lg px-3 py-2 text-sm transition-colors"
                    >
                      <WhatsAppIcon className="w-4 h-4" />
                      שתף בוואטסאפ
                    </a>
                    <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex items-center gap-2 justify-start">
                      <Copy className="w-4 h-4" />
                      העתק קישור
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Table of Contents */}
              {toc.length > 0 && (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <p className="font-semibold text-slate-700 mb-3 text-sm">תוכן עניינים</p>
                    <ul className="space-y-2 max-h-80 overflow-y-auto pl-1">
                      {toc.map((item) => (
                        <li key={item.id}>
                          <a
                            href={`#${item.id}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const el = document.getElementById(item.id);
                              if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline block leading-tight cursor-pointer"
                          >
                            {item.text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>
        </div>

        {/* RELATED ARTICLES */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-xl font-bold text-slate-800 mb-6">כתבות נוספות שעשויות לעניין אותך</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((rel) => (
                <ArticleCard key={rel.id} article={rel} showDate showAuthor showExcerpt />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Lightweight canonical + OG tag manager (no visual output)
function CanonicalAndOg({ canonical, ogTitle, ogDescription, ogImage }) {
  useEffect(() => {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;

    const setMeta = (attr, key, content) => {
      if (!content) return;
      let m = document.querySelector(`meta[${attr}="${key}"]`);
      if (!m) {
        m = document.createElement("meta");
        m.setAttribute(attr, key);
        document.head.appendChild(m);
      }
      m.content = content;
    };
    setMeta("property", "og:title", ogTitle);
    setMeta("property", "og:description", ogDescription);
    if (ogImage) setMeta("property", "og:image", ogImage);
  }, [canonical, ogTitle, ogDescription, ogImage]);
  return null;
}