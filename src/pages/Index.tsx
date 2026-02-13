import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import RistraSection from "@/components/RistraSection";
import ServicesSection from "@/components/ServicesSection";
import PlatformSection from "@/components/PlatformSection";
import MobileAppSection from "@/components/MobileAppSection";
import SecuritySection from "@/components/SecuritySection";
import APISection from "@/components/APISection";
import UseCasesSection from "@/components/UseCasesSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import GallerySection from "@/components/GallerySection";
import PoliciesSection from "@/components/PoliciesSection";
import ClientsSection from "@/components/ClientsSection";
import BlogSection from "@/components/BlogSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import FAQChatbot from "@/components/FAQChatbot";
import InstallPWA from "@/components/InstallPWA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main role="main">
        <HeroSection />
        <AboutSection />
        <RistraSection />
        <ServicesSection />
        <PlatformSection />
        <MobileAppSection />
        <SecuritySection />
        <APISection />
        <UseCasesSection />
        <PricingSection />
        <FAQSection />
        <TestimonialsSection />
        <GallerySection />
        <PoliciesSection />
        <ClientsSection />
        <BlogSection />
        <ContactSection />
      </main>
      <Footer />
      <WhatsAppButton />
      <FAQChatbot />
      <InstallPWA />
    </div>
  );
};

export default Index;
