const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { createContext, useContext, useState, useRef, useCallback } from "react";

import { isRateLimitError, extractRetryAfter, ARTICLE_SUMMARY_FIELDS } from "@/lib/articleUtils";

const ArticlesContext = createContext(null);

const TTL_MS = 2 * 60 * 1000; // 2 minutes
const PAGE_SIZE = 20;

export function ArticlesProvider({ children }) {
  const [articles, setArticles] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | loading | ready | rate_limit | error
  const [retryAfter, setRetryAfter] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const inflightRef = useRef(null);
  const lastFetchRef = useRef(0);
  const articlesRef = useRef([]);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  // Lazy load: only fetches when a consumer calls this.
  // - Returns immediately if cache is still valid (TTL not expired + has data).
  // - Deduplicates concurrent requests via shared in-flight Promise.
  // - Does NOT clear existing articles on failure.
  // - No polling, no auto-retry, no background timers.
  // - Fetches SUMMARY fields only (no content) with server-side pagination (limit/skip).
  const ensureLoaded = useCallback(async () => {
    if (Date.now() - lastFetchRef.current < TTL_MS && articlesRef.current.length > 0) {
      return;
    }
    if (inflightRef.current) return inflightRef.current;

    setStatus((prev) => (prev === "ready" ? "ready" : "loading"));

    inflightRef.current = (async () => {
      try {
        const data = await db.entities.BlogArticle.filter(
          { status: "published" },
          "-published_at",
          PAGE_SIZE,
          0,
          ARTICLE_SUMMARY_FIELDS
        );
        const list = data || [];
        articlesRef.current = list;
        pageRef.current = 0;
        hasMoreRef.current = list.length === PAGE_SIZE;
        setArticles(list);
        setHasMore(list.length === PAGE_SIZE);
        lastFetchRef.current = Date.now();
        setRetryAfter(null);
        setStatus("ready");
      } catch (e) {
        if (isRateLimitError(e)) {
          setRetryAfter(extractRetryAfter(e));
          setStatus("rate_limit");
        } else {
          setStatus("error");
        }
        // Don't clear existing articles on failure
      } finally {
        inflightRef.current = null;
      }
    })();

    return inflightRef.current;
  }, []);

  // Load next page (server-side pagination via skip).
  // No-op if already loading more or no more pages.
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    if (!hasMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = pageRef.current + 1;
      const skip = nextPage * PAGE_SIZE;
      const data = await db.entities.BlogArticle.filter(
        { status: "published" },
        "-published_at",
        PAGE_SIZE,
        skip,
        ARTICLE_SUMMARY_FIELDS
      );
      const list = data || [];
      const existingIds = new Set(articlesRef.current.map((a) => a.id));
      const fresh = list.filter((a) => !existingIds.has(a.id));
      const merged = [...articlesRef.current, ...fresh];
      articlesRef.current = merged;
      pageRef.current = nextPage;
      hasMoreRef.current = list.length === PAGE_SIZE;
      setArticles(merged);
      setHasMore(list.length === PAGE_SIZE);
    } catch (e) {
      if (isRateLimitError(e)) {
        setRetryAfter(extractRetryAfter(e));
        setStatus("rate_limit");
      }
      // Don't change articles on loadMore failure
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  // Allows a consumer (e.g., ArticlePage direct open) to save a fetched
  // published-article pool into the shared cache so other consumers don't re-fetch.
  const setPool = useCallback((pool) => {
    if (!pool || !pool.length) return;
    articlesRef.current = pool;
    pageRef.current = 0;
    hasMoreRef.current = false;
    lastFetchRef.current = Date.now();
    setArticles(pool);
    setHasMore(false);
    setStatus("ready");
    setRetryAfter(null);
  }, []);

  const getArticle = useCallback((slug, id) => {
    const list = articlesRef.current;
    if (!list || !list.length) return null;
    if (slug) return list.find((a) => a.slug === slug) || null;
    if (id) return list.find((a) => a.id === id) || null;
    return null;
  }, []);

  const refresh = useCallback(() => {
    lastFetchRef.current = 0; // Force TTL expiry
    return ensureLoaded();
  }, [ensureLoaded]);

  return (
    <ArticlesContext.Provider
      value={{
        articles,
        status,
        retryAfter,
        refresh,
        getArticle,
        ensureLoaded,
        setPool,
        loadMore,
        hasMore,
        loadingMore,
      }}
    >
      {children}
    </ArticlesContext.Provider>
  );
}

export function useArticles() {
  const ctx = useContext(ArticlesContext);
  if (!ctx) {
    return {
      articles: [],
      status: "idle",
      retryAfter: null,
      refresh: () => {},
      getArticle: () => null,
      ensureLoaded: () => {},
      setPool: () => {},
      loadMore: () => {},
      hasMore: false,
      loadingMore: false,
    };
  }
  return ctx;
}