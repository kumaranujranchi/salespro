import { Database, Server, Shield, CheckCircle, ArrowRight, Lock, Globe, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';

export function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-[#0E1A15] text-white font-sans">
      {/* Navbar / Header Placeholder - Or just back link */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link to="/" className="inline-flex items-center text-[#10B981] hover:text-[#34D399] transition-colors mb-8">
          <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-center">
        <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full mb-6">
          <Database className="w-4 h-4 text-[#10B981]" />
          <span className="text-emerald-400 text-sm font-medium">Bring Your Own Database (BYOD)</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
          Complete Data Sovereignty
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed mb-10">
          RealSalePro offers enterprise-grade database integrations, allowing you to host your data on your own private servers while using our powerful interface.
        </p>
      </div>

      {/* Overview Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Why Self-Hosted Database?</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">100% Data Ownership</h3>
                  <p className="text-gray-400 leading-relaxed">
                    You retain full legal and physical ownership of your data. RealSalePro acts as a client connecting to your instance. We never store your raw database files.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Enhanced Security</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Your database sits behind your firewalls. You control the access credentials and can revoke our access at any time without data loss.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Globe className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Compliance Ready</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Ideal for organizations in regulated industries requiring strict data isolation and on-premise storage solutions.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Incentive Automation</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Unlocks the powerful Custom Incentive Engine. Standard hosted plans are limited to Manual Incentives only.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[#12221D] p-8 rounded-2xl border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-6">Integration Workflow</h3>
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#10B981] text-[#0E1A15] flex items-center justify-center font-bold">1</div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex-1">
                    <p className="font-semibold text-white">Setup Database</p>
                    <p className="text-sm text-gray-400">Launch PostgreSQL on your VPS</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#10B981] text-[#0E1A15] flex items-center justify-center font-bold">2</div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex-1">
                    <p className="font-semibold text-white">Whitelist IP</p>
                    <p className="text-sm text-gray-400">Allow our Static IP (34.x.x.x) access</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#10B981] text-[#0E1A15] flex items-center justify-center font-bold">3</div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex-1">
                    <p className="font-semibold text-white">Connect</p>
                    <p className="text-sm text-gray-400">Provide connection string & Handshake</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Providers Section */}
      <div className="bg-[#12221D] py-24 px-4 sm:px-6 lg:px-8 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Recommended Providers</h2>
            <p className="text-gray-400">Choose the infrastructure that best fits your technical expertise</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-10">
            {/* AWS */}
            <div className="bg-[#0E1A15] p-8 rounded-2xl border border-white/10 hover:border-[#FF9900] transition-all group">
              <div className="w-16 h-16 bg-[#FF9900]/10 rounded-2xl flex items-center justify-center mb-6">
                <Database className="w-8 h-8 text-[#FF9900]" />
              </div>
              <h3 className="text-2xl font-bold mb-2">AWS RDS / EC2</h3>
              <p className="text-[#FF9900] text-sm font-semibold mb-6 uppercase tracking-wider">Enterprise Cloud Database</p>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Deploy your dedicated PostgreSQL database on AWS RDS or Amazon EC2. Benefit from enterprise VPC network isolation, automated multi-AZ snapshots, and ultra-high reliability tailored for enterprise real estate operations.
              </p>
              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#10B981]" /> Enterprise AWS Cloud Security</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#10B981]" /> Automated Multi-AZ Backups</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#10B981]" /> Custom Domain Mapping Included</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#10B981]" /> Custom Incentive Automation</li>
              </ul>
              <a
                href="https://aws.amazon.com/rds/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 bg-[#FF9900]/10 text-[#FF9900] text-center rounded-xl font-bold hover:bg-[#FF9900] hover:text-black transition-all"
              >
                Explore AWS RDS
              </a>
            </div>

            {/* Hostinger */}
            <div className="bg-[#0E1A15] p-8 rounded-2xl border border-white/10 hover:border-[#673DE6] transition-all group">
              <div className="w-16 h-16 bg-[#673DE6]/10 rounded-2xl flex items-center justify-center mb-6">
                <Server className="w-8 h-8 text-[#673DE6]" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Hostinger VPS</h3>
              <p className="text-[#673DE6] text-sm font-semibold mb-6 uppercase tracking-wider">Self-Hosted VPS</p>
              <p className="text-gray-400 mb-8 leading-relaxed">
                Virtual Private Servers for maximum control and budget efficiency. Deploy your own dedicated PostgreSQL or MySQL instances. Ideal for technical teams requiring custom configurations and strict firewalls.
              </p>
              <ul className="space-y-3 mb-8 text-gray-300">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#10B981]" /> Full Root Access & Dedicated IP</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#10B981]" /> High-Speed NVMe Storage</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#10B981]" /> Custom Domain Mapping Included</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-[#10B981]" /> Custom Incentive Automation</li>
              </ul>
              <a
                href="https://hostinger.in?REFERRALCODE=synergy"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-4 bg-[#673DE6]/10 text-[#673DE6] text-center rounded-xl font-bold hover:bg-[#673DE6] hover:text-white transition-all"
              >
                Get Hostinger VPS
              </a>
            </div>
          </div>

          {/* Setup Fee & Custom Domain Notice */}
          <div className="max-w-4xl mx-auto bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-left">
            <h4 className="text-amber-400 font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              Upfront Pricing & Domain Customization Clarity
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed mb-2">
              <strong>Database Setup Charges:</strong> In addition to the standard subscription plan, a <strong>separate one-time Database Setup & Deployment Fee</strong> applies for cloud server provisioning, firewall hardening, VPC routing, and custom domain SSL mapping.
            </p>
            <p className="text-gray-300 text-sm leading-relaxed">
              <strong>Custom Domain Whitelabeling:</strong> You can host RealSalePro under your <strong>own custom domain</strong> (e.g., <code>crm.yourcompany.com</code>). Custom domain white-labeling is a premium capability available exclusively with Self-Hosted Database deployments.
            </p>
          </div>
        </div>
      </div>

      {/* Technical Specs Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-2xl font-bold mb-6">Technical Requirements</h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <Cpu className="w-8 h-8 text-gray-400 mx-auto mb-4" />
            <h4 className="font-bold mb-2">vCPU</h4>
            <p className="text-gray-400">Minimum 2 Cores</p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <Server className="w-8 h-8 text-gray-400 mx-auto mb-4" />
            <h4 className="font-bold mb-2">RAM</h4>
            <p className="text-gray-400">Minimum 4GB</p>
          </div>
          <div className="p-6 rounded-xl bg-white/5 border border-white/10">
            <Database className="w-8 h-8 text-gray-400 mx-auto mb-4" />
            <h4 className="font-bold mb-2">Database Engine</h4>
            <p className="text-gray-400">PostgreSQL v12+</p>
          </div>
        </div>
        <div className="mt-12">
          <p className="text-gray-400 mb-6">Need help with the setup? Our engineering team is here to assist.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 text-[#10B981] font-bold hover:text-white transition-colors">
            Contact Engineering Support <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
