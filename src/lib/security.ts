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
/**
 * Detect potential session hijacking by comparing browser fingerprints
 * PR #14: Now async due to crypto.subtle usage
 */
export const detectSessionHijack = async (): Promise<boolean> => {
    const stored = sessionStorage.getItem("session_fingerprint");
    const current = await generateFingerprint();

    if (!stored) {
        sessionStorage.setItem("session_fingerprint", current);
        return false;
    }

    const fingerprintChanged = stored !== current;

    if (fingerprintChanged) {
        console.warn("[Security] Session fingerprint mismatch detected");
        // Optional: Send alert to backend
        // await reportSecurityEvent("fingerprint_mismatch");
    }

    return fingerprintChanged;
};

/**
 * Generate cryptographically strong browser fingerprint
 * PR #14: Enhanced with Web Crypto API for higher entropy
 */
const generateFingerprint = async (): Promise<string> => {
    // Collect multiple browser characteristics for higher entropy
    const data = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        languages: navigator.languages?.join(",") || "",
        screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth,
            pixelRatio: window.devicePixelRatio,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency,
        maxTouchPoints: navigator.maxTouchPoints,
        // Canvas fingerprint (high entropy)
        canvas: getCanvasFingerprint(),
        // WebGL fingerprint (high entropy)
        webgl: getWebGLFingerprint(),
    };

    const dataString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(dataString);

    // Use Web Crypto API for SHA-256 hashing
    try {
        const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        return hashHex;
    } catch (error) {
        console.error("Crypto fingerprint failed, using fallback:", error);
        // Fallback to simple hash if crypto.subtle not available
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return hash.toString(36);
    }
};

/**
 * Generate canvas fingerprint (high entropy, device-specific)
 */
const getCanvasFingerprint = (): string => {
    try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return "";

        canvas.width = 200;
        canvas.height = 50;

        // Draw text with specific font
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("Browser Fingerprint", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("Security Feature", 4, 17);

        return canvas.toDataURL().slice(-50); // Last 50 chars for uniqueness
    } catch (error) {
        return "";
    }
};

/**
 * Generate WebGL fingerprint (GPU-specific)
 */
const getWebGLFingerprint = (): string => {
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) return "";

        const debugInfo = (gl as any).getExtension("WEBGL_debug_renderer_info");
        if (!debugInfo) return "";

        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

        return `${vendor}|${renderer}`;
    } catch (error) {
        return "";
    }
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
