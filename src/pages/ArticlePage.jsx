const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Share2, Copy, ArrowRight, Calendar, Tag } from "lucide-react";
import { toast as sonnerToast } from "sonner";
import WhatsAppIcon from "@/components/WhatsAppIcon";

export default function ArticlePage() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const slug = urlParams.get("slug");
  const id = urlParams.get("id");

  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [toc, setToc] = useState([]);
  const [processedContent, setProcessedContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadArticle();
  }, [slug, id]);

  const loadArticle = async () => {
    setLoading(true);
    window.scrollTo(0, 0);
    try {
      let found = null;
      if (id) {
        const results = await db.entities.BlogArticle.filter({ id });
        found = results?.[0] || null;
      } else if (slug) {
        const results = await db.entities.BlogArticle.filter({ slug });
        found = results?.[0] || null;
      }
      if (found) {
        setArticle(found);
        // Prefer manually linked articles; fall back to same-category articles
        const linkedIds = (found.related_article_ids || []).filter((id) => id && id !== found.id);
        let relatedData = [];
        if (linkedIds.length > 0) {
          const linked = await Promise.all(
            linkedIds.map((rid) => db.entities.BlogArticle.filter({ id: rid }).then((r) => r?.[0] || null).catch(() => null))
          );
          relatedData = linked.filter((a) => a && a.status === "published");
        }
        if (relatedData.length < 3) {
          const byCat = await db.entities.BlogArticle.filter({ category: found.category, status: "published" });
          const fillers = byCat.filter((a) => a.id !== found.id && !relatedData.some((r) => r.id === a.id));
          relatedData = [...relatedData, ...fillers].slice(0, 3);
        }
        setRelated(relatedData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Build table of contents AND inject IDs into the HTML content in one pass
  // (baking IDs into the HTML string ensures they survive re-renders)
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    sonnerToast.success("הקישור הועתק!");
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent((article?.title || "") + " " + window.location.href)}`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-6" dir="rtl">
        <h1 className="text-2xl font-bold text-slate-700">המאמר לא נמצא</h1>
        <Link to={createPageUrl("Guides")}><Button>חזרה למדריכים</Button></Link>
      </div>
    );
  }

  // JSON-LD Schema
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.meta_title || article.title,
    description: article.meta_description || article.excerpt,
    image: article.featured_image_url,
    datePublished: article.published_at || article.created_date,
    dateModified: article.updated_date,
    author: { "@type": "Organization", name: "SkiPlanner" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaMarkup) }} />

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
        <div className="flex flex-col lg:flex-row gap-8">

          {/* MAIN CONTENT */}
          <article className="flex-1 min-w-0">
            {/* Back link */}
            <Link to={createPageUrl("Guides?tab=articles")} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-6">
              <ArrowRight className="w-4 h-4" />
              חזרה למדריכים
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
                font-size: 1.5rem;
                font-weight: 700;
                color: #1e293b;
                margin-top: 2rem;
                margin-bottom: 1rem;
                scroll-margin-top: 80px;
              }
              .article-content h3 {
                font-size: 1.25rem;
                font-weight: 600;
                color: #1e293b;
                margin-top: 1.5rem;
                margin-bottom: 0.75rem;
              }
              .article-content p { margin-bottom: 1.25rem; }
              .article-content ul, .article-content ol {
                padding-right: 1.5rem;
                margin-bottom: 1.25rem;
              }
              .article-content li { margin-bottom: 0.4rem; }
              .article-content img { border-radius: 0.75rem; max-width: 100%; margin: 1.5rem 0; }
              .article-content a { color: #2563eb; text-decoration: underline; }
              .article-content blockquote {
                border-right: 4px solid #3b82f6;
                padding-right: 1rem;
                color: #475569;
                font-style: italic;
                margin: 1.5rem 0;
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
                      href={whatsappShareUrl}
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
                <Link key={rel.id} to={createPageUrl(`ArticlePage?id=${rel.id}`)}>
                  <Card className="group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 h-full">
                    {rel.featured_image_url && (
                      <div className="h-40 overflow-hidden">
                        <img
                          src={rel.featured_image_url}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      {rel.category && (
                        <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50 mb-2 text-xs">
                          {rel.category}
                        </Badge>
                      )}
                      <h3 className="font-bold text-slate-800 mb-1 leading-snug">{rel.title}</h3>
                      {rel.excerpt && <p className="text-sm text-slate-500 line-clamp-2">{rel.excerpt}</p>}
                      <span className="text-blue-600 text-sm mt-2 inline-block">לקריאת המדריך ←</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}