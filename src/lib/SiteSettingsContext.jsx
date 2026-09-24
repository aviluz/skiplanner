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