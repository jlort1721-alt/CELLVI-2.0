/**
 * Security Utilities — CELLVI 2.0
 * Client-side security helpers: CSP reporting, XSS prevention, CSRF tokens
 */

/* ── Input Sanitization ── */
export const sanitizeInput = (input: string): string => {
    const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "/": "&#x2F;",
    };
    return input.replace(/[&<>"'/]/g, (char) => map[char] || char);
};

/* ── URL Validation (prevent open redirect) ── */
export const isValidRedirectUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url, window.location.origin);
        const allowedHosts = [
            window.location.hostname,
            "cellvi.com",
            "www.cellvi.com",
            "asegurar.com.co",
        ];
        return allowedHosts.includes(parsed.hostname);
    } catch {
        return false;
    }
};

/* ── CSRF Token ── */
export const generateCSRFToken = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
};

export const getOrCreateCSRFToken = (): string => {
    const existing = sessionStorage.getItem("csrf_token");
    if (existing) return existing;
    const token = generateCSRFToken();
    sessionStorage.setItem("csrf_token", token);
    return token;
};

/* ── Rate Limiting (client-side) ── */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export const isRateLimited = (key: string, maxRequests = 10, windowMs = 60000): boolean => {
    const now = Date.now();
    const entry = requestCounts.get(key);

    if (!entry || now > entry.resetAt) {
        requestCounts.set(key, { count: 1, resetAt: now + windowMs });
        return false;
    }

    entry.count++;
    return entry.count > maxRequests;
};

/* ── Content Security ── */
export const validateImageSrc = (src: string): boolean => {
    const allowed = [
        /^data:image\/(png|jpeg|gif|webp|svg\+xml);base64,/,
        /^https:\/\/(.*\.)?supabase\.co\//,
        /^https:\/\/(.*\.)?cellvi\.com\//,
        /^\/[^/]/,
    ];
    return allowed.some((pattern) => pattern.test(src));
};

/* ── Session Security ── */
export const detectSessionHijack = (): boolean => {
    const stored = sessionStorage.getItem("session_fingerprint");
    const current = generateFingerprint();

    if (!stored) {
        sessionStorage.setItem("session_fingerprint", current);
        return false;
    }

    return stored !== current;
};

const generateFingerprint = (): string => {
    const data = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join("|");

    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash.toString(36);
};

/* ── Secure Headers Check (development helper) ── */
export const checkSecurityHeaders = async (url: string = "/"): Promise<Record<string, string | null>> => {
    try {
        const res = await fetch(url, { method: "HEAD" });
        return {
            "Content-Security-Policy": res.headers.get("Content-Security-Policy"),
            "X-Content-Type-Options": res.headers.get("X-Content-Type-Options"),
            "X-Frame-Options": res.headers.get("X-Frame-Options"),
            "X-XSS-Protection": res.headers.get("X-XSS-Protection"),
            "Referrer-Policy": res.headers.get("Referrer-Policy"),
            "Permissions-Policy": res.headers.get("Permissions-Policy"),
            "Strict-Transport-Security": res.headers.get("Strict-Transport-Security"),
        };
    } catch {
        return {};
    }
};
