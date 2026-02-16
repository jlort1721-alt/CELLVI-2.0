import { Facebook, Instagram, Linkedin, MapPin, Phone, Mail, Shield, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getActiveSocials } from "@/config/socials";

const iconMap: Record<string, React.ElementType> = { Facebook, Instagram, Linkedin };

const Footer = ({ id }: { id?: string }) => {
  const { t } = useTranslation();
  const socials = getActiveSocials();

  return (
    <footer id={id} className="bg-navy border-t border-white/[0.06]" role="contentinfo">
      <div className="container mx-auto px-4">
        {/* Main Footer */}
        <div className="py-14 grid md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <img src="/logo.png" alt="ASEGURAR LTDA" className="h-12 w-auto object-contain mb-4" />
            <p className="text-white/40 text-sm leading-relaxed max-w-sm mb-6">
              {t("footer.description")}
            </p>
            <div className="space-y-2.5">
              <a href="tel:+573187500962" className="flex items-center gap-2.5 text-white/40 hover:text-gold transition-colors text-sm">
                <Phone className="w-3.5 h-3.5" />
                +57 318 750 0962
              </a>
              <a href="mailto:asegurar.limitada@gmail.com" className="flex items-center gap-2.5 text-white/40 hover:text-gold transition-colors text-sm">
                <Mail className="w-3.5 h-3.5" />
                asegurar.limitada@gmail.com
              </a>
              <div className="flex items-center gap-2.5 text-white/40 text-sm">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                Pasto, Nariño, Colombia
              </div>
            </div>
          </div>

          {/* Platform Column */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm mb-4">{t("footer.platformCol")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#inicio" className="text-white/40 hover:text-gold transition-colors">{t("nav.inicio")}</a></li>
              <li><a href="#nosotros" className="text-white/40 hover:text-gold transition-colors">{t("footer.whoWeAre")}</a></li>
              <li><a href="#servicios" className="text-white/40 hover:text-gold transition-colors">{t("nav.servicios")}</a></li>
              <li><a href="#plataforma" className="text-white/40 hover:text-gold transition-colors">{t("nav.plataforma")}</a></li>
              <li><a href="#pricing" className="text-white/40 hover:text-gold transition-colors">{t("nav.planes")}</a></li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm mb-4">{t("footer.products")}</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/dashboard" className="text-white/40 hover:text-gold transition-colors flex items-center gap-1">Dashboard <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li><a href="/tracking" className="text-white/40 hover:text-gold transition-colors flex items-center gap-1">Tracking GPS <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li><a href="/demo" className="text-white/40 hover:text-gold transition-colors flex items-center gap-1">Demo ASEGURAR <ExternalLink className="w-2.5 h-2.5" /></a></li>
              <li><a href="/pqr" className="text-white/40 hover:text-gold transition-colors flex items-center gap-1">{t("footer.pqrChannel")} <ExternalLink className="w-2.5 h-2.5" /></a></li>
            </ul>
          </div>

          {/* Resources & Social */}
          <div>
            <h4 className="font-heading font-bold text-white text-sm mb-4">{t("footer.utilities")}</h4>
            <ul className="space-y-2.5 text-sm mb-6">
              <li><a href="#politicas" className="text-white/40 hover:text-gold transition-colors">{t("footer.policies")}</a></li>
              <li><a href="#blog" className="text-white/40 hover:text-gold transition-colors">{t("nav.blog")}</a></li>
              <li><a href="#contacto" className="text-white/40 hover:text-gold transition-colors">{t("nav.contacto")}</a></li>
              <li><a href="#faq" className="text-white/40 hover:text-gold transition-colors">FAQ</a></li>
            </ul>

            <h4 className="font-heading font-bold text-white text-sm mb-3">{t("footer.socialMedia")}</h4>
            <div className="flex gap-2">
              {socials.map((s) => {
                const Icon = iconMap[s.icon];
                return Icon ? (
                  <a key={s.platform} href={s.url!} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-gold/10 hover:border-gold/20 transition-all"
                    aria-label={s.label}>
                    <Icon className="w-3.5 h-3.5 text-white/40 hover:text-gold" />
                  </a>
                ) : null;
              })}
            </div>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="border-t border-white/[0.06] py-6">
          <div className="flex flex-wrap items-center justify-center gap-6">
            {[
              { label: t("footer.minticBadge"), icon: Shield },
              { label: t("footer.policiaBadge"), icon: Shield },
              { label: t("footer.runtBadge"), icon: Shield },
              { label: t("footer.ristraBadge"), icon: Shield },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-1.5">
                <badge.icon className="w-3 h-3 text-gold/50" />
                <span className="text-[10px] text-white/30 font-medium uppercase tracking-wider">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/[0.06] py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex items-center gap-6 text-[10px] text-white/25">
            <a href="#politicas" className="hover:text-gold transition-colors">{t("footer.privacyPolicy")}</a>
            <a href="#politicas" className="hover:text-gold transition-colors">{t("footer.termsConditions")}</a>
            <a href="#politicas" className="hover:text-gold transition-colors">{t("footer.habeasData")}</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
