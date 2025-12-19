import { Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ContactUsPage() {
  return (
    <div className="min-h-screen bg-[#0E1A15] py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-[#10B981] hover:text-[#34D399] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-lg text-gray-400 mb-8">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>

          <div className="space-y-6">
            {/* Email */}
            <div className="flex items-start gap-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <Mail className="w-6 h-6 text-[#10B981] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">Email</h3>
                <a href="mailto:support@realsalepro.com" className="text-[#10B981] hover:text-[#34D399]">
                  support@realsalepro.com
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <Phone className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">Phone</h3>
                <a href="tel:+919525230232" className="text-green-500 hover:text-green-400">
                  +91 95252 30232
                </a>
                <p className="text-sm text-gray-400 mt-1">Monday - Friday, 9:00 AM - 6:00 PM IST</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <MapPin className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white mb-1">Office Address</h3>
                <p className="text-gray-300">
                  RealSalePro<br />
                  Business District<br />
                  New Delhi, India
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Business Hours</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-white">Monday - Friday</p>
                <p className="text-gray-400">9:00 AM - 6:00 PM IST</p>
              </div>
              <div>
                <p className="font-semibold text-white">Saturday - Sunday</p>
                <p className="text-gray-400">Closed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
