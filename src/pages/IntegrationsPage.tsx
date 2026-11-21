import type { CSSProperties } from 'react';
import { Database, Server, Shield, CheckCircle, ArrowRight, Lock, Globe, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEOHead } from '../components/seo/SEOHead';
import { PublicShell, PublicHero } from '../components/public/PublicShell';

const accent = (color: string) => ({ '--pp-accent': color }) as CSSProperties;

export function IntegrationsPage() {
  const integrationSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": "https://realsalepro.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Enterprise BYOD Integration",
            "item": "https://realsalepro.com/integration"
          }
        ]
      },
      {
        "@type": "WebPage",
        "@id": "https://realsalepro.com/integration#webpage",
        "url": "https://realsalepro.com/integration",
        "name": "Enterprise BYOD Database Integration | RealSalePro",
        "description": "Host your real estate CRM database on your private PostgreSQL or cloud infrastructure with RealSalePro's Bring Your Own Database (BYOD) architecture.",
        "isPartOf": { "@id": "https://realsalepro.com/#website" }
      }
    ]
  };

  return (
    <>
      <SEOHead
        title="Enterprise BYOD Database Integration | RealSalePro"
        description="Host your real estate CRM database on your private PostgreSQL or cloud infrastructure with RealSalePro's Bring Your Own Database (BYOD) architecture."
        canonicalUrl="https://realsalepro.com/integration"
        keywords="byod crm database, self hosted real estate crm, postgresql real estate crm, enterprise real estate crm"
        jsonLd={integrationSchema}
      />
      <PublicShell>
        {/* Hero Section */}
        <PublicHero
          eyebrow="Bring Your Own Database (BYOD)"
          title={<>Complete Data <em>Sovereignty</em></>}
          lede="RealSalePro offers enterprise-grade database integrations, allowing you to host your data on your own private servers while using our powerful interface."
        />

        {/* Overview Section */}
        <section className="section section--dark pp-section" style={{ paddingTop: 24 }}>
          <div className="container">
            <div className="pp-split pp-split--even">
              <div>
                <h2 className="pp-h2" data-reveal>Why <em>Self-Hosted</em> Database?</h2>
                <div className="pp-steps" style={{ marginTop: 32, gap: 26 }}>
                  <div className="pp-feature" data-reveal>
                    <span className="pp-icon"><Shield /></span>
                    <div>
                      <h3>100% Data Ownership</h3>
                      <p>
                        You retain full legal and physical ownership of your data. RealSalePro acts as a client connecting to your instance. We never store your raw database files.
                      </p>
                    </div>
                  </div>
                  <div className="pp-feature" data-reveal data-reveal-delay="40">
                    <span className="pp-icon"><Lock /></span>
                    <div>
                      <h3>Enhanced Security</h3>
                      <p>
                        Your database sits behind your firewalls. You control the access credentials and can revoke our access at any time without data loss.
                      </p>
                    </div>
                  </div>
                  <div className="pp-feature" data-reveal data-reveal-delay="80">
                    <span className="pp-icon"><Globe /></span>
                    <div>
                      <h3>Compliance Ready</h3>
                      <p>
                        Ideal for organizations in regulated industries requiring strict data isolation and on-premise storage solutions.
                      </p>
                    </div>
                  </div>
                  <div className="pp-feature" data-reveal data-reveal-delay="120">
                    <span className="pp-icon"><Cpu /></span>
                    <div>
                      <h3>Incentive Automation</h3>
                      <p>
                        Unlocks the powerful Custom Incentive Engine. Standard hosted plans are limited to Manual Incentives only.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pp-card" data-reveal data-reveal-delay="80">
                <h3 style={{ fontSize: 22 }}>Integration Workflow</h3>
                <div className="pp-steps" style={{ marginTop: 24 }}>
                  <div className="pp-step">
                    <span className="pp-step__num">1</span>
                    <div className="pp-step__body pp-channel" style={{ padding: 16 }}>
                      <div>
                        <h2>Setup Database</h2>
                        <p>Launch PostgreSQL on your VPS</p>
                      </div>
                    </div>
                  </div>
                  <div className="pp-step">
                    <span className="pp-step__num">2</span>
                    <div className="pp-step__body pp-channel" style={{ padding: 16 }}>
                      <div>
                        <h2>Whitelist IP</h2>
                        <p>Allow our Static IP (34.x.x.x) access</p>
                      </div>
                    </div>
                  </div>
                  <div className="pp-step">
                    <span className="pp-step__num">3</span>
                    <div className="pp-step__body pp-channel" style={{ padding: 16 }}>
                      <div>
                        <h2>Connect</h2>
                        <p>Provide connection string & Handshake</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Providers Section */}
        <section className="section section--dark pp-section" style={{ background: 'var(--ink-850)', borderBlock: '1px solid var(--line-dark)' }}>
          <div className="container">
            <div className="sec-head sec-head--center" style={{ marginBottom: 48 }} data-reveal>
              <h2 className="sec-head__title">Recommended <em>Providers</em></h2>
              <p className="sec-head__lede">Choose the infrastructure that best fits your technical expertise</p>
            </div>

            <div className="pp-narrow">
              <div className="pp-grid pp-grid--2">
                {/* AWS */}
                <div className="pp-card pp-card--hover pp-provider" style={accent('#FF9900')} data-reveal>
                  <span className="pp-icon"><Database /></span>
                  <h3 style={{ marginTop: 20, fontSize: 22 }}>AWS RDS / EC2</h3>
                  <p className="pp-provider__tag" style={{ marginTop: 6 }}>Enterprise Cloud Database</p>
                  <p style={{ marginTop: 16, marginBottom: 22 }}>
                    Deploy your dedicated PostgreSQL database on AWS RDS or Amazon EC2. Benefit from enterprise VPC network isolation, automated multi-AZ snapshots, and ultra-high reliability tailored for enterprise real estate operations.
                  </p>
                  <ul className="pp-checks">
                    <li><CheckCircle /> Enterprise AWS Cloud Security</li>
                    <li><CheckCircle /> Automated Multi-AZ Backups</li>
                    <li><CheckCircle /> Custom Domain Mapping Included</li>
                    <li><CheckCircle /> Custom Incentive Automation</li>
                  </ul>
                  <a
                    href="https://aws.amazon.com/rds/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--ghost btn--block"
                  >
                    Explore AWS RDS
                  </a>
                </div>

                {/* Hostinger */}
                <div className="pp-card pp-card--hover pp-provider" style={accent('#A78BFA')} data-reveal data-reveal-delay="80">
                  <span className="pp-icon"><Server /></span>
                  <h3 style={{ marginTop: 20, fontSize: 22 }}>Hostinger VPS</h3>
                  <p className="pp-provider__tag" style={{ marginTop: 6 }}>Self-Hosted VPS</p>
                  <p style={{ marginTop: 16, marginBottom: 22 }}>
                    Virtual Private Servers for maximum control and budget efficiency. Deploy your own dedicated PostgreSQL or MySQL instances. Ideal for technical teams requiring custom configurations and strict firewalls.
                  </p>
                  <ul className="pp-checks">
                    <li><CheckCircle /> Full Root Access & Dedicated IP</li>
                    <li><CheckCircle /> High-Speed NVMe Storage</li>
                    <li><CheckCircle /> Custom Domain Mapping Included</li>
                    <li><CheckCircle /> Custom Incentive Automation</li>
                  </ul>
                  <a
                    href="https://hostinger.in?REFERRALCODE=synergy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn--ghost btn--block"
                  >
                    Get Hostinger VPS
                  </a>
                </div>
              </div>

              {/* Setup Fee & Custom Domain Notice */}
              <div className="pp-notice" style={{ marginTop: 28 }} data-reveal>
                <h3>
                  <CheckCircle size={16} aria-hidden="true" />
                  Upfront Pricing & Domain Customization Clarity
                </h3>
                <p>
                  <strong>Database Setup Charges:</strong> In addition to the standard subscription plan, a <strong>separate one-time Database Setup & Deployment Fee</strong> applies for cloud server provisioning, firewall hardening, VPC routing, and custom domain SSL mapping.
                </p>
                <p>
                  <strong>Custom Domain Whitelabeling:</strong> You can host RealSalePro under your <strong>own custom domain</strong> (e.g., <code className="pp-code">crm.yourcompany.com</code>). Custom domain white-labeling is a premium capability available exclusively with Self-Hosted Database deployments.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Specs */}
        <section className="section section--dark pp-section">
          <div className="container pp-center">
            <h2 className="pp-h2" data-reveal>Technical <em>Requirements</em></h2>
            <div className="pp-narrow">
              <div className="pp-grid pp-grid--3" style={{ marginTop: 36 }}>
                <div className="pp-card" data-reveal>
                  <span className="pp-icon"><Cpu /></span>
                  <h3 style={{ marginTop: 16 }}>vCPU</h3>
                  <p style={{ marginTop: 6 }}>Minimum 2 Cores</p>
                </div>
                <div className="pp-card" data-reveal data-reveal-delay="80">
                  <span className="pp-icon"><Server /></span>
                  <h3 style={{ marginTop: 16 }}>RAM</h3>
                  <p style={{ marginTop: 6 }}>Minimum 4GB</p>
                </div>
                <div className="pp-card" data-reveal data-reveal-delay="160">
                  <span className="pp-icon"><Database /></span>
                  <h3 style={{ marginTop: 16 }}>Database Engine</h3>
                  <p style={{ marginTop: 6 }}>PostgreSQL v12+</p>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 48 }} data-reveal>
              <p className="pp-muted">Need help with the setup? Our engineering team is here to assist.</p>
              <Link to="/contact" className="btn btn--primary" style={{ marginTop: 20 }}>
                Contact Engineering Support <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </PublicShell>
    </>
  );
}
