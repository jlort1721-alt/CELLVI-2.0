import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Phone, Mail, MapPin, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nombre requerido").max(100),
  phone: z.string().trim().min(7, "Teléfono requerido").max(20),
  email: z.string().trim().email("Correo inválido").max(255),
  message: z.string().trim().min(10, "Mensaje muy corto").max(1000),
});

const ContactSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "", honeypot: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.honeypot) return;

    const result = contactSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setStatus("sending");
    try {
      // Save to DB
      const { error: dbError } = await supabase.from("contact_submissions").insert({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
        honeypot: "",
      });
      if (dbError) throw dbError;

      // Send email via edge function
      const { error: fnError } = await supabase.functions.invoke("send-email", {
        body: {
          type: "contact",
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          honeypot: "",
        },
      });
      if (fnError) console.error("Email send error (non-blocking):", fnError);

      setStatus("success");
      setForm({ name: "", phone: "", email: "", message: "", honeypot: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contacto" className="py-20 md:py-28 bg-navy relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 w-64 h-64 bg-gold rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center mb-16">
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">{t("contact.badge")}</span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-primary-foreground mt-3">{t("contact.title")}</h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}>
            <h3 className="font-heading font-bold text-xl text-primary-foreground mb-6">{t("contact.infoTitle")}</h3>
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-gold" /></div>
                <div>
                  <p className="text-primary-foreground font-medium text-sm">{t("contact.address")}</p>
                  <p className="text-primary-foreground/60 text-sm">{t("contact.addressValue")}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center flex-shrink-0"><Mail className="w-5 h-5 text-gold" /></div>
                <div>
                  <p className="text-primary-foreground font-medium text-sm">{t("contact.email")}</p>
                  <a href="mailto:asegurar.limitada@gmail.com" className="text-primary-foreground/60 text-sm hover:text-gold transition-colors">asegurar.limitada@gmail.com</a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gold/15 flex items-center justify-center flex-shrink-0"><Phone className="w-5 h-5 text-gold" /></div>
                <div>
                  <p className="text-primary-foreground font-medium text-sm">{t("contact.phones")}</p>
                  <a href="https://api.whatsapp.com/send?phone=573187500962&text=Hola%2C%20quiero%20información%20sobre%20los%20servicios%20de%20ASEGURAR%20LTDA." target="_blank" rel="noopener noreferrer" className="text-primary-foreground/60 text-sm hover:text-gold transition-colors block">+57 318 750 0962 (WhatsApp)</a>
                  <a href="tel:+573155870498" className="text-primary-foreground/60 text-sm hover:text-gold transition-colors block">+57 315 587 0498</a>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, x: 30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.3 }} className="space-y-4">
            <input type="text" name="website" value={form.honeypot} onChange={(e) => handleChange("honeypot", e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input placeholder={t("contact.namePlaceholder")} value={form.name} onChange={(e) => handleChange("name", e.target.value)} required aria-label={t("contact.namePlaceholder")} aria-invalid={!!errors.name} className="bg-navy-light/50 border-gold/20 text-primary-foreground placeholder:text-primary-foreground/40" />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <Input placeholder={t("contact.phonePlaceholder")} value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} required aria-label={t("contact.phonePlaceholder")} aria-invalid={!!errors.phone} className="bg-navy-light/50 border-gold/20 text-primary-foreground placeholder:text-primary-foreground/40" />
                {errors.phone && <p className="text-destructive text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
            <div>
              <Input placeholder={t("contact.emailPlaceholder")} type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} required aria-label={t("contact.emailPlaceholder")} aria-invalid={!!errors.email} className="bg-navy-light/50 border-gold/20 text-primary-foreground placeholder:text-primary-foreground/40" />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
            </div>
            <div>
              <Textarea placeholder={t("contact.messagePlaceholder")} rows={4} value={form.message} onChange={(e) => handleChange("message", e.target.value)} required aria-label={t("contact.messagePlaceholder")} aria-invalid={!!errors.message} className="bg-navy-light/50 border-gold/20 text-primary-foreground placeholder:text-primary-foreground/40 resize-none" />
              {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
            </div>

            {status === "success" && (
              <div className="flex items-center gap-2 text-gold text-sm bg-gold/10 rounded-lg p-3" role="status" aria-live="polite">
                <CheckCircle className="w-4 h-4" /> {t("contact.successMessage")}
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3" role="alert" aria-live="assertive">
                <AlertCircle className="w-4 h-4" /> {t("contact.errorMessage")}
              </div>
            )}

            <Button type="submit" disabled={status === "sending"} className="bg-gold-gradient text-navy font-heading font-bold hover:opacity-90 w-full">
              <Send className="w-4 h-4 mr-2" />
              {status === "sending" ? t("contact.sending") : t("contact.sendButton")}
            </Button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
