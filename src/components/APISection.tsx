import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { Code2, Webhook, KeyRound, Terminal } from "lucide-react";

const apiItems = [
  { icon: Code2, key: "api1" },
  { icon: Webhook, key: "api2" },
  { icon: KeyRound, key: "api3" },
  { icon: Terminal, key: "api4" },
];

const APISection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();

  return (
    <section className="py-20 md:py-28 bg-navy relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gold rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">
            {t("platform.apiBadge")}
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-primary-foreground mt-3">
            {t("platform.apiTitle")}
          </h2>
          <p className="text-primary-foreground/60 max-w-2xl mx-auto mt-4 text-lg">
            {t("platform.apiSubtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {apiItems.map((item, i) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="bg-navy-light/50 rounded-xl p-7 border border-gold/10 hover:border-gold/40 transition-all group"
            >
              <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <item.icon className="w-6 h-6 text-gold" />
              </div>
              <h3 className="font-heading font-bold text-lg text-primary-foreground mb-2">
                {t(`platform.${item.key}`)}
              </h3>
              <p className="text-primary-foreground/60 text-sm leading-relaxed">
                {t(`platform.${item.key}Desc`)}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 bg-navy-light/30 rounded-2xl border border-gold/10 overflow-hidden"
        >
          <div className="grid lg:grid-cols-2">
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              <h3 className="font-heading font-bold text-2xl text-primary-foreground mb-4">
                {t("platform.apiIntegrationTitle")}
              </h3>
              <p className="text-primary-foreground/60 mb-6 leading-relaxed">
                {t("platform.apiIntegrationDesc")}
              </p>

              <div className="bg-[hsl(222,47%,8%)] rounded-xl border border-gold/10 overflow-hidden shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gold/10 bg-black/20">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="text-xs text-primary-foreground/40 ml-2 font-mono">curl — CELLVI API v2</span>
                </div>
                <pre className="p-5 text-xs font-mono text-primary-foreground/70 overflow-x-auto leading-relaxed">
                  <code>{`curl -X GET "https://api.cellvi.com/v2/vehicles" \\
  -H "Authorization: Bearer <token>" \\
  -H "X-Tenant-Id: <org_id>" \\
  -H "Accept: application/json"

# Response: 200 OK
# X-Total-Count: 47
# X-RateLimit-Remaining: 994`}</code>
                </pre>
              </div>
            </div>

            <div className="relative h-64 lg:h-auto min-h-[300px]">
              <div className="absolute inset-0 bg-navy/20 z-10" />
              <img
                src="/network-servers.jpg"
                alt="API Network Infrastructure"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default APISection;
