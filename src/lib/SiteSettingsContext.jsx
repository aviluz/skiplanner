const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { createContext, useContext, useState, useRef, useCallback } from "react";

import { isRateLimitError, extractRetryAfter } from "@/lib/articleUtils";

const SiteSettingsContext = createContext(null);

const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [status, setStatus] = useState("idle"); // idle | loading | ready | rate_limit | error
  const [retryAfter, setRetryAfter] = useState(null);
  const inflightRef = useRef(null);
  const lastFetchRef = useRef(0);
  const settingsRef = useRef({});

  // Lazy load: only fetches when a consumer calls this.
  // - Returns immediately if cache is still valid (TTL not expired + has data).
  // - Deduplicates concurrent requests via shared in-flight Promise.
  // - Does NOT clear existing settings on failure.
  // - No polling, no auto-retry, no background timers.
  const ensureLoaded = useCallback(async () => {
    if (Date.now() - lastFetchRef.current < TTL_MS && Object.keys(settingsRef.current).length > 0) {
      return;
    }
    if (inflightRef.current) return inflightRef.current;

    setStatus((prev) => (prev === "ready" ? "ready" : "loading"));

    inflightRef.current = (async () => {
      try {
        const data = await db.entities.SiteSettings.list();
        const map = (data || []).reduce((acc, s) => ({ ...acc, [s.setting_name]: s.value }), {});
        settingsRef.current = map;
        lastFetchRef.current = Date.now();
        setSettings(map);
        setRetryAfter(null);
        setStatus("ready");
      } catch (e) {
        if (isRateLimitError(e)) {
          setRetryAfter(extractRetryAfter(e));
          setStatus("rate_limit");
        } else {
          setStatus("error");
        }
        // Don't clear existing settings on failure
      } finally {
        inflightRef.current = null;
      }
    })();

    return inflightRef.current;
  }, []);

  const refresh = useCallback(() => {
    lastFetchRef.current = 0; // Force TTL expiry
    return ensureLoaded();
  }, [ensureLoaded]);

  return (
    <SiteSettingsContext.Provider value={{ settings, status, retryAfter, refresh, ensureLoaded }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) {
    return { settings: {}, status: "idle", retryAfter: null, refresh: () => {}, ensureLoaded: () => {} };
  }
  return ctx;
}