import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { PublicShell } from '../components/public/PublicShell';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <PublicShell hideFooter hideWhatsApp>
      <section className="hero pp-status">
        <div className="hero__bg" aria-hidden="true">
          <div className="hero__grid"></div>
          <div className="hero__glow hero__glow--a"></div>
          <div className="hero__glow hero__glow--b"></div>
        </div>
        <div className="container pp-hero__inner">
          <span className="pp-icon pp-icon--lg pp-icon--danger"><ShieldAlert /></span>
          <h1 className="hero__title pp-hero__title">Access <em>Denied</em></h1>
          <p className="hero__lede pp-hero__lede">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
          <div className="pp-hero__extra">
            <button type="button" className="btn btn--primary btn--lg" onClick={() => navigate('/dashboard')}>
              <span>Return to Dashboard</span><svg className="icon"><use href="#i-arrow" /></svg>
            </button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
