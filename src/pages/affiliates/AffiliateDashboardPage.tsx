import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from "../../lib/reactive";
import { api, Id } from '../../lib/api-endpoints';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, Copy, CheckCircle, ExternalLink, IndianRupee, Users, TrendingUp, LogOut } from 'lucide-react';
import { PublicShell } from '../../components/public/PublicShell';

export function AffiliateDashboardPage() {
  const { user, profile, affiliate, signOut } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Backend queries
  const statsData = useQuery(api.referrals.getCampaignStats,
    affiliate ? { campaign_id: affiliate._id as Id<"referral_campaigns"> } : "skip"
  );

  const stats = useMemo(() => ({
    totalReferrals: statsData?.totalSignups || 0,
    totalEarnings: statsData?.totalEarnings || 0,
    pendingPayouts: 0 // Logic for pending payouts can be added later
  }), [statsData]);

  const referrals = statsData?.ledger || [];
  const isLoading = affiliate === undefined || (affiliate !== null && statsData === undefined);

  const copyLink = () => {
    if (!affiliate) return;
    const link = `${window.location.origin}/?ref=${affiliate.code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <PublicShell hideFooter>
        <section className="pp-dash pp-dash--center">
          <Loader2 className="pp-spin pp-spin--lg" aria-label="Loading" />
        </section>
      </PublicShell>
    );
  }

  if (!affiliate) {
    return (
      <PublicShell hideFooter>
        <section className="pp-dash pp-dash--center">
          <div className="container pp-dash__empty">
            <h2 className="sec-head__title">No Active Partner Account Found</h2>
            <p className="sec-head__lede">You haven't registered as a partner yet.</p>
            <a href="/affiliate/register" className="btn btn--primary btn--lg">
              <span>Register Now</span>
              <svg className="icon"><use href="#i-arrow" /></svg>
            </a>
          </div>
        </section>
      </PublicShell>
    );
  }

  const referralLink = `${window.location.origin}/register?ref=${affiliate.code}`;

  return (
    <PublicShell hideFooter>
      <section className="pp-dash">
        <div className="container pp-dash__stack">

          {/* Header */}
          <div className="pp-dash__head">
            <div className="pp-dash__title">
              <h1>
                Partner <em>Dashboard</em> <span className="pp-badge">Active</span>
              </h1>
              <p>
                Welcome back, {profile?.full_name || user?.email || 'Partner'}.
              </p>
            </div>
            <div className="pp-dash__actions">
              <div className="pp-card pp-dash__code">
                <div>
                  <span className="pp-dash__code-label">Your Unique Code</span>
                  <div className="pp-dash__code-value">{affiliate.code}</div>
                </div>
                <div className="pp-dash__sep" aria-hidden="true"></div>
                <button
                  type="button"
                  onClick={copyLink}
                  className="pp-dash__copy"
                >
                  {copied ? <CheckCircle /> : <Copy />}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="pp-card pp-dash__logout"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut />
              </button>
            </div>
          </div>

          {/* Share Section */}
          <div className="pp-card pp-dash__share">
            <h2>Start Earning 20% Commission</h2>
            <p>
              Share this link with your network. When they sign up using your link, they currently get a 10% discount, and you earn recurring revenue.
            </p>
            <div className="pp-dash__share-row">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="pp-input pp-input--mono"
                aria-label="Your referral link"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="btn btn--primary"
              >
                {copied ? <CheckCircle className="icon" /> : <Copy className="icon" />}
                <span>Copy Link</span>
              </button>
              <a
                href={referralLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost"
              >
                <ExternalLink className="icon" />
                <span>Test Link</span>
              </a>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="pp-grid pp-grid--3">
            <div className="pp-card pp-dash__stat">
              <span className="pp-icon"><Users /></span>
              <div>
                <p>Total Referrals</p>
                <div className="pp-stat">{stats.totalReferrals}</div>
              </div>
            </div>
            <div className="pp-card pp-dash__stat">
              <span className="pp-icon"><IndianRupee /></span>
              <div>
                <p>Paid Earnings</p>
                <div className="pp-stat">₹{stats.totalEarnings.toLocaleString()}</div>
              </div>
            </div>
            <div className="pp-card pp-dash__stat">
              <span className="pp-icon"><TrendingUp /></span>
              <div>
                <p>Pending Payout</p>
                <div className="pp-stat">₹{stats.pendingPayouts.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Recent Referrals Table */}
          <div className="pp-card pp-table-card">
            <div className="pp-table-card__head">
              <h3>Recent Referrals</h3>
            </div>
            {referrals.length === 0 ? (
              <div className="pp-table-card__empty">
                No referrals yet. Share your code to get started!
              </div>
            ) : (
              <div className="pp-table-wrap">
                <table className="pp-table">
                  <thead>
                    <tr>
                      <th>Tenant Name</th>
                      <th>Date Joined</th>
                      <th>Status</th>
                      <th>Plan</th>
                      <th>Commission</th>
                      <th>Payout Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((ref: any) => {
                      const isConverted = ref.referred_tenant?.subscription_status === 'active';
                      const commission = isConverted ?
                        (ref.referred_tenant?.plan_tier === 'enterprise' ? 5000 : 2000) : 0; // Dummy logic

                      return (
                        <tr key={ref._id}>
                          <td className="pp-table__strong">
                            {ref.referred_tenant?.name || 'Unknown'}
                          </td>
                          <td>
                            {new Date(ref._creationTime).toLocaleDateString()}
                          </td>
                          <td>
                            <span className={`pp-pill ${isConverted ? 'pp-pill--success' : 'pp-pill--info'}`}>
                              {isConverted ? 'Active' : 'Trial'}
                            </span>
                          </td>
                          <td className="pp-table__cap">
                            {ref.referred_tenant?.plan_tier || 'Starter'}
                          </td>
                          <td className="pp-table__strong">
                            {isConverted ? `₹${commission.toLocaleString()}` : '—'}
                          </td>
                          <td>
                            <span className={`pp-pill ${ref.payout_status === 'paid' ? 'pp-pill--success' : 'pp-pill--muted'}`}>
                              {ref.payout_status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </section>
    </PublicShell>
  );
}
