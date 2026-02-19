# ASEGURAR LTDA -- Fleet Management Platform

A comprehensive fleet management and logistics platform built for real-time monitoring, regulatory compliance (RNDC/PESV), predictive maintenance, and operational security. Designed as a multi-tenant SaaS application with offline-first PWA capabilities.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 18, TypeScript 5, Vite 5, Tailwind CSS 3, Radix UI (shadcn/ui) |
| **State** | Zustand 5, TanStack React Query 5 |
| **Backend** | Supabase (PostgreSQL + PostGIS + RLS), Edge Functions (Deno) |
| **Maps** | Leaflet + MarkerCluster (imperative), react-leaflet, Leaflet Draw, leaflet.heat |
| **Charts** | Recharts 2 |
| **3D** | Three.js + React Three Fiber / Drei |
| **AI/Vision** | MediaPipe (face mesh, fatigue detection), OpenAI, Anthropic SDK |
| **i18n** | i18next + react-i18next (Spanish / English, bundled JSON) |
| **Testing** | Vitest + Testing Library (unit), Playwright (E2E, 5 browsers) |
| **PWA** | vite-plugin-pwa + Workbox (offline support, push notifications) |
| **Monitoring** | Sentry (errors), LogRocket (session replay) |
| **Validation** | Zod, React Hook Form |
| **Deployment** | Vercel (auto-deploy from `main` branch) |

## Project Structure

```text
src/
├── assets/            # Images (WebP optimized, ~54% size reduction)
├── components/        # Shared UI components
│   ├── accessibility/ # Skip links, ARIA live regions
│   ├── layout/        # PlatformSidebar, PlatformHeader
│   ├── pwa/           # Install prompt, push notifications
│   └── ui/            # Radix UI primitives (Button, Dialog, Select, etc.)
├── config/            # Module registry, environment config
├── features/          # Feature-based modules
│   ├── admin/         # Admin panel, billing, user management
│   ├── ai/            # AI chatbot, route optimizer, fatigue monitor
│   ├── asegurar-ia/   # Asegurar IA dashboard
│   ├── compliance/    # Compliance dashboard (RNDC/PESV)
│   ├── control/       # Policy engine, GNSS security, audit log, reports
│   ├── fleet/         # Routes, geofences, drivers, asset detail, predictive maintenance
│   ├── monitoring/    # Fleet overview, live map, alerts, evidence verifier
│   └── operations/    # Fuel management, cold chain, connectivity
├── hooks/             # Custom React hooks
├── lib/               # Utilities (i18n, security, formatting, pagination)
├── locales/           # Translation files (es.json, en.json)
├── pages/             # Route-level pages
├── stores/            # Zustand stores (uiStore, notificationStore, mapStore)
└── test/              # Test setup and utilities
```

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** (included with Node.js)
- A **Supabase** project (with PostGIS extension enabled)

### Installation

```bash
# Clone the repository
git clone https://github.com/jlort1721-alt/CELLVI-2.0.git
cd CELLVI-2.0

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional
VITE_USE_MOCK_DATA=true          # Enable demo data fallback
VITE_SENTRY_DSN=your-sentry-dsn  # Sentry error tracking
VITE_LOGROCKET_ID=your-id        # LogRocket session replay
```

### Development

```bash
# Start the dev server (http://localhost:8088)
npm run dev

# Type-check without emitting
npx tsc --noEmit

# Lint
npm run lint
```

### Build

```bash
# Production build (Vite + Terser minification)
npm run build

# Development build (unminified, with source maps)
npm run build:dev

# Preview the production build locally
npm run preview
```

### Testing

```bash
# Run unit tests (Vitest)
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run E2E tests (Playwright, 5 browsers)
npm run test:e2e

# Run E2E tests with interactive UI
npm run test:e2e:ui

# Run all tests (unit + E2E)
npm run test:all
```

## Architecture Decisions

### Module Registry

Dashboard modules are registered in `src/config/moduleRegistry.tsx` and lazy-loaded on demand. Each module declares its route, icon, permissions, and component. This pattern keeps the main bundle small while supporting dozens of feature modules.

### Feature-Based Directory Structure

Code is organized by business domain (`features/fleet/`, `features/monitoring/`, etc.) rather than by file type. Each feature folder contains its own components, hooks, and utilities, making it straightforward to locate and modify related code.

### Performance

- **React.memo + useMemo + useCallback** on all dashboard components to minimize re-renders.
- **Virtual scrolling** via `@tanstack/react-virtual` for tables with 10,000+ rows.
- **Map clustering** with imperative `L.MarkerClusterGroup` for handling large marker sets.
- **WebP images** throughout, reducing asset size by approximately 54%.
- **Code splitting** per module; vendor chunks are split by domain (three.js, export utilities, etc.).

### Offline Support (PWA)

The application is a Progressive Web App powered by Workbox. Network-first caching with a 7-day offline fallback ensures field operators can perform inspections and report incidents even without connectivity.

### Security

- **Row Level Security (RLS)** in Supabase for multi-tenant data isolation.
- **Content Security Policy** headers configured in `vite.config.ts`.
- **Zod validation** on all form inputs and API boundaries.
- **Module-level error boundaries** with automatic reset on route navigation.

### Internationalization

All user-facing strings use `t(key)` from i18next. Translations live in `src/locales/es.json` (Spanish) and `src/locales/en.json` (English) and are bundled at build time (no HTTP fetches at runtime). Language detection is automatic via `i18next-browser-languagedetector`.

## Platform Modules

| Module | Path | Description |
| --- | --- | --- |
| **Command Center** | `/dashboard` | Unified fleet view, critical alerts, real-time KPIs |
| **Fleet Management** | `/platform/fleet` | Routes, geofences, drivers, asset details, predictive maintenance |
| **Live Monitoring** | `/platform/monitoring` | Fleet map, alert timeline, evidence verifier |
| **Operations** | `/platform/operations` | Fuel analytics, cold chain tracking, connectivity status |
| **Compliance** | `/platform/compliance` | RNDC manifests, PESV audits, driver document management |
| **Security & Audit** | `/platform/control` | GNSS threat detection, policy engine, immutable audit log |
| **Reports** | `/platform/reports` | Fuel efficiency, operational costs, fleet performance |
| **AI Features** | `/platform/ai` | Chatbot, route optimization, fatigue detection (MediaPipe) |
| **Admin** | `/platform/admin` | User management, billing, tenant configuration |

## License

This software is proprietary. Unauthorized distribution is prohibited.
