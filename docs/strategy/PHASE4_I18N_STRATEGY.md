# Estrategia Fase 4: Internacionalización (i18n) y Expansión Global

## 1. Objetivo
Transformar CELLVI 2.0 de una aplicación local (Colombia/LATAM) a una plataforma SaaS global, capaz de adaptarse dinámicamente al idioma, moneda y zona horaria del usuario.

## 2. Arquitectura de Localización

### A. Stack Tecnológico
*   **Librería Principal:** `i18next` (Madurez, Ecosistema, Performance).
*   **Integración React:** `react-i18next` (Hooks `useTranslation`, HOCs).
*   **Formato de Recursos:** JSON anidados por "Namespace" (ej: `common`, `dashboard`, `auth`).
    *   *Ventaja:* Permite cargar solo lo necesario (Lazy Loading) en el futuro.

### B. Gestión de Zonas Horarias (Timezones)
*   **Base de Datos:** Todo se guarda en `UTC` (Timestamptz).
*   **Frontend:** Se visualiza en la zona horaria del navegador del usuario (`Intl.DateTimeFormat`).
*   **Reportes:** Se permite seleccionar timezone para reportes diarios (ej: "Día operativo empieza a las 00:00 GMT-5").

### C. Moneda y Unidades
*   **Sistema Métrico:** Default (km, litros, celsius).
*   **Sistema Imperial:** Opción futura (millas, galones, fahrenheit) basada en preferencia de usuario en DB (`user_settings`).
*   **Costos:** Multimoneda (COP, USD, MXN). Se requiere tabla de tasas de cambio (`exchange_rates`) si se hacen conversiones, o simplemente guardar la moneda del tenant.

## 3. Plan de Implementación
1.  Instalar dependencias (`i18next`, etc.).
2.  Configurar instancia global `src/lib/i18n.ts`.
3.  Crear estructura de locales:
    *   `src/locales/es/translation.json` (Español - Source).
    *   `src/locales/en/translation.json` (Inglés).
4.  Refactorizar componentes clave (`Navbar`, `Sidebar`, `Dashboard`).
5.  Agregar selector de idioma en interfaz.

## 4. Estándar de Claves
Usaremos claves semánticas anidadas:
*   `nav.dashboard`
*   `kpi.active_vehicles`
*   `tracking.status.moving`
