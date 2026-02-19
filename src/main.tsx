import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import LogRocket from "logrocket";
import App from "./App.tsx";
import "./index.css";
import "./lib/i18n";

// Enterprise Observability Initialization
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}

if (import.meta.env.VITE_LOGROCKET_ID) {
  LogRocket.init(import.meta.env.VITE_LOGROCKET_ID);
  // Link Sentry and LogRocket
  LogRocket.getSessionURL((sessionURL) => {
    Sentry.setContext("recording", { url: sessionURL });
  });
}

// Global error handler for uncaught errors (fires before React mounts)
window.addEventListener("error", (event) => {
  try {
    console.error("[Global Error]", event.error || event.message);
    if (import.meta.env.VITE_SENTRY_DSN && event.error) {
      Sentry.captureException(event.error);
    }
  } catch (_) {
    // Defensive: never let the error handler itself throw
  }
});

// Global handler for unhandled promise rejections
window.addEventListener("unhandledrejection", (event) => {
  try {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    console.error("[Unhandled Rejection]", error);
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error);
    }
  } catch (_) {
    // Defensive: never let the error handler itself throw
  }
});

createRoot(document.getElementById("root")!).render(<App />);

// Register Service Worker for PWA (ONLY in production)
if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // SW registration failed silently
      });
    });
  } else {
    // In development: unregister any existing SW to prevent stale cache issues
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.unregister());
    });
    caches.keys().then((names) => names.forEach((name) => caches.delete(name)));
  }
}
