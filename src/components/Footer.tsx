import { Facebook, Instagram, Linkedin } from "lucide-react";
import { useTranslation } from "react-i18next";
import logoAsegurar from "@/assets/logo-asegurar.jpeg";
import { getActiveSocials } from "@/config/socials";

const iconMap: Record<string, React.ElementType> = { Facebook, Instagram, Linkedin };

const Footer = () => {
  const { t } = useTranslation();
  const socials = getActiveSocials();

  return (
    <footer className="bg-navy border-t border-gold/10" role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <img src="/logo.png" alt="ASEGURAR LTDA" className="h-14 w-auto object-contain" />
            </div>
            <p className="text-primary-foreground/50 text-sm leading-relaxed">{t("footer.description")}</p>
          </div>

          <div>
            <h4 className="font-heading font-bold text-primary-foreground mb-4">{t("footer.products")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/50">
              <li><a href="#inicio" className="hover:text-gold transition-colors">{t("nav.inicio")}</a></li>
              <li><a href="#nosotros" className="hover:text-gold transition-colors">{t("footer.whoWeAre")}</a></li>
              <li><a href="#servicios" className="hover:text-gold transition-colors">{t("nav.servicios")}</a></li>
              <li><a href="#contacto" className="hover:text-gold transition-colors">{t("nav.contacto")}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-primary-foreground mb-4">{t("footer.utilities")}</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/50">
              <li><a href="#blog" className="hover:text-gold transition-colors">{t("nav.blog")}</a></li>
              <li><a href="#politicas" className="hover:text-gold transition-colors">{t("footer.policies")}</a></li>
              <li><a href="/pqr" className="hover:text-gold transition-colors">{t("footer.pqrChannel")}</a></li>
              <li><a href="#contacto" className="hover:text-gold transition-colors">RNDC</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-bold text-primary-foreground mb-4">{t("footer.socialMedia")}</h4>
            <p className="text-primary-foreground/40 text-xs mb-3">{t("footer.socialSoon")}</p>
            <div className="flex gap-3">
              {socials.map((s) => {
                const Icon = iconMap[s.icon];
                return Icon ? (
                  <a
                    key={s.platform}
                    href={s.url!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center hover:bg-gold/20 transition-colors"
                    aria-label={s.label}
                  >
                    <Icon className="w-4 h-4 text-gold" />
                  </a>
                ) : null;
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-gold/10 mt-10 pt-6 text-center">
          <p className="text-primary-foreground/40 text-xs">
            {t("footer.copyright", { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
