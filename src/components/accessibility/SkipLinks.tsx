/**
 * Skip Links for Accessibility
 * WCAG 2.1 Level A requirement
 */

export function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Saltar al contenido principal
      </a>
      <a href="#navigation" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Saltar a la navegación
      </a>
    </div>
  );
}
