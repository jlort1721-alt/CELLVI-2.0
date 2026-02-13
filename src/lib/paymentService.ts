// ===== PAYMENT GATEWAY SERVICE =====
// Abstraction layer for payment processing.
// Currently integrates Stripe. Can be swapped to MercadoPago, PSE, etc.

export type PaymentProvider = "stripe" | "pse" | "nequi" | "bancolombia";

export interface CheckoutSession {
    id: string;
    url: string;
    status: "pending" | "completed" | "failed" | "expired";
    provider: PaymentProvider;
    amountCents: number;
    currency: string;
    customerEmail: string;
    planKey: string;
    billingPeriod: "monthly" | "yearly";
    createdAt: string;
}

export interface PaymentResult {
    success: boolean;
    sessionId: string;
    error?: string;
}

// Stripe price IDs — mapped from tier keys
// In production, these come from Stripe Dashboard > Products
const STRIPE_PRICE_MAP: Record<string, Record<string, string>> = {
    smb: {
        monthly: "price_smb_monthly_co",
        yearly: "price_smb_yearly_co",
    },
    professional: {
        monthly: "price_pro_monthly_co",
        yearly: "price_pro_yearly_co",
    },
    business: {
        monthly: "price_biz_monthly_co",
        yearly: "price_biz_yearly_co",
    },
    enterprise: {
        monthly: "price_ent_custom",
        yearly: "price_ent_custom",
    },
};

// ===== Supabase Edge Function integration =====
// The actual Stripe checkout session creation happens on the server
// via a Supabase Edge Function for security (no Stripe Secret Key on client)

import { supabase } from "@/integrations/supabase/client";

export const paymentService = {
    /**
     * Create a Stripe Checkout Session via Supabase Edge Function.
     * Returns a URL to redirect the user to Stripe's hosted checkout.
     */
    createCheckoutSession: async (params: {
        planKey: string;
        billingPeriod: "monthly" | "yearly";
        vehicleCount: number;
        customerEmail: string;
        countryCode: string;
        successUrl?: string;
        cancelUrl?: string;
    }): Promise<{ url: string; sessionId: string } | { error: string }> => {
        try {
            const priceId = STRIPE_PRICE_MAP[params.planKey]?.[params.billingPeriod];
            if (!priceId) {
                return { error: "Plan o periodo de facturación no válido" };
            }

            // If enterprise, redirect to contact form
            if (params.planKey === "enterprise") {
                return {
                    url: "/#contact",
                    sessionId: "enterprise_custom",
                };
            }

            const { data, error } = await supabase.functions.invoke("create-checkout", {
                body: {
                    priceId,
                    quantity: params.vehicleCount,
                    customerEmail: params.customerEmail,
                    metadata: {
                        planKey: params.planKey,
                        billingPeriod: params.billingPeriod,
                        countryCode: params.countryCode,
                        vehicleCount: params.vehicleCount,
                    },
                    successUrl: params.successUrl || `${window.location.origin}/platform?checkout=success`,
                    cancelUrl: params.cancelUrl || `${window.location.origin}/#pricing`,
                },
            });

            if (error) {
                console.error("[PaymentService] Checkout error:", error);
                return { error: error.message || "Error al crear sesión de pago" };
            }

            return {
                url: data.url,
                sessionId: data.sessionId,
            };
        } catch (err) {
            console.error("[PaymentService] Unexpected error:", err);
            return { error: err instanceof Error ? err.message : "Error inesperado" };
        }
    },

    /**
     * Verify a checkout session status (after redirect back from Stripe)
     */
    verifySession: async (sessionId: string): Promise<CheckoutSession | null> => {
        try {
            const { data, error } = await supabase.functions.invoke("verify-checkout", {
                body: { sessionId },
            });

            if (error || !data) return null;
            return data as CheckoutSession;
        } catch {
            return null;
        }
    },

    /**
     * Get the Stripe Customer Portal URL for managing subscriptions
     */
    getCustomerPortalUrl: async (): Promise<string | null> => {
        try {
            const { data, error } = await supabase.functions.invoke("customer-portal", {
                body: { returnUrl: `${window.location.origin}/platform` },
            });

            if (error || !data?.url) return null;
            return data.url;
        } catch {
            return null;
        }
    },

    /**
     * Get available PSE banks (for Colombian payment method)
     */
    getPSEBanks: async (): Promise<Array<{ code: string; name: string }>> => {
        // In production, this fetches from the PSE API via Supabase Edge Function
        return [
            { code: "1007", name: "Bancolombia" },
            { code: "1051", name: "Davivienda" },
            { code: "1001", name: "Banco de Bogotá" },
            { code: "1023", name: "Banco de Occidente" },
            { code: "1019", name: "Scotiabank Colpatria" },
            { code: "1002", name: "Banco Popular" },
            { code: "1013", name: "BBVA Colombia" },
            { code: "1507", name: "Nequi" },
            { code: "1801", name: "Bancolombia a la Mano (Ahorro)" },
        ];
    },

    /**
     * Generate pricing estimate based on plan, vehicles, and add-ons
     */
    calculateEstimate: (params: {
        planKey: string;
        vehicleCount: number;
        billingPeriod: "monthly" | "yearly";
        addOns: string[];
        countryCode: string;
    }): { subtotal: number; discount: number; tax: number; total: number; currency: string } => {
        // Base price map (simplified — uses pricingData in production)
        const basePrices: Record<string, number> = {
            smb: 45000,
            professional: 38000,
            business: 30000,
            enterprise: 0,
        };

        const addOnPrices: Record<string, number> = {
            video: 18000,
            evidence: 12000,
            coldchain: 15000,
            support247: 350000, // flat fee
        };

        const basePerVehicle = basePrices[params.planKey] || 0;
        let subtotal = basePerVehicle * params.vehicleCount;

        // Add add-ons
        params.addOns.forEach((addon) => {
            const price = addOnPrices[addon];
            if (price) {
                subtotal += addon === "support247" ? price : price * params.vehicleCount;
            }
        });

        // Yearly discount (20%)
        const yearlyMultiplier = params.billingPeriod === "yearly" ? 12 : 1;
        const discount = params.billingPeriod === "yearly" ? subtotal * yearlyMultiplier * 0.2 : 0;
        const afterDiscount = subtotal * yearlyMultiplier - discount;

        // Tax (19% IVA for Colombia)
        const taxRate = params.countryCode === "CO" ? 0.19 : 0;
        const tax = Math.round(afterDiscount * taxRate);

        return {
            subtotal: subtotal * yearlyMultiplier,
            discount: Math.round(discount),
            tax,
            total: Math.round(afterDiscount + tax),
            currency: params.countryCode === "CO" ? "COP" : "USD",
        };
    },
};
