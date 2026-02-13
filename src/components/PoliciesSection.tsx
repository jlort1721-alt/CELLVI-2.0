import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Shield } from "lucide-react";

const policies = [
  "Acatar la Constitución Política de Colombia, las Leyes y normas que rigen los principios de la libre y leal competencia comercial de la empresa privada.",
  "El resultado de las actuaciones de sus funcionarios, deben fortalecer la confianza en sus clientes y suscriptores.",
  "Adoptar todas las medidas de prevención y control para evitar que los servicios que presta sean utilizados como instrumentos para la realización de actividades ilegales.",
  "Mantener en todo momento altos niveles de eficiencia a través de una continua capacitación profesional y técnica de sus funcionarios.",
  "Contribuir a las Autoridades de la República en la prevención del delito, sin invadir las orbitas constitucionales.",
  "Prestar apoyo cuando las Autoridades así lo requieran en casos de calamidad pública o graves desastres naturales.",
  "Mantener actualizados todos los registros legales que el Estado le ha otorgado para el funcionamiento como Red de Telecomunicaciones.",
  "Salvaguardar la información confidencial que obtenga de sus clientes en desarrollo de los servicios que presta al público, mediante la política de tratamiento de datos personales.",
  "Atender en debida forma las quejas y reclamos de los usuarios, que por causa y razón de los servicios que reciben, vean afectado sus intereses, implementando una robusta y oportuna respuesta a través de su portal PQR.",
  "Desarrollar mecanismos de control interno para prevenir que sus trabajadores y contratistas se involucren de manera directa o indirecta en la comisión de actos delictivos.",
  "Dar estricto cumplimiento a las normas que rigen las relaciones obrero patronales, haciendo uso adecuado del reglamento interno de trabajo y la política pública de salud y seguridad en el trabajo.",
  "Los Socios, el Representante Legal y los Trabajadores de la Sociedad comercial son ciudadanos Colombianos y/o extranjeros que cumplen los requisitos que las leyes exigen para el desempeño de sus cargos; siempre exhibirán sus certificados fiscales, disciplinarios, penales y de contravenciones de policía vigentes.",
  "En los eventos especiales en que la sociedad contrate con el sector público, observará y cumplirá a cabalidad con las normas de las leyes de contratación estatal (Ley 80 de 1993).",
];

const PoliciesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  return (
    <section id="politicas" className="py-20 md:py-28 bg-section-gradient" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">{t("policies.badge")}</span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">{t("policies.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">{t("policies.subtitle")}</p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid gap-4">
          {policies.map((policy, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.4, delay: 0.05 * i }} className="flex gap-4 bg-card rounded-xl p-5 border border-border hover:border-gold/40 transition-colors shadow-sm">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center mt-0.5">
                <span className="font-heading font-bold text-navy text-sm">{i + 1}</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{policy}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.8 }} className="flex justify-center mt-12">
          <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-6 py-2">
            <Shield className="w-5 h-5 text-gold" />
            <span className="text-sm font-medium text-foreground">{t("policies.commitment")}</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PoliciesSection;
