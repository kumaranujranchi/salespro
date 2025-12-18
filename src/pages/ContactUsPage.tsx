import { Mail, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function ContactUsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-lg text-gray-600 mb-8">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>

          <div className="space-y-6">
            {/* Email */}
            <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                <a href="mailto:support@realsalepro.com" className="text-blue-600 hover:text-blue-700">
                  support@realsalepro.com
                </a>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
              <Phone className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                <a href="tel:+919525230232" className="text-green-600 hover:text-green-700">
                  +91 95252 30232
                </a>
                <p className="text-sm text-gray-600 mt-1">Monday - Friday, 9:00 AM - 6:00 PM IST</p>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4 p-4 bg-purple-50 rounded-lg">
              <MapPin className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Office Address</h3>
                <p className="text-gray-700">
                  RealSalePro<br />
                  Business District<br />
                  New Delhi, India
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Business Hours</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-gray-900">Monday - Friday</p>
                <p className="text-gray-600">9:00 AM - 6:00 PM IST</p>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Saturday - Sunday</p>
                <p className="text-gray-600">Closed</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
