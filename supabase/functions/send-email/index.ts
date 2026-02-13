/**
 * Send Email Edge Function
 *
 * Updated with:
 * - PR #12: CORS allowlist (withCors)
 * - PR #13: Durable rate limiting
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { withCors } from "../_shared/cors.ts";
import {
  enforceRateLimit,
  getIdentifier,
  RateLimitError,
  getRateLimitHeaders,
} from "../_shared/rate-limiter.ts";

const handler = async (req: Request): Promise<Response> => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // ✅ PR #13: Durable rate limiting (10 emails per hour per IP)
    const identifier = getIdentifier(req);
    await enforceRateLimit(supabase, {
      maxRequests: 10,
      windowMs: 60 * 60 * 1000, // 1 hour
      identifier,
      endpoint: "send-email",
    });

    const body = await req.json();
    const { type, name, email, phone, message, subject, description } = body;

    // Honeypot check (anti-spam)
    if (body.honeypot) {
      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Basic validation
    if (!name || !email) {
      return new Response(
        JSON.stringify({ error: "Nombre y correo son requeridos." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const CONTACT_TO_EMAIL = Deno.env.get("CONTACT_TO_EMAIL") || "asegurar.limitada@asegurar.com.co";
    const CONTACT_FROM_EMAIL = Deno.env.get("CONTACT_FROM_EMAIL") || "onboarding@resend.dev";

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Servicio de email no configurado." }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Sanitization
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
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
      return new Response(
        JSON.stringify({ error: "Error al enviar el correo." }),
        {
          status: 500,
          headers: { "content-type": "application/json" },
        }
      );
    }

    // Send auto-reply to user
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
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
              <p>${
                isPQR
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

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  } catch (error) {
    // Handle rate limit errors
    if (error instanceof RateLimitError) {
      return new Response(
        JSON.stringify({
          error: "Demasiadas solicitudes. Intenta más tarde.",
          retryAfter: error.result.retryAfter,
        }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            ...getRateLimitHeaders(error.result),
          },
        }
      );
    }

    console.error("send-email error:", error);
    return new Response(
      JSON.stringify({ error: "Error interno del servidor." }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      }
    );
  }
};

// ✅ PR #12: Wrap with CORS middleware
Deno.serve(withCors(handler));
