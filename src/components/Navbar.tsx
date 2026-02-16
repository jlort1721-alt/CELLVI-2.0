import { useCallback, useMemo, type FC } from "react";
import { useTranslation } from "react-i18next";
import {
  Menu,
  Car,
  Building2,
  Construction,
  Shield,
  Globe,
  Camera,
  Code2,
  Smartphone,
  MonitorPlay,
  BookOpen,
  HelpCircle,
  MessageSquare,
  FileText,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelector from "@/components/LanguageSelector";
import { useLandingStore } from "@/stores/landingStore";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

interface NavLink {
  label: string;
  href: string;
  icon?: LucideIcon;
  desc?: string;
  external?: boolean;
}

interface NavGroup {
  id: string;
  label: string;
  /** Hash-section IDs that belong to this group (for active highlighting) */
  sections: string[];
  links: NavLink[];
  /** If true, the top-level item is a direct link (no dropdown) */
  direct?: boolean;
  /** Wide layout for the dropdown (2-column grid) */
  wide?: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Navigation data factory (uses t() for i18n)
   ═══════════════════════════════════════════════════════════════════════════ */

function useNavGroups(): NavGroup[] {
  const { t } = useTranslation();

  return useMemo<NavGroup[]>(
    () => [
      {
        id: "empresa",
        label: t("nav.empresa"),
        sections: ["nosotros", "galeria", "ristra", "politicas"],
        links: [
          { label: t("nav.nosotros"), href: "#nosotros", icon: Building2, desc: t("nav.aboutDesc") },
          { label: t("nav.infraestructura"), href: "#galeria", icon: Construction, desc: t("nav.infraDesc") },
          { label: "RISTRA", href: "#ristra", icon: Shield, desc: t("nav.ristraDesc") },
          { label: t("nav.politicasNav"), href: "#politicas", icon: FileText, desc: t("nav.politicasDesc") },
        ],
      },
      {
        id: "soluciones",
        label: t("nav.soluciones"),
        sections: ["servicios"],
        wide: true,
        links: [
          { label: t("nav.solTransporte"), href: "#servicios", icon: Car, desc: t("nav.solTransporteDesc") },
          { label: t("nav.solSeguridad"), href: "#servicios", icon: Building2, desc: t("nav.solSeguridadDesc") },
          { label: t("nav.solObras"), href: "#servicios", icon: Construction, desc: t("nav.solObrasDesc") },
          { label: t("nav.solConsultoria"), href: "#servicios", icon: Shield, desc: t("nav.solConsultoriaDesc") },
          { label: t("nav.solComercio"), href: "#servicios", icon: Globe, desc: t("nav.solComercioDesc") },
          { label: t("nav.solVideo"), href: "#servicios", icon: Camera, desc: t("nav.solVideoDesc") },
        ],
      },
      {
        id: "plataforma",
        label: t("nav.plataforma"),
        sections: ["plataforma", "security", "api"],
        links: [
          { label: "CELLVI 2.0", href: "#plataforma", icon: MonitorPlay, desc: t("nav.cellvi20Desc") },
          { label: t("nav.seguridad"), href: "#security", icon: Shield, desc: t("nav.seguridadDesc") },
          { label: "API", href: "#api", icon: Code2, desc: t("nav.apiDesc") },
          { label: t("nav.appMovil"), href: "#plataforma", icon: Smartphone, desc: t("nav.appMovilDesc") },
          { label: t("nav.demoCellvi"), href: "/demo", icon: MonitorPlay, desc: t("nav.demoDesc") },
        ],
      },
      {
        id: "precios",
        label: t("nav.planes"),
        sections: ["pricing"],
        direct: true,
        links: [{ label: t("nav.planes"), href: "#pricing" }],
      },
      {
        id: "recursos",
        label: t("nav.recursos"),
        sections: ["blog", "faq", "contacto"],
        links: [
          { label: t("nav.blog"), href: "#blog", icon: BookOpen, desc: t("nav.blogDesc") },
          { label: "FAQ", href: "#faq", icon: HelpCircle, desc: t("nav.faqDesc") },
          { label: t("nav.contacto"), href: "#contacto", icon: MessageSquare, desc: t("nav.contactoDesc") },
          { label: t("nav.pqr"), href: "/pqr", icon: FileText, desc: t("nav.pqrDesc") },
        ],
      },
    ],
    [t],
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

/** Shared trigger classnames - override shadcn defaults for dark theme */
const triggerCx =
  "text-primary-foreground/80 hover:text-gold data-[state=open]:text-gold text-sm font-medium bg-transparent hover:bg-gold/5 focus:bg-gold/5 data-[state=open]:bg-gold/5 data-[active]:bg-transparent";

/** Active state trigger classnames when section is visible */
const triggerActiveCx = "text-gold";

/** Shared dropdown content panel classnames */
const contentPanelCx =
  "bg-navy/98 backdrop-blur-lg border border-gold/20 rounded-xl shadow-2xl shadow-black/30 p-3";

/** Check if any section in a group is currently visible */
function isGroupActive(groupSections: string[], visibleSections: string[]): boolean {
  return groupSections.some((s) => visibleSections.includes(s));
}

/* ═══════════════════════════════════════════════════════════════════════════
   Dropdown link item (reused in desktop panels)
   ═══════════════════════════════════════════════════════════════════════════ */

const DropdownLinkItem: FC<{ link: NavLink; onClick?: () => void }> = ({ link, onClick }) => {
  const Icon = link.icon;
  return (
    <NavigationMenuLink asChild>
      <a
        href={link.href}
        onClick={onClick}
        className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-gold/5 group/link"
      >
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold/10 transition-colors group-hover/link:bg-gold/20">
            <Icon className="h-4 w-4 text-gold" />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-primary-foreground/90 group-hover/link:text-gold transition-colors">
            {link.label}
          </div>
          {link.desc && (
            <div className="text-[11px] leading-tight text-primary-foreground/40 mt-0.5">
              {link.desc}
            </div>
          )}
        </div>
        <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-primary-foreground/20 opacity-0 transition-all group-hover/link:opacity-100 group-hover/link:text-gold" />
      </a>
    </NavigationMenuLink>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Desktop Navigation (hidden on mobile, shown lg:flex)
   ═══════════════════════════════════════════════════════════════════════════ */

const DesktopNav: FC = () => {
  const navGroups = useNavGroups();
  const visibleSections = useLandingStore((s) => s.visibleSections);

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList className="gap-0.5">
        {navGroups.map((group) => {
          const active = isGroupActive(group.sections, visibleSections);

          /* Direct link (no dropdown) */
          if (group.direct) {
            return (
              <NavigationMenuItem key={group.id}>
                <NavigationMenuLink asChild>
                  <a
                    href={group.links[0].href}
                    className={cn(
                      "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors",
                      triggerCx,
                      active && triggerActiveCx,
                    )}
                  >
                    {group.label}
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          }

          /* Dropdown group */
          return (
            <NavigationMenuItem key={group.id}>
              <NavigationMenuTrigger
                className={cn(triggerCx, active && triggerActiveCx)}
              >
                {group.label}
              </NavigationMenuTrigger>

              <NavigationMenuContent
                className={cn(
                  contentPanelCx,
                  group.wide ? "w-[540px]" : "w-[320px]",
                )}
              >
                {/* Section header inside panel */}
                <div className="px-2 pt-1 pb-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground/30">
                    {group.label}
                  </p>
                </div>

                <div
                  className={cn(
                    group.wide
                      ? "grid grid-cols-2 gap-0.5"
                      : "flex flex-col gap-0.5",
                  )}
                >
                  {group.links.map((link) => (
                    <DropdownLinkItem key={link.href + link.label} link={link} />
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Mobile collapsible section (inside Sheet)
   ═══════════════════════════════════════════════════════════════════════════ */

const MobileSectionGroup: FC<{
  label: string;
  links: NavLink[];
  onNavigate: () => void;
}> = ({ label, links, onNavigate }) => (
  <div className="py-2">
    <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-primary-foreground/30">
      {label}
    </p>
    <div className="flex flex-col gap-0.5">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.href + link.label}
            href={link.href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-gold/5"
          >
            {Icon && <Icon className="h-4 w-4 shrink-0 text-gold" />}
            <div className="min-w-0">
              <div className="text-sm font-semibold text-primary-foreground/80">
                {link.label}
              </div>
              {link.desc && (
                <div className="text-[10px] text-primary-foreground/30 leading-tight">
                  {link.desc}
                </div>
              )}
            </div>
          </a>
        );
      })}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   Mobile Navigation (Sheet from right, shown lg:hidden)
   ═══════════════════════════════════════════════════════════════════════════ */

const MobileNav: FC = () => {
  const { t } = useTranslation();
  const navGroups = useNavGroups();
  const mobileMenuOpen = useLandingStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useLandingStore((s) => s.setMobileMenuOpen);

  const closeMenu = useCallback(() => setMobileMenuOpen(false), [setMobileMenuOpen]);

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      {/* Hamburger trigger */}
      <SheetTrigger asChild>
        <button
          type="button"
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-gold/30 hover:bg-gold/10 transition-colors"
          aria-label={t("nav.openMenu")}
        >
          <Menu className="h-5 w-5 text-primary-foreground/80" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[320px] sm:w-[360px] bg-navy/98 backdrop-blur-xl border-l border-gold/20 p-0 overflow-y-auto"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-gold/10">
          <SheetTitle className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="ASEGURAR LTDA"
              className="h-10 w-auto object-contain"
            />
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable link groups */}
        <div className="px-2 divide-y divide-gold/10">
          {navGroups.map((group) => (
            <MobileSectionGroup
              key={group.id}
              label={group.label}
              links={group.links}
              onNavigate={closeMenu}
            />
          ))}
        </div>

        {/* CTAs at bottom */}
        <div className="sticky bottom-0 border-t border-gold/10 bg-navy/98 backdrop-blur-lg p-4 flex flex-col gap-2.5">
          <Button
            asChild
            variant="outline"
            className="w-full border-gold/30 text-primary-foreground/80 hover:bg-gold/10 hover:text-gold font-heading font-semibold text-sm h-10"
          >
            <a href="/demo" onClick={closeMenu}>
              Demo
            </a>
          </Button>
          <Button
            asChild
            className="w-full bg-gradient-to-r from-gold to-yellow-500 font-heading font-bold text-navy hover:from-gold/90 hover:to-yellow-500/90 shadow-[0_0_20px_rgba(212,175,55,0.25)] text-sm h-10"
          >
            <a href="#contacto" onClick={closeMenu}>
              {t("hero.cta1")}
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   Main Navbar
   ═══════════════════════════════════════════════════════════════════════════ */

const Navbar: FC = () => {
  const { t } = useTranslation();
  const hasScrolledPastHero = useLandingStore((s) => s.hasScrolledPastHero);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "bg-navy/95 backdrop-blur-md border-b",
        hasScrolledPastHero
          ? "border-gold/20 shadow-lg shadow-black/10"
          : "border-gold/10 shadow-none",
      )}
      role="navigation"
      aria-label={t("nav.mainNav")}
    >
      <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
        {/* ── Logo ─────────────────────────────────────────── */}
        <a
          href="#inicio"
          className="flex items-center gap-2 shrink-0"
          aria-label="ASEGURAR LTDA - Inicio"
        >
          <img
            src="/logo.png"
            alt="ASEGURAR LTDA"
            className="h-12 md:h-16 w-auto object-contain"
          />
        </a>

        {/* ── Desktop mega-menu (hidden < lg) ──────────────── */}
        <DesktopNav />

        {/* ── Desktop right-side actions ───────────────────── */}
        <div className="hidden lg:flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />

          <Button
            asChild
            variant="outline"
            className="border-gold/30 text-primary-foreground/80 hover:bg-gold/10 hover:text-gold font-heading font-semibold text-[13px] h-9"
          >
            <a href="/demo">Demo</a>
          </Button>

          <Button
            asChild
            className="bg-gradient-to-r from-gold to-yellow-500 font-heading font-bold text-navy hover:from-gold/90 hover:to-yellow-500/90 shadow-[0_0_20px_rgba(212,175,55,0.25)] text-[13px] h-9"
          >
            <a href="#contacto">{t("hero.cta1")}</a>
          </Button>
        </div>

        {/* ── Mobile right-side controls ───────────────────── */}
        <div className="flex lg:hidden items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
