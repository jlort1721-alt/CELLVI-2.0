import { useCallback, useMemo, memo, type FC } from "react";
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
  Sparkles,
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
  badge?: string;
}

interface NavGroup {
  id: string;
  label: string;
  sections: string[];
  links: NavLink[];
  direct?: boolean;
  /** Number of grid columns for the dropdown (default 1) */
  cols?: 1 | 2 | 3;
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
        cols: 3,
        links: [
          { label: t("nav.solTransporte"), href: "#servicios", icon: Car, desc: t("nav.solTransporteDesc") },
          { label: t("nav.solSeguridad"), href: "#servicios", icon: Shield, desc: t("nav.solSeguridadDesc") },
          { label: t("nav.solObras"), href: "#servicios", icon: Construction, desc: t("nav.solObrasDesc") },
          { label: t("nav.solConsultoria"), href: "#servicios", icon: Globe, desc: t("nav.solConsultoriaDesc") },
          { label: t("nav.solComercio"), href: "#servicios", icon: Building2, desc: t("nav.solComercioDesc") },
          { label: t("nav.solVideo"), href: "#servicios", icon: Camera, desc: t("nav.solVideoDesc") },
        ],
      },
      {
        id: "plataforma",
        label: t("nav.plataforma"),
        sections: ["plataforma", "security", "api"],
        cols: 3,
        links: [
          { label: "ASEGURAR LTDA", href: "#plataforma", icon: MonitorPlay, desc: t("nav.cellvi20Desc"), badge: "Core" },
          { label: t("nav.seguridad"), href: "#security", icon: Shield, desc: t("nav.seguridadDesc") },
          { label: "API", href: "#api", icon: Code2, desc: t("nav.apiDesc") },
          { label: t("nav.appMovil"), href: "#plataforma", icon: Smartphone, desc: t("nav.appMovilDesc") },
          { label: t("nav.demoCellvi"), href: "/demo", icon: MonitorPlay, desc: t("nav.demoDesc"), badge: "Live" },
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

const triggerCx =
  "text-white/70 hover:text-gold data-[state=open]:text-gold text-[13px] font-semibold tracking-wide bg-transparent hover:bg-white/[0.04] focus:bg-white/[0.04] data-[state=open]:bg-white/[0.06] data-[active]:bg-transparent";

const triggerActiveCx = "text-gold";

function isGroupActive(groupSections: string[], visibleSections: string[]): boolean {
  return groupSections.some((s) => visibleSections.includes(s));
}

/* ═══════════════════════════════════════════════════════════════════════════
   Dropdown link item (reused in desktop panels)
   ═══════════════════════════════════════════════════════════════════════════ */

const DropdownLinkItem = memo<{ link: NavLink; compact?: boolean; onClick?: () => void }>(({ link, compact, onClick }) => {
  const Icon = link.icon;
  return (
    <NavigationMenuLink asChild>
      <a
        href={link.href}
        onClick={onClick}
        className={cn(
          "flex items-center rounded-lg transition-all duration-200 hover:bg-white/[0.05] group/link",
          compact ? "gap-2.5 px-2.5 py-2" : "gap-3 px-3 py-2.5",
        )}
      >
        {Icon && (
          <div className={cn(
            "shrink-0 flex items-center justify-center rounded-lg bg-gold/[0.08] border border-gold/[0.12] transition-all duration-200 group-hover/link:bg-gold/15 group-hover/link:border-gold/25",
            compact ? "h-8 w-8" : "h-9 w-9",
          )}>
            <Icon className={cn("text-gold/70 group-hover/link:text-gold transition-colors", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              "font-semibold text-white/85 group-hover/link:text-gold transition-colors leading-tight truncate",
              compact ? "text-[12px]" : "text-[13px]",
            )}>
              {link.label}
            </span>
            {link.badge && (
              <span className="text-[8px] font-bold uppercase tracking-wider px-1 py-px rounded bg-gold/10 text-gold/70 border border-gold/15 shrink-0">
                {link.badge}
              </span>
            )}
          </div>
          {link.desc && (
            <div className={cn(
              "leading-snug text-white/35 group-hover/link:text-white/50 transition-colors line-clamp-1",
              compact ? "text-[10px] mt-px" : "text-[11px] mt-0.5",
            )}>
              {link.desc}
            </div>
          )}
        </div>
      </a>
    </NavigationMenuLink>
  );
});
DropdownLinkItem.displayName = "DropdownLinkItem";

/* ═══════════════════════════════════════════════════════════════════════════
   Desktop Navigation
   ═══════════════════════════════════════════════════════════════════════════ */

const DesktopNav: FC = () => {
  const navGroups = useNavGroups();
  const visibleSections = useLandingStore((s) => s.visibleSections);

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList className="gap-0.5">
        {navGroups.map((group) => {
          const active = isGroupActive(group.sections, visibleSections);

          if (group.direct) {
            return (
              <NavigationMenuItem key={group.id}>
                <NavigationMenuLink asChild>
                  <a
                    href={group.links[0].href}
                    className={cn(
                      "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-[13px] font-semibold tracking-wide transition-colors",
                      "text-white/70 hover:text-gold hover:bg-white/[0.04]",
                      active && "text-gold",
                    )}
                  >
                    {group.label}
                  </a>
                </NavigationMenuLink>
              </NavigationMenuItem>
            );
          }

          return (
            <NavigationMenuItem key={group.id}>
              <NavigationMenuTrigger
                className={cn(triggerCx, active && triggerActiveCx)}
              >
                {group.label}
              </NavigationMenuTrigger>

              <NavigationMenuContent
                className={cn(
                  "p-3",
                  group.cols === 3 ? "w-[740px]" : group.cols === 2 ? "w-[540px]" : "w-[320px]",
                )}
              >
                {/* Section header */}
                <div className="px-3 pt-1 pb-2.5 flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold/60 shrink-0">
                    {group.label}
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-l from-gold/30 to-transparent" />
                </div>

                <div
                  className={cn(
                    group.cols === 3 ? "grid grid-cols-3 gap-0.5" :
                    group.cols === 2 ? "grid grid-cols-2 gap-0.5" :
                    "flex flex-col gap-0.5",
                  )}
                >
                  {group.links.map((link) => (
                    <DropdownLinkItem key={link.label} link={link} compact={(group.cols ?? 1) >= 3} />
                  ))}
                </div>

                {/* Bottom accent line */}
                <div className="mt-2.5 mx-3 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
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

const MobileSectionGroup = memo<{
  label: string;
  links: NavLink[];
  onNavigate: () => void;
}>(({ label, links, onNavigate }) => (
  <div className="py-3">
    <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-gold/50">
      {label}
    </p>
    <div className="flex flex-col gap-0.5">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.label}
            href={link.href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 hover:bg-white/[0.04] group/mlink"
          >
            {Icon && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gold/[0.08] border border-gold/[0.12]">
                <Icon className="h-3.5 w-3.5 text-gold/80" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-white/80 group-hover/mlink:text-gold transition-colors">
                {link.label}
              </div>
              {link.desc && (
                <div className="text-[11px] text-white/30 leading-snug mt-0.5 line-clamp-1">
                  {link.desc}
                </div>
              )}
            </div>
          </a>
        );
      })}
    </div>
  </div>
));
MobileSectionGroup.displayName = "MobileSectionGroup";

/* ═══════════════════════════════════════════════════════════════════════════
   Mobile Navigation (Sheet from right)
   ═══════════════════════════════════════════════════════════════════════════ */

const MobileNav: FC = () => {
  const { t } = useTranslation();
  const navGroups = useNavGroups();
  const mobileMenuOpen = useLandingStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useLandingStore((s) => s.setMobileMenuOpen);

  const closeMenu = useCallback(() => setMobileMenuOpen(false), [setMobileMenuOpen]);

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 hover:border-gold/30 hover:bg-white/[0.04] transition-all"
          aria-label={t("nav.openMenu")}
        >
          <Menu className="h-5 w-5 text-white/80" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[320px] sm:w-[360px] bg-[hsl(222,60%,10%)] border-l border-white/[0.06] p-0 overflow-y-auto"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-white/[0.06]">
          <SheetTitle className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="ASEGURAR LTDA"
              className="h-10 w-auto object-contain"
            />
          </SheetTitle>
        </SheetHeader>

        <div className="px-2 divide-y divide-white/[0.04]">
          {navGroups.map((group) => (
            <MobileSectionGroup
              key={group.id}
              label={group.label}
              links={group.links}
              onNavigate={closeMenu}
            />
          ))}
        </div>

        {/* CTAs */}
        <div className="sticky bottom-0 border-t border-white/[0.06] bg-[hsl(222,60%,10%)] p-4 flex flex-col gap-2.5">
          <Button
            asChild
            variant="outline"
            className="w-full border-white/10 text-white/80 hover:bg-white/[0.04] hover:text-gold hover:border-gold/30 font-heading font-semibold text-sm h-10"
          >
            <a href="/demo" onClick={closeMenu}>
              Demo
            </a>
          </Button>
          <Button
            asChild
            className="w-full bg-gradient-to-r from-gold to-yellow-500 font-heading font-bold text-navy hover:from-gold/90 hover:to-yellow-500/90 shadow-[0_0_20px_rgba(212,175,55,0.2)] text-sm h-10"
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
        /* Solid background — always visible and distinguishable */
        "bg-[hsl(222,60%,11%)] border-b",
        hasScrolledPastHero
          ? "border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
          : "border-white/[0.04] shadow-none",
      )}
      role="navigation"
      aria-label={t("nav.mainNav")}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="container mx-auto px-4 flex items-center justify-between h-16 lg:h-[72px]">
        {/* ── Logo ─────────────────────────────────────────── */}
        <a
          href="#inicio"
          className="flex items-center gap-2.5 shrink-0 group"
          aria-label="ASEGURAR LTDA - Inicio"
        >
          <img
            src="/logo.png"
            alt="ASEGURAR LTDA"
            className="h-10 lg:h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </a>

        {/* ── Desktop mega-menu ──────────────── */}
        <DesktopNav />

        {/* ── Desktop right-side actions ───────────────────── */}
        <div className="hidden lg:flex items-center gap-1.5">
          <LanguageSelector />
          <ThemeToggle />

          <div className="w-px h-6 bg-white/[0.08] mx-1.5" />

          <Button
            asChild
            className="border border-white/10 bg-transparent text-white/70 hover:bg-white/[0.04] hover:text-gold hover:border-gold/30 font-heading font-semibold text-[13px] h-9 transition-all"
          >
            <a href="/demo">Demo</a>
          </Button>

          <Button
            asChild
            className="bg-gradient-to-r from-gold to-yellow-500 font-heading font-bold text-navy hover:from-gold/90 hover:to-yellow-500/90 shadow-[0_0_24px_rgba(212,175,55,0.15)] hover:shadow-[0_0_24px_rgba(212,175,55,0.3)] text-[13px] h-9 transition-all"
          >
            <a href="#contacto" className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              {t("hero.cta1")}
            </a>
          </Button>
        </div>

        {/* ── Mobile right-side controls ───────────────────── */}
        <div className="flex lg:hidden items-center gap-1.5">
          <LanguageSelector />
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
