import { create } from 'zustand';

interface LandingState {
  // Navigation
  activeSection: string;
  mobileMenuOpen: boolean;

  // Demo
  selectedVehicleId: string;
  demoLiveUpdate: boolean;

  // Pricing
  selectedPlan: string;
  billingCycle: 'monthly' | 'annual';
  showPricingComparison: boolean;
  pricingCountry: string;
  pricingAssetCount: number;

  // Contact form
  contactFormSubmitted: boolean;

  // Use Cases
  activeUseCaseTab: string;

  // Testimonials
  testimonialIndex: number;
  testimonialAutoplay: boolean;

  // Scroll
  scrollY: number;
  hasScrolledPastHero: boolean;
  scrollProgress: number;
  showBackToTop: boolean;

  // Active Section Tracking
  visibleSections: string[];

  // Actions
  setActiveSection: (section: string) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setSelectedVehicleId: (id: string) => void;
  setDemoLiveUpdate: (update: boolean) => void;
  setSelectedPlan: (plan: string) => void;
  setBillingCycle: (cycle: 'monthly' | 'annual') => void;
  setShowPricingComparison: (show: boolean) => void;
  setPricingCountry: (code: string) => void;
  setPricingAssetCount: (count: number) => void;
  setContactFormSubmitted: (submitted: boolean) => void;
  setActiveUseCaseTab: (tab: string) => void;
  setTestimonialIndex: (idx: number) => void;
  setTestimonialAutoplay: (play: boolean) => void;
  setScrollY: (y: number) => void;
  setHasScrolledPastHero: (scrolled: boolean) => void;
  setScrollProgress: (pct: number) => void;
  setShowBackToTop: (show: boolean) => void;
  addVisibleSection: (id: string) => void;
  removeVisibleSection: (id: string) => void;
}

export const useLandingStore = create<LandingState>((set) => ({
  activeSection: 'inicio',
  mobileMenuOpen: false,
  selectedVehicleId: 'V001',
  demoLiveUpdate: false,
  selectedPlan: 'professional',
  billingCycle: 'annual',
  showPricingComparison: false,
  pricingCountry: 'CO',
  pricingAssetCount: 50,
  contactFormSubmitted: false,
  activeUseCaseTab: 'all',
  testimonialIndex: 0,
  testimonialAutoplay: true,
  scrollY: 0,
  hasScrolledPastHero: false,
  scrollProgress: 0,
  showBackToTop: false,
  visibleSections: [],

  setActiveSection: (section) => set({ activeSection: section }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setDemoLiveUpdate: (update) => set({ demoLiveUpdate: update }),
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  setBillingCycle: (cycle) => set({ billingCycle: cycle }),
  setShowPricingComparison: (show) => set({ showPricingComparison: show }),
  setPricingCountry: (code) => set({ pricingCountry: code }),
  setPricingAssetCount: (count) => set({ pricingAssetCount: count }),
  setContactFormSubmitted: (submitted) => set({ contactFormSubmitted: submitted }),
  setActiveUseCaseTab: (tab) => set({ activeUseCaseTab: tab }),
  setTestimonialIndex: (idx) => set({ testimonialIndex: idx }),
  setTestimonialAutoplay: (play) => set({ testimonialAutoplay: play }),
  setScrollY: (y) => set({ scrollY: y }),
  setHasScrolledPastHero: (scrolled) => set({ hasScrolledPastHero: scrolled }),
  setScrollProgress: (pct) => set({ scrollProgress: pct }),
  setShowBackToTop: (show) => set({ showBackToTop: show }),
  addVisibleSection: (id) => set((state) => ({
    visibleSections: state.visibleSections.includes(id)
      ? state.visibleSections
      : [...state.visibleSections, id],
  })),
  removeVisibleSection: (id) => set((state) => ({
    visibleSections: state.visibleSections.filter((s) => s !== id),
  })),
}));
