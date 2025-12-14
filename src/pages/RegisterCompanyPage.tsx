import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';

export function RegisterCompanyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: '',
    companySlug: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto-generate slug from company name
      companySlug: name === 'companyName' ? value.toLowerCase().replace(/[^a-z0-9]/g, '-') : prev.companySlug
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: 'super_admin'
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Registration failed");

      // Step 2: Call the Secure RPC function to create Tenant & Link User
      const { data: rpcData, error: rpcError } = await supabase.rpc('register_tenant', {
        company_name: formData.companyName,
        company_slug: formData.companySlug,
        user_full_name: formData.fullName
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(rpcError.message || 'Failed to create company workspace');
      }

      // Success! Sign in to ensure session is fresh
      await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      navigate('/dashboard');

    } catch (err: any) {
      console.error('Registration Error:', err);
      if (err.message && err.message.includes("security purposes")) {
        setError("Please wait a few seconds before trying again.");
      } else {
        setError(err.message || 'Failed to register company');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-indigo-600 p-3 rounded-xl">
            <Building2 className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Register your Company
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          Start your 14-day free trial. No credit card required.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <Input
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                placeholder="Acme Corp"
              />
            </div>

            <div>
              <Input
                label="Your Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                placeholder="John Doe"
              />
            </div>

            <div>
              <Input
                label="Email address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Input
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
              />
            </div>

            <div>
              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                    Setting up your workspace...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in to existing workspace
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
