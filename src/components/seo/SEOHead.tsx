import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalUrl: string;
  keywords?: string;
  jsonLd?: Record<string, any>;
  noindex?: boolean;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

export function SEOHead({
  title,
  description,
  canonicalUrl,
  keywords,
  jsonLd,
  noindex = false,
  ogImage = 'https://realsalepro.com/images/realsalepro-og-share.png',
  twitterCard = 'summary',
}: SEOHeadProps) {
  useEffect(() => {
    // 1. Title
    document.title = title;

    // 2. Meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.setAttribute('name', 'description');
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute('content', description);

    // 3. Meta robots (Handle noindex vs index)
    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute(
      'content',
      noindex
        ? 'noindex, follow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'
    );

    // 4. Meta keywords
    if (keywords) {
      let kwMeta = document.querySelector('meta[name="keywords"]');
      if (!kwMeta) {
        kwMeta = document.createElement('meta');
        kwMeta.setAttribute('name', 'keywords');
        document.head.appendChild(kwMeta);
      }
      kwMeta.setAttribute('content', keywords);
    }

    // 5. Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // 6. OpenGraph
    const updateOg = (prop: string, val: string) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', prop);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    updateOg('og:title', title);
    updateOg('og:description', description);
    updateOg('og:url', canonicalUrl);
    updateOg('og:image', ogImage);
    updateOg('og:image:secure_url', ogImage);

    // 7. Twitter
    const updateTwitter = (name: string, val: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('name', name);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    updateTwitter('twitter:card', twitterCard);
    updateTwitter('twitter:title', title);
    updateTwitter('twitter:description', description);
    updateTwitter('twitter:image', ogImage);
    updateTwitter('twitter:site', '@realsalepro');

    // 8. JSON-LD Structured Data
    let scriptEl = document.getElementById('page-jsonld');
    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = 'page-jsonld';
        scriptEl.setAttribute('type', 'application/ld+json');
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else if (scriptEl) {
      scriptEl.remove();
    }

    // Scroll to top on page mount
    window.scrollTo({ top: 0, behavior: 'instant' as any });

    return () => {
      const el = document.getElementById('page-jsonld');
      if (el) el.remove();
    };
  }, [title, description, canonicalUrl, keywords, jsonLd, noindex, ogImage, twitterCard]);

  return null;
}

