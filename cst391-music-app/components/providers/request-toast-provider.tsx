"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type HttpRequestToast = {
  id: string;
  method: string;
  url: string;
  status: number | null;
  ok: boolean;
  durationMs: number;
  errorMessage?: string;
  closing?: boolean;
};

const TOAST_DISMISS_MS = 4500;
const TOAST_EXIT_MS = 220;
const TOAST_MAX = 2;
const INITIAL_GET_SUPPRESS_MS = 2500;

function getRequestInfo(
  input: RequestInfo | URL,
  init?: RequestInit
): { method: string; url: string; pathname: string } {
  const urlString = (() => {
    if (typeof input === "string") return input;
    if (input instanceof URL) return input.toString();
    return input.url;
  })();

  const method = (
    init?.method ??
    (input instanceof Request ? input.method : undefined) ??
    "GET"
  ).toUpperCase();

  // For relative URLs, URL parsing needs a base; we default to origin.
  let pathname = urlString;
  try {
    if (urlString.startsWith("/")) {
      pathname = new URL(urlString, window.location.origin).pathname;
    } else if (urlString.startsWith("http")) {
      pathname = new URL(urlString).pathname;
    }
  } catch {
    // best effort
  }

  return { method, url: urlString, pathname };
}

function shouldToastForPath(pathname: string): boolean {
  // Focus on app API calls to avoid spamming from prefetches, etc.
  return pathname.startsWith("/api/");
}

export default function RequestToastProvider() {
  const [toasts, setToasts] = useState<HttpRequestToast[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());
  const mountedAtRef = useRef<number | null>(null);

  const patchKey = useMemo(() => "__wf_request_toast_patched__", []);

  const removeToast = useCallback(
    (id: string) => {
      const timeoutId = timersRef.current.get(id);
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
        timersRef.current.delete(id);
      }

      setToasts((prev) => {
        const found = prev.find((t) => t.id === id);
        if (!found || found.closing) return prev;
        return prev.map((t) => (t.id === id ? { ...t, closing: true } : t));
      });

      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, TOAST_EXIT_MS);
    },
    [setToasts]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    mountedAtRef.current =
      typeof performance !== "undefined" ? performance.now() : Date.now();

    const w = window as unknown as { [key: string]: unknown };
    if (w[patchKey] === true) return;
    w[patchKey] = true;

    const originalFetch = window.fetch.bind(window);

    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const { method, url, pathname } = getRequestInfo(input, init);
      const elapsedSinceMount = mountedAtRef.current
        ? (typeof performance !== "undefined" ? performance.now() : Date.now()) -
          mountedAtRef.current
        : Number.POSITIVE_INFINITY;
      const shouldSuppressInitialGet =
        method === "GET" && elapsedSinceMount < INITIAL_GET_SUPPRESS_MS;
      const shouldToast =
        shouldToastForPath(pathname) && !shouldSuppressInitialGet;
      const start =
        typeof performance !== "undefined" ? performance.now() : Date.now();

      try {
        const res = await originalFetch(input as RequestInfo, init);
        if (shouldToast) {
          const durationMs = Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) -
              start
          );
          pushToast({
            method,
            url,
            status: res.status,
            ok: res.ok,
            durationMs,
          });
        }
        return res;
      } catch (err) {
        if (shouldToast) {
          const durationMs = Math.round(
            (typeof performance !== "undefined" ? performance.now() : Date.now()) -
              start
          );
          pushToast({
            method,
            url,
            status: null,
            ok: false,
            durationMs,
            errorMessage:
              err instanceof Error ? err.message : "Network error",
          });
        }
        throw err;
      }
    }) as typeof window.fetch;

    function pushToast(toast: Omit<HttpRequestToast, "id">) {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => {
        const next = [...prev, { ...toast, id, closing: false }];
        if (next.length > TOAST_MAX) next.splice(0, next.length - TOAST_MAX);
        return next;
      });

      const timeoutId = window.setTimeout(() => removeToast(id), TOAST_DISMISS_MS);

      timersRef.current.set(id, timeoutId);
    }

    return () => {
      // Keep patching stable across route transitions; avoid unpatching.
    };
  }, [patchKey, removeToast]);

  return (
    <div
      className="wf-request-toasts"
      aria-live="polite"
      aria-relevant="additions"
      role="region"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`wf-request-toast${t.closing ? " wf-request-toast--closing" : ""}`}
          data-ok={t.ok ? "true" : "false"}
        >
          <button
            type="button"
            className="wf-request-toast-close"
            aria-label="Dismiss request notification"
            onClick={() => removeToast(t.id)}
          >
            ×
          </button>

          <div className="wf-request-toast-line1">
            <span
              className={`wf-request-toast-badge wf-request-toast-badge--${
                t.ok
                  ? "ok"
                  : t.status != null && t.status >= 500
                    ? "error"
                    : "warn"
              }`}
            >
              {t.method}
            </span>
            <span className="wf-request-toast-url">{t.url}</span>
          </div>
          <div className="wf-request-toast-line2">
            {t.status == null ? (
              <span className="wf-request-toast-status wf-request-toast-status--error">
                Network error
              </span>
            ) : (
              <span
                className={`wf-request-toast-status ${
                  t.ok
                    ? "wf-request-toast-status--ok"
                    : t.status >= 500
                      ? "wf-request-toast-status--error"
                      : "wf-request-toast-status--warn"
                }`}
              >
                {t.status}
              </span>
            )}
            <span className="wf-request-toast-meta">{t.durationMs}ms</span>
          </div>
          {t.errorMessage ? (
            <div className="wf-request-toast-error">{t.errorMessage}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

