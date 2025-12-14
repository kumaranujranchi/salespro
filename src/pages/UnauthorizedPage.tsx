import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-[#C62828]/10 rounded-full mb-6">
          <ShieldAlert size={40} className="text-[#C62828]" />
        </div>
        <h1 className="text-3xl font-bold text-[#0A1C37] mb-4">Access Denied</h1>
        <p className="text-gray-600 mb-8">
          You don't have permission to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Button onClick={() => navigate('/dashboard')} variant="primary">
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
