
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import CookieBanner from "@/components/CookieBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import TrackingDashboard from './features/tracking/pages/TrackingDashboard';
import RoutePlanner from './features/fleet/components/RoutePlanner';
import MaintenanceDashboard from './features/maintenance/pages/MaintenanceDashboard';
import DriverRoute from './features/driver/pages/DriverRoute';
import InstallPrompt from './components/pwa/InstallPrompt';
import { CELLVIAssistant } from "@/components/AIChatWidget";
import PublicLedgerVerifier from './pages/public/VerifyLedger';
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { GlobalLiveRegion } from "@/components/accessibility/LiveRegion";
import { useCommonShortcuts } from "@/hooks/useKeyboardShortcuts";

/* ── Lazy-loaded pages (code splitting) ── */
const Index = lazy(() => import("./pages/Index"));
const Demo = lazy(() => import("./pages/Demo"));
const PQR = lazy(() => import("./pages/PQR"));
const Auth = lazy(() => import("./pages/Auth"));
const Platform = lazy(() => import("./pages/Platform"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const Privacidad = lazy(() => import("./pages/Privacidad"));
const Terminos = lazy(() => import("./pages/Terminos"));
const ChecklistPage = lazy(() => import("./features/preoperational/pages/ChecklistPage"));
const RNDCPage = lazy(() => import("./features/compliance/pages/RNDCPage"));
const MaintenancePage = lazy(() => import("./features/maintenance/pages/MaintenanceListPage"));
const SecurityPage = lazy(() => import("./features/security/pages/SecurityDashboard"));
const ReportsPage = lazy(() => import("./features/reports/pages/ReportsPage"));
const AuditLogPage = lazy(() => import("./features/security/pages/AuditLogPage"));
const InventoryPage = lazy(() => import("./features/maintenance/pages/InventoryPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // PR #25: Optimized staleTime for better caching
      // Most data is updated via Realtime subscriptions, so we can be aggressive with caching
      staleTime: 5 * 60 * 1000, // 5 minutes - good default for most data

      // Retry configuration
      retry: 2, // Retry failed queries up to 2 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff

      // Refetch behavior
      refetchOnWindowFocus: false, // Disabled - Realtime handles updates
      refetchOnReconnect: true, // Refetch when network reconnects
      refetchOnMount: true, // Always refetch on component mount

      // Cache time (formerly cacheTime, now gcTime in v5)
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep unused data in cache

      // Network mode
      networkMode: "online", // Only run queries when online
    },
    mutations: {
      // Retry mutations only once
      retry: 1,
      retryDelay: 1000,
      networkMode: "online",
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-navy">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      <span className="text-xs text-primary-foreground/40 font-heading tracking-wider">CELLVI 2.0</span>
    </div>
  </div>
);

// Inner component to use hooks that require Router context
const AppContent = () => {
  // Enable global keyboard shortcuts
  useCommonShortcuts();

  return (
    <>
      <SkipLinks />
      <GlobalLiveRegion />
      <Suspense fallback={<PageLoader />}>
        <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/verify" element={<PublicLedgerVerifier />} />
                  <Route path="/demo" element={<Demo />} />
                  <Route path="/pqr" element={<PQR />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/platform" element={<ProtectedRoute><ErrorBoundary level="page"><Platform /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/api-docs" element={<ApiDocs />} />
                  <Route path="/tracking" element={<ErrorBoundary level="feature"><TrackingDashboard /></ErrorBoundary>} />
                  <Route path="/planning" element={<ErrorBoundary level="feature"><RoutePlanner /></ErrorBoundary>} />
                  <Route path="/driver" element={<ErrorBoundary level="feature"><DriverRoute /></ErrorBoundary>} />
                  <Route path="/privacidad" element={<Privacidad />} />
                  <Route path="/terminos" element={<Terminos />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="/preoperacional" element={<ProtectedRoute><ErrorBoundary level="feature"><ChecklistPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/rndc" element={<ProtectedRoute><ErrorBoundary level="feature"><RNDCPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/mantenimiento" element={<ProtectedRoute><ErrorBoundary level="feature"><MaintenanceDashboard /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/mantenimiento-lista" element={<ProtectedRoute><ErrorBoundary level="feature"><MaintenancePage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/seguridad" element={<ProtectedRoute><ErrorBoundary level="feature"><SecurityPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/auditoria" element={<ProtectedRoute><ErrorBoundary level="feature"><AuditLogPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/reportes" element={<ProtectedRoute><ErrorBoundary level="feature"><ReportsPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="/maestro-repuestos" element={<ProtectedRoute><ErrorBoundary level="feature"><InventoryPage /></ErrorBoundary></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <CookieBanner />
                <CELLVIAssistant />
              </Suspense>
    </>
  );
};

const App = () => (
  <ErrorBoundary level="page">
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 }}
    >
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <InstallPrompt />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  </ErrorBoundary>
);

export default App;
