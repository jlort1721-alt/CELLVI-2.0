# Contributing to ASEGURAR LTDA (CELLVI 2.0)

Thank you for your interest in contributing to the ASEGURAR LTDA platform. This guide will help you get set up and follow our coding conventions.

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (bundled with Node.js 18)
- A Supabase project for local development (or use mock data)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/jlort1721-alt/CELLVI-2.0.git
   cd CELLVI-2.0
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Open `.env` and fill in your Supabase credentials. If you do not have a Supabase project, set `VITE_USE_MOCK_DATA=true` to use demo data.

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173` (or the next available port).

## Project Structure

The codebase follows a **feature-based directory structure**:

```
src/
  components/     # Shared/reusable UI components
  config/         # App configuration (env, constants)
  features/       # Feature modules (each with its own components, hooks, utils)
    ai/
    analytics/
    compliance/
    dashboard/
    fleet/
    ...
  hooks/          # Shared custom hooks
  integrations/   # Third-party service integrations (Supabase, etc.)
  lib/            # Utility libraries (i18n, helpers)
  locales/        # Translation files (es.json, en.json)
  pages/          # Top-level route pages
  stores/         # Zustand state stores
  test/           # Test setup and utilities
```

New functionality should go inside the appropriate `features/` subdirectory. Only truly shared code belongs in top-level `components/`, `hooks/`, or `lib/`.

## Code Style Conventions

### React Components

- **Wrap all dashboard components with `React.memo`** to prevent unnecessary re-renders. Use `useMemo` and `useCallback` for expensive computations and callbacks.

  ```tsx
  const MyDashboard = React.memo(function MyDashboard() {
    // ...
  });
  export default MyDashboard;
  ```

### Internationalization (i18n)

- **All user-facing strings must use `useTranslation`** from `react-i18next`. Never hardcode display text.

  ```tsx
  import { useTranslation } from 'react-i18next';

  function MyComponent() {
    const { t } = useTranslation();
    return <h1>{t('myFeature.title')}</h1>;
  }
  ```

- When adding new strings, **add keys to BOTH** `src/locales/es.json` and `src/locales/en.json`. Every key must exist in both files.

### Imports

- **No barrel imports for `lucide-react`**. Import each icon directly by name:

  ```tsx
  // Correct
  import { Truck, AlertTriangle } from 'lucide-react';

  // Incorrect - do NOT use barrel re-exports or wildcard imports
  import * as Icons from 'lucide-react';
  ```

### Documentation

- **Add JSDoc comments to all exported interfaces and functions**:

  ```tsx
  /**
   * Calculates the risk score for a vehicle based on its telemetry data.
   * @param vehicle - The vehicle record with latest telemetry
   * @returns A score between 0 and 100 (higher = more risk)
   */
  export function calculateRiskScore(vehicle: Vehicle): number {
    // ...
  }
  ```

### State Management

- Use **Zustand** for global state (`uiStore`, `notificationStore`, `mapStore`).
- Use **React Query** (`@tanstack/react-query`) for server state and caching.
- Local component state is fine for UI-only concerns.

### Performance

- Use `@tanstack/react-virtual` for lists with 1,000+ items.
- Map markers use imperative `L.MarkerClusterGroup` (not react-leaflet-cluster).
- Avoid `useMemo` for side effects; use `useEffect` instead.

## Testing Requirements

All three checks below **must pass** before opening a PR:

### 1. Unit Tests (Vitest)

```bash
npm run test
```

Runs the Vitest test suite. Place test files next to the code they test (e.g., `MyComponent.test.tsx`) or inside `src/test/`.

### 2. End-to-End Tests (Playwright)

```bash
# First-time setup (downloads browsers)
npx playwright install

# Run E2E tests
npx playwright test

# Run with UI for debugging
npx playwright test --ui
```

### 3. Type Check (TypeScript)

```bash
npx tsc --noEmit
```

Ensures the entire codebase type-checks without errors.

### Run All Checks at Once

```bash
npm run test:all
```

This runs unit tests and E2E tests sequentially. Run `npx tsc --noEmit` separately.

## Commit Message Format

We follow **Conventional Commits**:

```
<type>: <short description>
```

### Types

| Type         | Use When                                      |
|------------- |-----------------------------------------------|
| `feat:`      | Adding a new feature                          |
| `fix:`       | Fixing a bug                                  |
| `docs:`      | Documentation changes only                    |
| `refactor:`  | Code restructuring without behavior change    |
| `test:`      | Adding or updating tests                      |
| `style:`     | Formatting, whitespace, missing semicolons    |
| `chore:`     | Build config, dependencies, tooling           |
| `perf:`      | Performance improvements                      |

### Examples

```
feat: Add cold chain temperature alerts dashboard
fix: Correct GPS coordinate parsing for fleet map
docs: Update API integration guide
refactor: Extract shared chart config into useChartDefaults hook
test: Add unit tests for risk score calculation
```

## Pull Request Process

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feat/my-feature
   ```

2. **Make your changes**, following the conventions above.

3. **Run all checks** before pushing:

   ```bash
   npm run test
   npx playwright test
   npx tsc --noEmit
   ```

4. **Push your branch** and open a PR against `main`:

   ```bash
   git push -u origin feat/my-feature
   ```

5. **In your PR description**, include:
   - A summary of what changed and why
   - Screenshots or screen recordings for UI changes
   - Any new i18n keys added (confirm both `es.json` and `en.json` updated)

6. **Wait for review**. Address any feedback and keep your branch up to date with `main`.

## i18n Guidelines

Translations are bundled at build time (not fetched via HTTP). The translation files are:

- `src/locales/es.json` -- Spanish (primary)
- `src/locales/en.json` -- English

### Rules

1. **Every user-visible string** must use a translation key via `t()`.
2. **Add keys to both files** simultaneously. A missing key in either file is a bug.
3. Use **dot-separated nested keys** that match the feature structure:
   ```json
   {
     "coldChain": {
       "alerts": {
         "title": "Alertas de Temperatura",
         "noData": "Sin datos disponibles"
       }
     }
   }
   ```
4. Keep keys descriptive and scoped to their feature area.
5. Never reuse keys across unrelated features to avoid unexpected side effects when updating translations.

## Environment Variables

See `.env.example` for all available configuration options. Key points:

- **AI API keys are server-side only.** Never add `VITE_OPENAI_API_KEY` or `VITE_ANTHROPIC_API_KEY` to `.env`. AI calls go through the Supabase Edge Function proxy.
- Set `VITE_USE_MOCK_DATA=true` for local development without a Supabase project.
- See `src/config/env.ts` for the full typed configuration.

## Questions?

If you have questions about the codebase or contribution process, open a GitHub issue with the `question` label.
