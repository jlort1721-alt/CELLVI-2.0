import { lazy, Suspense, memo } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PlatformStatsSection from "@/components/PlatformStatsSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";

// Lazy load heavy sections for better initial load performance
const LiveDemoSection = lazy(() => import("@/components/LiveDemoSection"));
const AboutSection = lazy(() => import("@/components/AboutSection"));
const RistraSection = lazy(() => import("@/components/RistraSection"));
const ServicesSection = lazy(() => import("@/components/ServicesSection"));
const PlatformSection = lazy(() => import("@/components/PlatformSection"));
const MobileAppSection = lazy(() => import("@/components/MobileAppSection"));
const SecuritySection = lazy(() => import("@/components/SecuritySection"));
const APISection = lazy(() => import("@/components/APISection"));
const UseCasesSection = lazy(() => import("@/components/UseCasesSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const GallerySection = lazy(() => import("@/components/GallerySection"));
const PoliciesSection = lazy(() => import("@/components/PoliciesSection"));
const ClientsSection = lazy(() => import("@/components/ClientsSection"));
const BlogSection = lazy(() => import("@/components/BlogSection"));
const ContactSection = lazy(() => import("@/components/ContactSection"));
const FAQChatbot = lazy(() => import("@/components/FAQChatbot"));
const InstallPWA = lazy(() => import("@/components/InstallPWA"));

// Loading fallback for sections
const SectionLoader = () => (
  <div className="w-full h-64 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const Index = memo(() => {
  // Monitor landing page performance
  usePerformanceMonitor({
    enabled: true,
    trackWebVitals: true,
    onReport: (metrics) => {
      // Log to analytics in production
      if (metrics.LCP && metrics.LCP > 2500) {
        console.warn('[Performance] LCP is high:', metrics.LCP);
      }
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main id="main-content" role="main" tabIndex={-1}>
        {/* Above the fold - load immediately */}
        <HeroSection />
        <PlatformStatsSection />

        {/* Below the fold - lazy load */}
        <Suspense fallback={<SectionLoader />}>
          <LiveDemoSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <AboutSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <RistraSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <ServicesSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <PlatformSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <MobileAppSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <SecuritySection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <APISection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <UseCasesSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <PricingSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <FAQSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <TestimonialsSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <GallerySection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <PoliciesSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <ClientsSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <BlogSection />
        </Suspense>

        <Suspense fallback={<SectionLoader />}>
          <ContactSection />
        </Suspense>
      </main>

      <Footer id="footer" />
      <WhatsAppButton />

      {/* Lazy load non-critical UI */}
      <Suspense fallback={null}>
        <FAQChatbot />
      </Suspense>

      <Suspense fallback={null}>
        <InstallPWA />
      </Suspense>
    </div>
  );
});

Index.displayName = 'Index';

export default Index;
