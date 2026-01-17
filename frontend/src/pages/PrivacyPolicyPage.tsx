import React from 'react'
import { Shield } from 'lucide-react'

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Shield className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-blue-100 text-lg">Your privacy is important to us. Learn how we protect your data.</p>
          <p className="text-blue-200 text-sm mt-4">Last Updated: January 2026</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-white rounded-xl shadow-sm p-8 mb-12 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Table of Contents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Introduction', 'Information We Collect', 'How We Use Information', 'Data Security', 'Your Rights', 'Third-Party Sharing', 'Cookies & Tracking', 'Contact Us'].map((item, idx) => (
              <a key={idx} href={`#section-${idx + 1}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                {idx + 1}. {item}
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-12">
          {/* Section 1 */}
          <section id="section-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to TravelBuddy. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our mobile 
              application and website.
            </p>
          </section>

          {/* Section 2 */}
          <section id="section-2">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Personal Information You Provide</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Account:</strong> Name, email, password, phone number</li>
                  <li><strong>Profile:</strong> Picture, bio, travel preferences</li>
                  <li><strong>Payment:</strong> Credit card (via secure Stripe)</li>
                  <li><strong>Communication:</strong> Messages, reviews, feedback</li>
                </ul>
              </div>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Information Collected Automatically</h3>
                <ul className="space-y-2 text-gray-700">
                  <li><strong>Location:</strong> GPS coordinates (with permission)</li>
                  <li><strong>Device:</strong> Device type, OS, browser, IP address</li>
                  <li><strong>Usage:</strong> Pages visited, time spent, clicks</li>
                  <li><strong>Cookies:</strong> Session and persistent identifiers</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="section-3">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Service Delivery', desc: 'Providing trip planning and recommendations' },
                { title: 'Communication', desc: 'Updates, notifications, customer support' },
                { title: 'Personalization', desc: 'Customizing experience based on preferences' },
                { title: 'Analytics', desc: 'Understanding usage to improve service' },
                { title: 'Marketing', desc: 'Promotional emails (opt-in)' },
                { title: 'Security', desc: 'Fraud detection and account protection' }
              ].map((item, idx) => (
                <div key={idx} className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-700 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 */}
          <section id="section-4">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use industry-standard security measures to protect your data:
            </p>
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-3"><span className="text-green-600 font-bold">✓</span><span>SSL/TLS encryption for data in transit</span></li>
                <li className="flex gap-3"><span className="text-green-600 font-bold">✓</span><span>AES-256 encryption at rest</span></li>
                <li className="flex gap-3"><span className="text-green-600 font-bold">✓</span><span>Regular security audits</span></li>
                <li className="flex gap-3"><span className="text-green-600 font-bold">✓</span><span>Secure password hashing</span></li>
                <li className="flex gap-3"><span className="text-green-600 font-bold">✓</span><span>Two-factor authentication support</span></li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section id="section-5">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <div className="space-y-3">
              {[
                { title: 'Access', desc: 'Request a copy of your data' },
                { title: 'Correction', desc: 'Fix inaccurate information' },
                { title: 'Deletion', desc: 'Request removal of your data' },
                { title: 'Restriction', desc: 'Limit how your data is used' },
                { title: 'Portability', desc: 'Receive data in a structured format' },
                { title: 'Objection', desc: 'Opt-out of certain processing' }
              ].map((item, idx) => (
                <div key={idx} className="border-l-4 border-blue-600 pl-4">
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-gray-700 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 6 */}
          <section id="section-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">6. Third-Party Sharing</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your data. We may share with:
            </p>
            <div className="space-y-3">
              {[
                { title: 'Service Providers', desc: 'Payment processors, hosting, analytics' },
                { title: 'Legal Requirement', desc: 'When required by law' },
                { title: 'Business Transfer', desc: 'In case of merger or acquisition' },
                { title: 'Your Consent', desc: 'When you explicitly authorize' }
              ].map((item, idx) => (
                <div key={idx} className="bg-gray-100 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <p className="text-gray-700 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 7 */}
          <section id="section-7">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">7. Cookies & Tracking</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use cookies to enhance your experience. You can control settings through browser or our cookie tool.
            </p>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-4">Cookie Types:</h3>
              <ul className="space-y-2 text-gray-700">
                <li><strong>Essential:</strong> Required for site functionality</li>
                <li><strong>Performance:</strong> Analytics and usage tracking</li>
                <li><strong>Functional:</strong> Remember your preferences</li>
                <li><strong>Marketing:</strong> Personalized advertising (opt-in)</li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section id="section-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <p className="text-gray-700 mb-3"><strong>Email:</strong> privacy@travelbuddy.com</p>
              <p className="text-gray-700 mb-3"><strong>DPO:</strong> dpo@travelbuddy.com</p>
              <p className="text-gray-600 text-sm">Response time: Within 30 days</p>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 rounded-lg p-6 mt-12 border-t-4 border-blue-600">
          <p className="text-gray-700 text-sm">
            <strong>Updates:</strong> We may update this policy periodically. Material changes will be communicated via email.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
