/**
 * Skip Links Component
 * Provides keyboard navigation shortcuts to main content areas
 * WCAG 2.1 Success Criterion 2.4.1 (Bypass Blocks)
 */

import React from 'react';

export interface SkipLink {
  id: string;
  label: string;
  target: string;
}

const defaultSkipLinks: SkipLink[] = [
  { id: 'skip-main', label: 'Saltar al contenido principal', target: '#main-content' },
  { id: 'skip-nav', label: 'Saltar a navegación', target: '#main-navigation' },
  { id: 'skip-search', label: 'Saltar a búsqueda', target: '#search-input' },
  { id: 'skip-footer', label: 'Saltar al pie de página', target: '#footer' },
];

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

export const SkipLinks: React.FC<SkipLinksProps> = ({
  links = defaultSkipLinks,
  className = '',
}) => {
  const handleSkipLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();

    const target = document.querySelector(targetId);
    if (!target) {
      console.warn(`Skip link target not found: ${targetId}`);
      return;
    }

    // Set focus to target element
    if (target instanceof HTMLElement) {
      target.focus();

      // If target is not naturally focusable, temporarily make it focusable
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener(
          'blur',
          () => {
            target.removeAttribute('tabindex');
          },
          { once: true }
        );
      }

      // Smooth scroll to target
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <div
      className={`skip-links ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={link.target}
          onClick={(e) => handleSkipLinkClick(e, link.target)}
          className="skip-link"
          style={{
            position: 'absolute',
            left: '-10000px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            // Styles when focused (visible)
          }}
          onFocus={(e) => {
            const el = e.currentTarget;
            el.style.position = 'static';
            el.style.left = 'auto';
            el.style.width = 'auto';
            el.style.height = 'auto';
            el.style.overflow = 'visible';
            el.style.padding = '0.75rem 1rem';
            el.style.backgroundColor = 'hsl(var(--primary))';
            el.style.color = 'hsl(var(--primary-foreground))';
            el.style.textDecoration = 'none';
            el.style.fontWeight = '600';
            el.style.fontSize = '0.875rem';
            el.style.borderRadius = '0.375rem';
            el.style.margin = '0.5rem';
            el.style.display = 'inline-block';
            el.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
          }}
          onBlur={(e) => {
            const el = e.currentTarget;
            el.style.position = 'absolute';
            el.style.left = '-10000px';
            el.style.width = '1px';
            el.style.height = '1px';
            el.style.overflow = 'hidden';
            el.style.padding = '';
            el.style.backgroundColor = '';
            el.style.color = '';
            el.style.textDecoration = '';
            el.style.fontWeight = '';
            el.style.fontSize = '';
            el.style.borderRadius = '';
            el.style.margin = '';
            el.style.display = '';
            el.style.boxShadow = '';
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

/**
 * Helper to mark content areas as skip link targets
 * Usage: <main id="main-content" tabIndex={-1}>...</main>
 */
export const useSkipTarget = (id: string) => {
  return {
    id,
    tabIndex: -1,
  };
};
