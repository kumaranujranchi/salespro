import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { landingHtml } from './landingHtml';
import { initLandingInteractions } from './landingInteractions';
import { WebsiteWhatsAppWidget } from '../components/whatsapp/WebsiteWhatsAppWidget';
import '../styles/landing.css';

export function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Activate landing page scoped CSS and reveal animations
    document.body.classList.add('landing-page-active');
    document.documentElement.classList.add('js');

    // 2. Initialize all interactive UI components
    const cleanupInteractions = initLandingInteractions();

    // 3. Intercept internal navigation links for seamless SPA routing
    const handleLinkClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Smooth scroll for anchor links
      if (href.startsWith('#')) {
        if (href === '#top') {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        const targetEl = document.querySelector(href);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      // Allow external links (WhatsApp, Socials, Mailto, Tel) to work natively
      if (
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('https://wa.me') ||
        href.includes('facebook.com') ||
        href.includes('linkedin.com')
      ) {
        return;
      }

      // Route internal links through React Router
      let routePath = '';
      if (href.startsWith('/')) {
        routePath = href;
      } else if (href.startsWith('https://realsalepro.com/')) {
        routePath = href.replace('https://realsalepro.com', '');
      }

      if (
        routePath &&
        !routePath.startsWith('/assets') &&
        !routePath.startsWith('/images')
      ) {
        e.preventDefault();
        navigate(routePath);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('click', handleLinkClick);
    }

    return () => {
      cleanupInteractions();
      if (container) {
        container.removeEventListener('click', handleLinkClick);
      }
      document.body.classList.remove('landing-page-active');
      document.documentElement.classList.remove('js');
    };
  }, [navigate]);

  return (
    <>
      <div
        ref={containerRef}
        className="realsalepro-landing-wrapper"
        dangerouslySetInnerHTML={{ __html: landingHtml }}
      />
      <WebsiteWhatsAppWidget />
    </>
  );
}
