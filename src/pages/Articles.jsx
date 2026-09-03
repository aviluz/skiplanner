const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, ArrowRight, Tag, AlertTriangle, RefreshCw } from "lucide-react";
import SeoHead from "@/components/SeoHead";
import ArticleCard from "@/components/articles/ArticleCard";
import RateLimitState from "@/components/RateLimitState";
import { articleUrl } from "@/lib/articleUtils";
import { useArticles } from "@/lib/ArticlesContext";
import { useSiteSettings } from "@/lib/SiteSettingsContext";

const DEFAULT_TITLE = "מאמרים וסקירות על חופשות סקי";
const DEFAULT_DESC = "מדריכים, סקירות יעדים, טיפים ומידע מקצועי שיעזרו לכם לתכנן חופשת סקי טובה יותר.";
const DEFAULT_SEARCH_PLACEHOLDER = "חיפוש מאמרים...";
const DEFAULT_EMPTY_TEXT = "לא נמצאו מאמרים תואמים. נסה לשנות את החיפוש או הקטגוריה.";

export default function Articles() {
  const { articles: cachedArticles, status: articlesStatus, retryAfter, refresh, ensureLoaded, loadMore, hasMore, loadingMore } = useArticles();
  const { settings } = useSiteSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Trigger lazy load on every mount — ensureLoaded itself checks TTL
  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  // Apply visibility filter locally (cache stores raw published list)
  const articles = useMemo(() => {
    const nowIso = new Date().toISOString();
    return (cachedArticles || []).filter(
      (a) => a.is_visible_on_articles !== false && !(a.status === "scheduled" && a.published_at && a.published_at > nowIso)
    );
  }, [cachedArticles]);

  // Determine display state
  const displayState = useMemo(() => {
    if (articlesStatus === "loading" || articlesStatus === "idle") {
      if (articles.length === 0) return "loading";
      return "ready"; // Show existing data while refreshing
    }
    if (articlesStatus === "ready") {
      if (articles.length === 0) return "empty";
      return "ready";
    }
    if (articlesStatus === "rate_limit") {
      if (articles.length > 0) return "ready"; // Show stale data
      return "rate_limit";
    }
    if (articlesStatus === "error") {
      if (articles.length > 0) return "ready"; // Show stale data
      return "error";
    }
    return "loading";
  }, [articlesStatus, articles.length]);

  const pageTitle = settings.articles_page_title || DEFAULT_TITLE;
  const pageDesc = settings.articles_page_description || DEFAULT_DESC;
  const heroImage = settings.articles_hero_image || "";
  const heroAlt = settings.articles_hero_alt || "";
  const searchPlaceholder = settings.articles_search_placeholder || DEFAULT_SEARCH_PLACEHOLDER;
  const emptyText = settings.articles_empty_text || DEFAULT_EMPTY_TEXT;
  const showDates = settings.articles_show_dates !== "false";
  const showAuthors = settings.articles_show_authors !== "false";
  const showExcerpts = settings.articles_show_excerpts !== "false";
  const featuredId = settings.articles_featured_id || null;

  const featured = useMemo(() => {
    if (!featuredId) return null;
    return articles.find((a) => a.id === featuredId) || null;
  }, [articles, featuredId]);

  const categories = useMemo(() => {
    let cats = [];
    try {
      cats = JSON.parse(settings.article_categories || "[]");
    } catch {
      cats = [];
    }
    return cats;
  }, [settings]);

  // active categories that have at least one article
  const activeCats = useMemo(() => {
    const usedCats = new Set(articles.map((a) => a.category).filter(Boolean));
    return categories
      .filter((c) => c.is_active !== false && c.name && usedCats.has(c.name))
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories, articles]);

  const filtered = useMemo(() => {
    let list = articles;
    if (activeCategory !== "all") list = list.filter((a) => a.category === activeCategory);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (a) =>
          (a.title || "").toLowerCase().includes(q) ||
          (a.excerpt || "").toLowerCase().includes(q) ||
          (a.category || "").toLowerCase().includes(q)
      );
    }
    if (featured && activeCategory === "all" && !searchTerm.trim()) {
      list = list.filter((a) => a.id !== featured.id);
    }
    return list;
  }, [articles, activeCategory, searchTerm, featured]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-right" dir="rtl">
      <SeoHead
        title={settings.articles_meta_title || pageTitle}
        description={settings.articles_meta_description || pageDesc}
      />
      <CanonicalAndOg
        canonical="https://skiplanner.db.app/Articles"
        ogTitle={pageTitle}
        ogDescription={pageDesc}
        ogImage={heroImage}
      />

      {/* Hero */}
      <div className="relative w-full overflow-hidden">
        {heroImage ? (
          <div className="relative h-48 md:h-64">
            <img src={heroImage} alt={heroAlt || pageTitle} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-slate-900/30" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <div className="inline-flex items-center gap-2 bg-blue-500/20 backdrop-blur rounded-full px-3 py-1.5 mb-3">
                <BookOpen className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">מגזין SkiPlanner</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">{pageTitle}</h1>
              <p className="text-white/90 text-sm md:text-lg max-w-2xl">{pageDesc}</p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 pt-10 pb-6 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 rounded-full px-3 py-1.5 mb-3">
              <BookOpen className="w-4 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium text-sm">מגזין SkiPlanner</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-3">{pageTitle}</h1>
            <p className="text-slate-600 max-w-2xl mx-auto">{pageDesc}</p>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        {/* Search + filter */}
        <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-8 -mt-4 relative z-10">
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={searchPlaceholder}
              className="pr-9 bg-white shadow-sm"
            />
          </div>
          {activeCats.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === "all" ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-blue-50 border border-slate-200"
                }`}
              >
                הכל
              </button>
              {activeCats.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setActiveCategory(c.name)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    activeCategory === c.name ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-blue-50 border border-slate-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* States */}
        {displayState === "loading" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="h-44 bg-slate-200 animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
                  <div className="h-5 w-full bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : displayState === "rate_limit" ? (
          <RateLimitState
            retryAfter={retryAfter || 60}
            onRetry={refresh}
            message="לא הצלחנו לטעון כרגע את המאמרים בגלל עומס זמני."
          />
        ) : displayState === "error" ? (
          <ErrorState message="שגיאה בטעינת המאמרים." onRetry={refresh} />
        ) : displayState === "empty" ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">אין עדיין מאמרים פורסמו.</p>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featured && activeCategory === "all" && !searchTerm.trim() && (
              <Link to={articleUrl(featured)} className="block mb-10">
                <div className="group bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col md:flex-row">
                  <div className="md:w-1/2 h-56 md:h-72 overflow-hidden">
                    <img
                      src={featured.featured_image_url || ""}
                      alt={featured.featured_image_alt || featured.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-center text-right">
                    <div className="flex items-center gap-2 mb-3">
                      {featured.category && (
                        <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                          <Tag className="w-3 h-3 ml-1" />
                          {featured.category}
                        </Badge>
                      )}
                      <Badge className="bg-amber-500 text-white">מאמר מוביל</Badge>
                    </div>
                    <h2 className="text-xl md:text-3xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">
                      {featured.title}
                    </h2>
                    {featured.excerpt && <p className="text-slate-600 mb-4 leading-relaxed">{featured.excerpt}</p>}
                    <span className="text-blue-600 font-medium inline-flex items-center gap-1">
                      לקריאת המאמר <ArrowRight className="w-4 h-4 rotate-180" />
                    </span>
                  </div>
                </div>
              </Link>
            )}

            {/* Articles grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">{emptyText}</p>
                {(searchTerm || activeCategory !== "all") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      setSearchTerm("");
                      setActiveCategory("all");
                    }}
                  >
                    נקה סינון
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      showDate={showDates}
                      showAuthor={showAuthors}
                      showExcerpt={showExcerpts}
                    />
                  ))}
                </div>

                {/* Limited-search notice: results are only from loaded articles */}
                {(searchTerm.trim() || activeCategory !== "all") && hasMore && (
                  <p className="text-center text-xs text-slate-400 mt-6">
                    התוצאות מוגבלות למאמרים שנטענו עד כה. טען עוד מאמרים כדי להרחיב את החיפוש.
                  </p>
                )}

                {/* Load more (server-side pagination) */}
                {hasMore && (
                  <div className="flex justify-center mt-10">
                    <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                      {loadingMore ? (
                        <>
                          <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
                          טוען...
                        </>
                      ) : (
                        "טען עוד מאמרים"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="text-center py-16">
      <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
      <p className="text-slate-600 mb-4">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="w-4 h-4 ml-2" />
        נסה שוב
      </Button>
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