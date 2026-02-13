import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
      staleTime: 5 * 60 * 1000, // 5 min cache
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/* ── Page Loading Fallback ── */
const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-navy">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      <span className="text-xs text-primary-foreground/40 font-heading tracking-wider">CELLVI 2.0</span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <InstallPrompt />
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/verify" element={<PublicLedgerVerifier />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/pqr" element={<PQR />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/platform" element={<ProtectedRoute><Platform /></ProtectedRoute>} />
                <Route path="/api-docs" element={<ApiDocs />} />
                <Route path="/tracking" element={<TrackingDashboard />} />
                <Route path="/planning" element={<RoutePlanner />} />
                <Route path="/driver" element={<DriverRoute />} />
                <Route path="/privacidad" element={<Privacidad />} />
                <Route path="/terminos" element={<Terminos />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="/preoperacional" element={<ProtectedRoute><ChecklistPage /></ProtectedRoute>} />
                <Route path="/rndc" element={<ProtectedRoute><RNDCPage /></ProtectedRoute>} />
                <Route path="/mantenimiento" element={<ProtectedRoute><MaintenanceDashboard /></ProtectedRoute>} />
                <Route path="/mantenimiento-lista" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
                <Route path="/seguridad" element={<ProtectedRoute><SecurityPage /></ProtectedRoute>} />
                <Route path="/auditoria" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
                <Route path="/reportes" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
                <Route path="/maestro-repuestos" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <CookieBanner />
            <CELLVIAssistant />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
