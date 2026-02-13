# 🔐 Stripe Payment Gateway — Deployment Guide

## 1. Stripe Dashboard Setup

### 1.1 Create Stripe Account
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create account for **ASEGURAR LTDA**
3. Complete identity verification (NIT: 814.006.622-1)
4. Enable **Test Mode** for initial setup

### 1.2 Create Products & Prices
Create 3 subscription products in Stripe Dashboard > Products:

| Product | Monthly Price ID | Yearly Price ID | Monthly COP | Yearly COP |
|---------|-----------------|-----------------|-------------|------------|
| **SMB** | `price_smb_monthly_co` | `price_smb_yearly_co` | $45,000/veh | $432,000/veh |
| **Professional** | `price_pro_monthly_co` | `price_pro_yearly_co` | $38,000/veh | $364,800/veh |
| **Business** | `price_biz_monthly_co` | `price_biz_yearly_co` | $30,000/veh | $288,000/veh |
| **Enterprise** | Custom | Custom | Contact sales | Contact sales |

> **Note:** Yearly prices include 20% discount automatically.

### 1.3 Configure Webhook
1. Go to **Developers > Webhooks**
2. Add endpoint: `https://<YOUR_SUPABASE_URL>/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the **Webhook Signing Secret**

### 1.4 Enable Customer Portal
1. Go to **Settings > Billing > Customer Portal**
2. Enable features:
   - ✅ Update payment method
   - ✅ View invoices
   - ✅ Cancel subscription
   - ✅ Update billing information
3. Set return URL: `https://cellvi.com/platform`

---

## 2. Supabase Edge Function Secrets

### 2.1 Via Supabase Dashboard
1. Go to **Supabase Dashboard > Edge Functions > Secrets**
2. Add the following secrets:

```
STRIPE_SECRET_KEY=<YOUR_STRIPE_LIVE_KEY>
STRIPE_WEBHOOK_SECRET=<YOUR_STRIPE_WEBHOOK_SECRET>
```

### 2.2 Via Supabase CLI (alternative)
```bash
# Set Stripe secret key
supabase secrets set STRIPE_SECRET_KEY=<YOUR_STRIPE_LIVE_KEY>

# Set webhook signing secret
supabase secrets set STRIPE_WEBHOOK_SECRET=<YOUR_STRIPE_WEBHOOK_SECRET>

# Verify secrets are set
supabase secrets list
```

### 2.3 For Testing (Test Mode)
```bash
# Use test keys for development
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 3. Deploy Edge Functions

```bash
# Deploy all payment-related functions
supabase functions deploy create-checkout --no-verify-jwt
supabase functions deploy verify-checkout --no-verify-jwt
supabase functions deploy customer-portal

# The customer-portal function requires JWT verification (it checks auth header manually)
```

---

## 4. Update Price IDs in Code

After creating products in Stripe, update the price IDs in:

**File:** `src/lib/paymentService.ts`

```typescript
const STRIPE_PRICE_MAP: Record<string, Record<string, string>> = {
  smb: {
    monthly: "price_XXXXXXXXXXXXXXXXXX", // Replace with actual Stripe Price ID
    yearly: "price_XXXXXXXXXXXXXXXXXX",
  },
  professional: {
    monthly: "price_XXXXXXXXXXXXXXXXXX",
    yearly: "price_XXXXXXXXXXXXXXXXXX",
  },
  business: {
    monthly: "price_XXXXXXXXXXXXXXXXXX",
    yearly: "price_XXXXXXXXXXXXXXXXXX",
  },
  enterprise: {
    monthly: "price_ent_custom",
    yearly: "price_ent_custom",
  },
};
```

---

## 5. Tax Configuration (IVA Colombia)

### 5.1 Stripe Tax
1. Go to **Settings > Tax**
2. Enable **Stripe Tax** or manual tax
3. Add tax rate:
   - Name: **IVA**
   - Rate: **19%**
   - Country: **Colombia**
   - Type: **Inclusive** or **Exclusive** (we use exclusive)

### 5.2 Tax ID Collection
Already configured in the checkout session — customers can enter their NIT/RUT during checkout.

---

## 6. Colombian Payment Methods

### 6.1 PSE (Pagos Seguros en Línea)
Currently supported via the `getPSEBanks()` function in `paymentService.ts`.
For full PSE integration:
1. Apply for PSE gateway access via ACH Colombia
2. Or use a local payment provider (e.g., Wompi, PayU, MercadoPago)

### 6.2 Nequi / Bancolombia à la Mano
These can be integrated via:
- **Wompi** (Colombian payment gateway, supports Nequi + PSE)
- **MercadoPago** (supports multiple LATAM payment methods)

---

## 7. Testing Checklist

- [ ] Test mode keys configured in Supabase secrets
- [ ] Checkout flow works end-to-end (create session → redirect → complete)
- [ ] Webhook receives events correctly
- [ ] Customer portal accessible and functional
- [ ] Rate limiting working (5 req/min for checkout)
- [ ] Error handling for missing/invalid inputs
- [ ] Tax calculation correct (19% IVA for CO)
- [ ] Production keys swapped after testing

---

## 8. Rate Limiting Configuration

All payment Edge Functions include rate limiting:

| Function | Limit | Window |
|----------|-------|--------|
| `create-checkout` | 5 req | 1 min |
| `verify-checkout` | 20 req | 1 min |
| `customer-portal` | 10 req | 1 min |

Response headers include:
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`
- `Retry-After` (when limit exceeded)

---

## 9. Security Notes

- ✅ **Rate limiting** on all endpoints
- ✅ **Input validation** (email format, quantity range, sessionId format)
- ✅ **Open redirect prevention** (customer-portal validates returnUrl against allowed hosts)
- ✅ **CORS headers** configured
- ✅ **JWT auth** required for customer-portal
- ✅ **Stripe Checkout** handles PCI compliance (no card data touches our servers)
