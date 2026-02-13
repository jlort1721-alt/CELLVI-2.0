const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // max requests
const RATE_WINDOW = 60_000; // per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown";
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en un minuto." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { type, name, email, phone, message, subject, description } = body;

    // Honeypot check
    if (body.honeypot) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Basic validation
    if (!name || !email) {
      return new Response(JSON.stringify({ error: "Nombre y correo son requeridos." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const CONTACT_TO_EMAIL = Deno.env.get("CONTACT_TO_EMAIL") || "asegurar.limitada@asegurar.com.co";
    const CONTACT_FROM_EMAIL = Deno.env.get("CONTACT_FROM_EMAIL") || "onboarding@resend.dev";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Servicio de email no configurado." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sanitize = (s: string) => s?.replace(/[<>]/g, "").trim().slice(0, 2000) || "";
    const timestamp = new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" });

    const isPQR = type === "pqr";
    const subjectLine = isPQR
      ? `[PQR - ${sanitize(subject || "Sin asunto")}] ${sanitize(name)}`
      : `[Contacto Web] ${sanitize(name)}`;

    const contentBody = isPQR
      ? `<p><strong>Tipo:</strong> ${sanitize(body.pqrType || "N/A")}</p>
         <p><strong>Asunto:</strong> ${sanitize(subject)}</p>
         <p><strong>Descripción:</strong></p><p>${sanitize(description)}</p>`
      : `<p><strong>Mensaje:</strong></p><p>${sanitize(message)}</p>`;

    // Send notification to team
    const teamEmail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [CONTACT_TO_EMAIL],
        subject: subjectLine,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1a2744;padding:20px;text-align:center;">
              <h2 style="color:#d4a017;margin:0;">ASEGURAR LTDA</h2>
              <p style="color:#ccc;font-size:12px;margin:4px 0 0;">Formulario Web</p>
            </div>
            <div style="padding:20px;background:#f9f9f9;">
              <p><strong>Nombre:</strong> ${sanitize(name)}</p>
              <p><strong>Correo:</strong> ${sanitize(email)}</p>
              ${phone ? `<p><strong>Teléfono:</strong> ${sanitize(phone)}</p>` : ""}
              ${contentBody}
              <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />
              <p style="font-size:11px;color:#999;">Enviado el ${timestamp}</p>
            </div>
          </div>
        `,
      }),
    });

    if (!teamEmail.ok) {
      const errText = await teamEmail.text();
      console.error("Resend team email error:", errText);
      return new Response(JSON.stringify({ error: "Error al enviar el correo." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send auto-reply to user
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [sanitize(email)],
        subject: isPQR
          ? "Confirmación de recepción PQR - ASEGURAR LTDA"
          : "Hemos recibido tu mensaje - ASEGURAR LTDA",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1a2744;padding:20px;text-align:center;">
              <h2 style="color:#d4a017;margin:0;">ASEGURAR LTDA</h2>
            </div>
            <div style="padding:20px;">
              <p>Hola <strong>${sanitize(name)}</strong>,</p>
              <p>${isPQR
                ? "Hemos recibido tu solicitud PQR. Será atendida en un plazo máximo de 15 días hábiles según la normatividad vigente."
                : "Gracias por contactarnos. Hemos recibido tu mensaje y nos pondremos en contacto contigo lo antes posible."
              }</p>
              <p style="color:#999;font-size:12px;">Este es un correo automático, por favor no respondas directamente.</p>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0;" />
              <p style="font-size:11px;color:#aaa;">ASEGURAR LTDA — Ubicación y Rastreo Satelital<br/>Pasto, Nariño, Colombia</p>
            </div>
          </div>
        `,
      }),
    }).catch((e) => console.error("Auto-reply error:", e));

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: "Error interno del servidor." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
