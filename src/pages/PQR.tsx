import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, FileText, Send, CheckCircle, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import logoAsegurar from "@/assets/logo-asegurar.jpeg";

const pqrSchema = z.object({
  type: z.enum(["peticion", "queja", "reclamo", "sugerencia"]),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().min(5).max(200),
  description: z.string().trim().min(10).max(2000),
});

const PQR = () => {
  const { t } = useTranslation();
  const [form, setForm] = useState({ type: "peticion", name: "", email: "", phone: "", subject: "", description: "", honeypot: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [radicado, setRadicado] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const typeLabels: Record<string, string> = {
    peticion: t("pqr.petition"),
    queja: t("pqr.complaint"),
    reclamo: t("pqr.claim"),
    sugerencia: t("pqr.suggestion"),
  };

  const handleChange = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.honeypot) return;

    const result = pqrSchema.safeParse(form);
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
      const { data, error } = await supabase
        .from("pqr_submissions")
        .insert({
          type: form.type,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone?.trim() || null,
          subject: form.subject.trim(),
          description: form.description.trim(),
          honeypot: "",
        })
        .select("radicado")
        .single();

      if (error) throw error;
      setRadicado(data.radicado);

      await supabase.functions.invoke("send-email", {
        body: {
          type: "pqr",
          pqrType: form.type,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone?.trim() || "",
          subject: form.subject.trim(),
          description: form.description.trim(),
          honeypot: "",
        },
      }).catch((e) => console.error("PQR email error (non-blocking):", e));

      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full bg-card rounded-2xl p-8 border border-border text-center shadow-lg">
          <CheckCircle className="w-16 h-16 text-gold mx-auto mb-4" />
          <h2 className="font-heading font-extrabold text-2xl text-foreground mb-2">{t("pqr.successTitle")}</h2>
          <p className="text-muted-foreground text-sm mb-4">{t("pqr.successMessage")}</p>
          <div className="bg-muted rounded-xl p-4 mb-6">
            <p className="text-xs text-muted-foreground mb-1">{t("pqr.caseNumber")}:</p>
            <p className="font-heading font-extrabold text-xl text-gold">{radicado}</p>
          </div>
          <p className="text-xs text-muted-foreground mb-6">{t("pqr.saveNumber")}</p>
          <Button asChild className="bg-gold-gradient text-navy font-heading font-bold hover:opacity-90">
            <a href="/">{t("common.back")}</a>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy border-b border-gold/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src={logoAsegurar} alt="ASEGURAR LTDA" className="h-10 w-auto object-contain brightness-0 invert" />
          </a>
          <a href="/" className="text-sm font-medium text-gold flex items-center gap-1 hover:opacity-80">
            <ChevronLeft className="w-4 h-4" /> {t("common.back")}
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-2xl" role="main">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-gold/10 border border-gold/30 rounded-full px-4 py-1 mb-4">
              <FileText className="w-4 h-4 text-gold" />
              <span className="text-xs font-heading font-bold text-gold uppercase tracking-wider">{t("pqr.badge")}</span>
            </div>
            <h1 className="font-heading font-extrabold text-3xl md:text-4xl text-foreground mb-3">
              {t("pqr.title")}
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto">
              {t("pqr.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-sm space-y-5">
            <input type="text" name="website" value={form.honeypot} onChange={(e) => handleChange("honeypot", e.target.value)} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

            <div>
              <label className="text-sm font-heading font-bold text-foreground mb-2 block">{t("pqr.requestType")} *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(typeLabels).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleChange("type", key)}
                    className={`px-3 py-2 rounded-lg text-xs font-heading font-bold transition-all border ${
                      form.type === key ? "bg-gold-gradient text-navy border-gold" : "bg-muted text-muted-foreground border-border hover:border-gold/40"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pqr-name" className="text-sm font-medium text-foreground mb-1 block">{t("pqr.fullName")} *</label>
                <Input id="pqr-name" value={form.name} onChange={(e) => handleChange("name", e.target.value)} required aria-invalid={!!errors.name} />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="pqr-email" className="text-sm font-medium text-foreground mb-1 block">{t("pqr.emailLabel")} *</label>
                <Input id="pqr-email" type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} required aria-invalid={!!errors.email} />
                {errors.email && <p className="text-destructive text-xs mt-1">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="pqr-phone" className="text-sm font-medium text-foreground mb-1 block">{t("pqr.phoneLabel")}</label>
              <Input id="pqr-phone" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>

            <div>
              <label htmlFor="pqr-subject" className="text-sm font-medium text-foreground mb-1 block">{t("pqr.subjectLabel")} *</label>
              <Input id="pqr-subject" value={form.subject} onChange={(e) => handleChange("subject", e.target.value)} required aria-invalid={!!errors.subject} />
              {errors.subject && <p className="text-destructive text-xs mt-1">{errors.subject}</p>}
            </div>

            <div>
              <label htmlFor="pqr-desc" className="text-sm font-medium text-foreground mb-1 block">{t("pqr.descriptionLabel")} *</label>
              <Textarea id="pqr-desc" rows={5} value={form.description} onChange={(e) => handleChange("description", e.target.value)} required className="resize-none" aria-invalid={!!errors.description} />
              {errors.description && <p className="text-destructive text-xs mt-1">{errors.description}</p>}
            </div>

            {status === "error" && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4" /> {t("pqr.errorMessage")}
              </div>
            )}

            <div className="text-xs text-muted-foreground bg-muted rounded-lg p-3">
              {t("pqr.dataPolicy")}
            </div>

            <Button type="submit" disabled={status === "sending"} className="w-full bg-gold-gradient text-navy font-heading font-bold hover:opacity-90">
              <Send className="w-4 h-4 mr-2" />
              {status === "sending" ? t("pqr.submitting") : t("pqr.submitButton")}
            </Button>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default PQR;
