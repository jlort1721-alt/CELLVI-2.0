import { Suspense, memo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import WhatsAppButton from "@/components/WhatsAppButton";
import PlatformHeader from "@/components/layout/PlatformHeader";
import PlatformSidebar from "@/components/layout/PlatformSidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useUIStore } from "@/stores/uiStore";
import { useRealtimeAlerts, useRealtimeTelemetry, useRealtimeGnss } from "@/hooks/useRealtime";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { usePWAStatus } from "@/hooks/usePWAStatus";
import { announce } from "@/components/accessibility/LiveRegion";
import { MODULE_REGISTRY, getModuleLabel } from "@/config/moduleRegistry";

// ── Skeleton loader for module transitions ──
const LoadingFallback = () => {
  const { t } = useTranslation();
  return (
  <div className="space-y-6 animate-pulse" role="status" aria-label={t("aria.loadingModule")}>
    <span className="sr-only">{t("aria.loadingModule")}</span>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-5 w-48 rounded bg-sidebar-foreground/5" />
        <div className="h-3 w-32 rounded bg-sidebar-foreground/5" />
      </div>
      <div className="h-8 w-32 rounded-lg bg-sidebar-foreground/5" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 border bg-sidebar border-sidebar-border">
          <div className="flex items-start justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-sidebar-foreground/5" />
            <div className="w-12 h-4 rounded bg-sidebar-foreground/5" />
          </div>
          <div className="h-6 w-16 rounded bg-sidebar-foreground/5 mb-1" />
          <div className="h-3 w-20 rounded bg-sidebar-foreground/5" />
        </div>
      ))}
    </div>
    <div className="grid lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl p-4 border bg-sidebar border-sidebar-border space-y-3">
          <div className="h-4 w-32 rounded bg-sidebar-foreground/5" />
          {Array.from({ length: 4 }).map((_, j) => (
            <div key={j} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-sidebar-foreground/5" />
              <div className="flex-1 h-3 rounded bg-sidebar-foreground/5" />
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
  );
};

// ── Offline status indicator ──
const OfflineIndicator = memo(() => {
  const { t } = useTranslation();
  const { isOnline } = usePWAStatus();

  useEffect(() => {
    if (!isOnline) {
      announce(t("aria.offlineMode"));
    } else {
      announce(t("aria.connectionRestored"));
    }
  }, [isOnline]);

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-yellow-500 text-yellow-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-in slide-in-from-top-2">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      {t("aria.offlineBanner")}
    </div>
  );
});
OfflineIndicator.displayName = 'OfflineIndicator';

// ── Main Platform ──
const Platform = () => {
  const { t } = useTranslation();
  const { activeModule } = useUIStore();

  // Realtime subscriptions
  useRealtimeAlerts();
  useRealtimeTelemetry();
  useRealtimeGnss();
  useKeyboardNav();

  usePerformanceMonitor({
    enabled: true,
    trackWebVitals: true,
    trackQueryMetrics: true,
  });

  // Announce module changes to screen readers
  useEffect(() => {
    announce(t("aria.navigatingTo", { module: getModuleLabel(activeModule) }));
  }, [activeModule]);

  // Resolve active module component from registry
  const ActiveModule = MODULE_REGISTRY[activeModule]?.component ?? MODULE_REGISTRY.overview.component;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-sidebar">
      <PlatformHeader />
      <OfflineIndicator />
      <div className="flex flex-1 overflow-hidden">
        <PlatformSidebar id="main-navigation" />
        <main
          id="main-content"
          className="flex-1 overflow-auto p-4 lg:p-6"
          role="main"
          tabIndex={-1}
          aria-label={t("aria.mainContent")}
        >
          <ErrorBoundary level="feature" resetKeys={[activeModule]}>
            <Suspense fallback={<LoadingFallback />}>
              <ActiveModule />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <WhatsAppButton />
    </div>
  );
};

Platform.displayName = 'Platform';

export default Platform;
