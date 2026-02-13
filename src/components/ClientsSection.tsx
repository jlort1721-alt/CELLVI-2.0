import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Truck, CreditCard } from "lucide-react";

const clients = ["Coopsetrans", "Cootranseap", "CootransPetrols", "Transtours", "Transportes Tina", "Flota Guaitara", "Ron Viejo de Caldas", "Morasurco", "TPI", "Servicaña", "Sagan", "Expreso Valle de Atriz", "Lácteos Santa María", "Transcarga del Sur", "Transportes Ipiales", "TransNariño"];
const paymentMethods = [
  { name: "Nequi", logo: "/nequi.png", color: "bg-white" },
  { name: "Bancolombia", logo: "/bancolombia.png", color: "bg-white" },
  { name: "PSE", logo: "/pse.png", color: "bg-white" },
  { name: "DRUO", logo: "/druo.png", color: "bg-white" },
];

const ClientsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  return (
    <section id="clientes" className="py-20 md:py-28 bg-background" ref={ref}>
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-12">
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">{t("clients.badge")}</span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">{t("clients.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">{t("clients.subtitle")}</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-16">
          {clients.map((client, i) => (
            <motion.div key={client} initial={{ opacity: 0, scale: 0.9 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.4, delay: 0.04 * i }} className="flex items-center justify-center gap-2 bg-card rounded-xl p-5 border border-border hover:border-gold/40 hover:shadow-md transition-all group">
              <Truck className="w-5 h-5 text-gold/60 group-hover:text-gold transition-colors flex-shrink-0" />
              <span className="font-heading font-bold text-sm text-foreground text-center leading-tight">{client}</span>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.5 }} className="text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-gold" />
            <span className="font-heading font-bold text-foreground">{t("clients.paymentMethods")}</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {paymentMethods.map((pm) => (
              <div key={pm.name} className={`bg-white rounded-xl px-4 py-2 min-w-[120px] h-[60px] flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border border-gold/10`}>
                {/* Fallback to text if image fails or isn't present, but prioritizing images */}
                <img src={pm.logo} alt={pm.name} className="max-h-full max-w-full object-contain" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerText = pm.name;
                }} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default ClientsSection;
