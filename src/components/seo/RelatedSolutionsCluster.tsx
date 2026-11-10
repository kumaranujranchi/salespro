import { Link } from 'react-router-dom';

interface RelatedSolutionsClusterProps {
  currentPath: string;
}

interface SolutionItem {
  path: string;
  badge: string;
  title: string;
  anchorText: string;
  description: string;
}

const solutions: SolutionItem[] = [
  {
    path: '/free-real-estate-crm',
    badge: '100% Free Forever',
    title: 'Free Real Estate CRM',
    anchorText: 'Free Real Estate CRM Software',
    description: 'Up to 1,000 active leads and 5 users with zero subscription fee. Meta ads sync and visual deal pipeline.'
  },
  {
    path: '/crm-for-real-estate-brokers',
    badge: 'Brokers & CPs',
    title: 'CRM for Real Estate Brokers',
    anchorText: 'Real Estate Broker CRM & Agent Software',
    description: 'Phone number masking to stop database theft, site visit GPS dispatching, and commission tracking.'
  },
  {
    path: '/real-estate-crm-india',
    badge: 'India Edition',
    title: 'India Real Estate CRM',
    anchorText: 'Real Estate CRM Software in India',
    description: 'Direct webhooks for Magicbricks, 99acres & Housing.com, with native ₹ Lakhs & Crores calculation.'
  },
  {
    path: '/features/lead-management',
    badge: 'Core Feature',
    title: 'Lead Management Engine',
    anchorText: 'Real Estate Lead Management Software',
    description: 'Sub-30s capture, deduplication, round-robin team assignment, and WhatsApp welcome automation.'
  },
  {
    path: '/templates/real-estate-crm-excel-template',
    badge: 'Free Download',
    title: 'Excel CRM & Lead Tracker',
    anchorText: 'Free Real Estate CRM Excel Template',
    description: 'Pre-formatted spreadsheet template with Indian property stages, follow-up alerts, and formula logic.'
  },
  {
    path: '/integration',
    badge: 'Enterprise BYOD',
    title: 'Self-Hosted Database Integration',
    anchorText: 'Enterprise Real Estate Database Integration',
    description: 'Bring your own PostgreSQL or AWS RDS database for 100% data sovereignty behind your private firewall.'
  }
];

export function RelatedSolutionsCluster({ currentPath }: RelatedSolutionsClusterProps) {
  const items = solutions.filter((item) => item.path !== currentPath);

  return (
    <section className="section section--paper section--alt" style={{ padding: '80px 0', borderTop: '1px solid rgba(10,32,24,0.06)' }}>
      <div className="container">
        <header className="sec-head sec-head--center" style={{ marginBottom: '44px' }}>
          <p className="eyebrow" data-reveal style={{ display: 'inline-flex', alignItems: 'center', margin: '0 auto 10px' }}>
            <span className="eyebrow__dot"></span> Explore RealSalePro Platform
          </p>
          <h2 className="sec-head__title" data-reveal data-reveal-delay="60" style={{ fontSize: 'clamp(26px, 3.2vw, 38px)' }}>
            Related Real Estate <em>Solutions &amp; Tools</em>
          </h2>
          <p className="sec-head__lede" data-reveal data-reveal-delay="120" style={{ maxWidth: '640px', margin: '14px auto 0' }}>
            Explore how our integrated CRM modules and free real-estate resources work together to streamline your sales operations.
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}
        >
          {items.map((item, idx) => (
            <Link
              key={item.path}
              to={item.path}
              data-reveal
              data-reveal-delay={idx * 50}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '28px 24px',
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid rgba(10,32,24,0.08)',
                boxShadow: '0 10px 30px rgba(10,32,24,0.04)',
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 16px 40px rgba(16,185,129,0.12)';
                e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(10,32,24,0.04)';
                e.currentTarget.style.borderColor = 'rgba(10,32,24,0.08)';
              }}
            >
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    background: 'rgba(16,185,129,0.1)',
                    color: '#059669',
                    marginBottom: '12px'
                  }}
                >
                  {item.badge}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#0a2018',
                    marginBottom: '10px',
                    lineHeight: 1.3
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: 'var(--muted-light)',
                    lineHeight: 1.6,
                    margin: 0
                  }}
                >
                  {item.description}
                </p>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#059669'
                }}
              >
                <span>{item.anchorText}</span>
                <span style={{ transition: 'transform 0.15s ease' }}>&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
