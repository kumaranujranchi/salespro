import { Link } from 'react-router-dom';
import { Home, Search, FileSpreadsheet, Tag, Mail } from 'lucide-react';
import { SEOHead } from '../components/seo/SEOHead';
import { PublicShell } from '../components/public/PublicShell';

const QUICK_LINKS = [
  { to: '/', icon: Home, title: 'Homepage', sub: 'RealSalePro CRM overview' },
  { to: '/free-real-estate-crm', icon: Search, title: 'Free CRM', sub: '1,000 leads free forever' },
  { to: '/pricing', icon: Tag, title: 'Pricing & Plans', sub: 'Transparent Indian pricing' },
  { to: '/templates/real-estate-crm-excel-template', icon: FileSpreadsheet, title: 'Excel Template', sub: 'Free spreadsheet tracker' },
];

export function NotFoundPage() {
  return (
    <>
      <SEOHead
        title="404: Page Not Found | RealSalePro"
        description="The page you are looking for does not exist or has been moved. Explore RealSalePro's free real estate CRM tools, pricing, and features."
        canonicalUrl="https://realsalepro.com/404"
        noindex={true}
      />
      <PublicShell>
        <section className="hero pp-status">
          <div className="hero__bg" aria-hidden="true">
            <div className="hero__grid"></div>
            <div className="hero__glow hero__glow--a"></div>
            <div className="hero__glow hero__glow--b"></div>
          </div>
          <div className="container pp-hero__inner">
            <p className="eyebrow hero__eyebrow">
              <span className="eyebrow__dot"></span> Error 404
            </p>
            <div className="pp-status__code" aria-hidden="true">404</div>
            <h1 className="hero__title pp-hero__title">Page <em>Not Found</em></h1>
            <p className="hero__lede pp-hero__lede">
              We couldn't find the page you're looking for. It might have been moved, renamed, or is temporarily unavailable.
            </p>

            <div className="pp-links">
              {QUICK_LINKS.map(({ to, icon: Icon, title, sub }) => (
                <Link key={to} to={to} className="pp-link">
                  <span className="pp-icon"><Icon /></span>
                  <span className="pp-link__text">
                    <span className="pp-link__title">{title}</span>
                    <span className="pp-link__sub">{sub}</span>
                  </span>
                  <svg className="icon pp-link__arrow" aria-hidden="true"><use href="#i-arrow" /></svg>
                </Link>
              ))}
            </div>

            <div className="pp-hero__extra">
              <Link to="/" className="btn btn--primary btn--lg">
                <Home size={17} /> <span>Return to Homepage</span>
              </Link>
              <Link to="/contact" className="btn btn--ghost btn--lg">
                <Mail size={17} /> <span>Contact Support</span>
              </Link>
            </div>
          </div>
        </section>
      </PublicShell>
    </>
  );
}
