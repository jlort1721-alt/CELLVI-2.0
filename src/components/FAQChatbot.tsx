import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Message {
  role: "bot" | "user";
  text: string;
}

const FAQes: Record<string, string> = {
  "servicios": "Ofrecemos monitoreo de flota vehicular, activos fijos, maquinaria pesada, CCTV empresarial, identificación biométrica, alarmas perimetrales, control de acceso corporativo y comunicaciones PTT. Cada módulo incluye SLAs definidos.",
  "soluciones": "Nuestro portafolio incluye monitoreo satelital con cadena de custodia digital, centro de operaciones 24/7, consultoría en seguridad electrónica y monitoreo internacional multi-país.",
  "planes": "Ofrecemos Plan Premium (equipo propio + año prepago), Plan Estándar (mensual), Plan Comodato (sin inversión inicial), Plan Homologación (equipos existentes) y Servicios Especiales para maquinaria pesada. Todos con SLA 99.9%.",
  "precios": "Los precios varían según el plan y tamaño de flota. Solicite una cotización personalizada: +57 318 750 0962 o asegurar.limitada@gmail.com.",
  "contacto": "📞 +57 315 587 0498 | +57 318 750 0962\n📧 asegurar.limitada@gmail.com\n📍 Calle 19 No 27-41, Piso 2, Edificio Merlopa, Pasto – Nariño",
  "horario": "Centro de operaciones: 24/7 sin interrupciones. Oficinas comerciales: Lun-Vie 8AM-6PM, Sáb 8AM-1PM.",
  "cobertura": "Cobertura nacional completa con despliegue técnico en todo el territorio colombiano. Monitoreo internacional en Latinoamérica.",
  "cellvi": "CELLVI 2.0 es nuestro Command Center: rastreo GPS, geocercas, control de velocidad, bloqueo remoto, reportes PDF/Excel, cadena de custodia digital con sellado SHA-256 y auditoría inmutable.",
  "sla": "Garantizamos SLA de disponibilidad del 99.9%. Soporte técnico 24/7 con escalamiento automático de incidentes y protocolos de respuesta documentados.",
  "api": "API RESTful v2 con 50+ endpoints documentados en OpenAPI 3.1. Autenticación OAuth2 con scopes granulares, webhooks HMAC-SHA256 y SDKs para Python, Node.js y .NET.",
  "seguridad": "Cifrado AES-256 en reposo, TLS 1.3 en tránsito. Cadena de custodia digital con hash SHA-256, auditoría inmutable y multi-tenancy aislado con Row Level Security.",
  "ristra": "Estamos integrados oficialmente con RISTRA (Red de Información de Seguridad para el Transporte) para trazabilidad y cumplimiento normativo en transporte de carga.",
  "cumplimiento": "Red autorizada por MinTIC (Resolución 000656/2002). Proveedores GPS autorizados por Policía Nacional e inscritos ante RUNT. Cumplimiento Ley 1581/2012 de protección de datos.",
};

const FAQen: Record<string, string> = {
  "services": "We offer fleet vehicle monitoring, fixed asset monitoring, heavy machinery tracking, enterprise CCTV, biometric ID, perimeter alarms, corporate access control, and PTT. Each module includes defined SLAs.",
  "solutions": "Our portfolio includes satellite monitoring with digital chain of custody, 24/7 operations center, electronic security consulting, and multi-country international monitoring.",
  "plans": "We offer Premium (owned equipment + annual prepaid), Standard (monthly), Loan (zero upfront), Homologation (existing equipment), and Special Services for heavy machinery. All with 99.9% SLA.",
  "prices": "Prices vary by plan and fleet size. Request a custom quote: +57 318 750 0962 or asegurar.limitada@gmail.com.",
  "contact": "📞 +57 315 587 0498 | +57 318 750 0962\n📧 asegurar.limitada@gmail.com\n📍 Calle 19 No 27-41, Floor 2, Merlopa Building, Pasto – Nariño",
  "hours": "Operations center: 24/7 uninterrupted. Commercial offices: Mon-Fri 8AM-6PM, Sat 8AM-1PM.",
  "coverage": "Full national coverage with technical deployment across Colombian territory. International monitoring in Latin America.",
  "cellvi": "CELLVI 2.0 is our Command Center: GPS tracking, geofences, speed control, remote lock, PDF/Excel reports, digital chain of custody with SHA-256 sealing, and immutable audit trail.",
  "sla": "We guarantee 99.9% uptime SLA. 24/7 tech support with automatic incident escalation and documented response protocols.",
  "api": "RESTful API v2 with 50+ endpoints documented in OpenAPI 3.1. OAuth2 auth with granular scopes, HMAC-SHA256 webhooks, and SDKs for Python, Node.js, and .NET.",
  "security": "AES-256 encryption at rest, TLS 1.3 in transit. Digital chain of custody with SHA-256 hash, immutable audit trail, and isolated multi-tenancy with Row Level Security.",
  "ristra": "Officially integrated with RISTRA (Transportation Security Information Network) for traceability and regulatory compliance in cargo transport.",
  "compliance": "Network authorized by MinTIC (Resolution 000656/2002). GPS providers authorized by National Police and registered with RUNT. Law 1581/2012 data protection compliance.",
};

const FAQChatbot = () => {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith("en");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: t("chatbot.greeting") },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const findAnswer = (inp: string): string => {
    const lower = inp.toLowerCase();
    const faq = isEn ? FAQen : FAQes;
    for (const [key, val] of Object.entries(faq)) {
      if (lower.includes(key)) return val;
    }
    if (lower.includes("hola") || lower.includes("hi") || lower.includes("hello"))
      return t("chatbot.helloResponse");
    if (lower.includes("gracias") || lower.includes("thanks"))
      return t("chatbot.thanksResponse");
    return t("chatbot.defaultResponse");
  };

  const send = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setInput("");
    setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: findAnswer(userMsg) }]);
    }, 500);
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            aria-label={t("chatbot.open")}
          >
            <MessageSquare className="w-6 h-6 text-primary-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 w-80 sm:w-96 h-[28rem] bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
          >
            <div className="bg-navy px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-gold" />
                <span className="font-heading font-bold text-primary-foreground text-sm">{t("chatbot.title")}</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-primary-foreground/60 hover:text-primary-foreground" aria-label={t("common.close")}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "bot" && (
                    <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-gold" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}>
                    {msg.text}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder={t("chatbot.placeholder")}
                className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-gold"
                aria-label={t("chatbot.placeholder")}
              />
              <button
                onClick={send}
                className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center hover:opacity-90 transition-opacity"
                aria-label={t("contact.sendButton")}
              >
                <Send className="w-3.5 h-3.5 text-navy" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FAQChatbot;
