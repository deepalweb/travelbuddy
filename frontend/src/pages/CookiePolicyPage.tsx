import React from 'react'
import { Cookie, Settings, Eye, Info, CheckCircle } from 'lucide-react'

export const CookiePolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-800 text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <Cookie className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-bold">Cookie Policy</h1>
          </div>
          <p className="text-orange-100 text-lg">How we use cookies to enhance your experience.</p>
          <p className="text-orange-200 text-sm mt-4">Last Updated: January 2026</p>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        {/* Table of Contents */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-12 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Table of Contents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              '1. What Are Cookies?',
              '2. Types of Cookies We Use',
              '3. Purpose of Cookies',
              '4. Third-Party Cookies',
              '5. Cookie Management',
              '6. Your Choices',
              '7. Contact Us'
            ].map((item, idx) => (
              <a
                key={idx}
                href={`#section-${idx + 1}`}
                className="text-orange-600 hover:text-orange-700 hover:underline transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>

        {/* Section 1 */}
        <section id="section-1" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-6 h-6 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">1. What Are Cookies?</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-4">
            Cookies are small text files that are placed on your device (computer, tablet, or mobile phone) when you 
            visit our website or use our mobile application. They are widely used to make websites and apps work more 
            efficiently, as well as to provide information to the owners of the site or app.
          </p>
          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
            <h3 className="font-semibold text-gray-900 mb-3">Key Cookie Facts:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-3">
                <span className="text-orange-600 font-bold">•</span>
                <span>Cookies are harmless and do not contain viruses</span>
              </li>
              <li className="flex gap-3">
                <span className="text-orange-600 font-bold">•</span>
                <span>They cannot execute programs or deliver malware</span>
              </li>
              <li className="flex gap-3">
                <span className="text-orange-600 font-bold">•</span>
                <span>You can accept or reject cookies at any time</span>
              </li>
              <li className="flex gap-3">
                <span className="text-orange-600 font-bold">•</span>
                <span>Most cookies have an expiration date and are automatically deleted</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section id="section-2" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">2. Types of Cookies We Use</h2>
          </div>
          
          <div className="space-y-6">
            {[
              {
                title: 'Essential/Strictly Necessary Cookies',
                desc: 'These cookies are required for the website to function properly.',
                items: [
                  'Session management (keeping you logged in)',
                  'Security and fraud prevention',
                  'Load balancing',
                  'CSRF token protection',
                  'Accepting cookie preferences'
                ]
              },
              {
                title: 'Performance Cookies',
                desc: 'These help us understand how visitors use our site.',
                items: [
                  'Google Analytics (pages visited, time on site)',
                  'User engagement metrics',
                  'Error reporting',
                  'Crash detection',
                  'Performance monitoring'
                ]
              },
              {
                title: 'Functional Cookies',
                desc: 'These enable enhanced functionality and personalization.',
                items: [
                  'Language preferences',
                  'Accessibility settings',
                  'Remember your preferences',
                  'Store your trips and saved places',
                  'Customize your dashboard'
                ]
              },
              {
                title: 'Marketing/Advertising Cookies',
                desc: 'These track your activity to provide relevant ads (opt-in).',
                items: [
                  'Track ad performance',
                  'Deliver personalized advertisements',
                  'Social media integration',
                  'Retargeting campaigns',
                  'Conversion tracking'
                ]
              }
            ].map((category, idx) => (
              <div key={idx} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.title}</h3>
                <p className="text-gray-700 mb-4">{category.desc}</p>
                <ul className="space-y-2">
                  {category.items.map((item, itemIdx) => (
                    <li key={itemIdx} className="flex gap-3 text-gray-700">
                      <span className="text-orange-600 font-bold">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 */}
        <section id="section-3" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">3. Purpose of Cookies</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            We use cookies for the following purposes:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Authentication', desc: 'Keep you logged in securely' },
              { title: 'Preferences', desc: 'Remember your settings and choices' },
              { title: 'Security', desc: 'Prevent unauthorized access' },
              { title: 'Analytics', desc: 'Understand user behavior and improve service' },
              { title: 'Personalization', desc: 'Customize your experience' },
              { title: 'Marketing', desc: 'Show relevant offers and advertisements' }
            ].map((item, idx) => (
              <div key={idx} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="font-semibold text-gray-900 mb-2">{item.title}</h4>
                <p className="text-gray-700 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4 */}
        <section id="section-4" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">4. Third-Party Cookies</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            We partner with third-party services that may also set cookies on your device:
          </p>
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Google Analytics</h4>
              <p className="text-gray-700 text-sm mb-2">Tracks site usage and user behavior</p>
              <p className="text-orange-600 text-sm"><a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Stripe</h4>
              <p className="text-gray-700 text-sm mb-2">Payment processing and fraud prevention</p>
              <p className="text-orange-600 text-sm"><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Firebase</h4>
              <p className="text-gray-700 text-sm mb-2">App analytics and performance monitoring</p>
              <p className="text-orange-600 text-sm"><a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a></p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Social Media Platforms</h4>
              <p className="text-gray-700 text-sm mb-2">Integration with Facebook, Google, Apple Sign-In</p>
              <p className="text-gray-700 text-sm">These platforms set their own cookies for tracking and authentication</p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section id="section-5" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">5. Cookie Management</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            You have full control over cookies. You can manage them through several methods:
          </p>
          
          <div className="space-y-6">
            <div className="border-l-4 border-orange-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Browser Settings</h3>
              <p className="text-gray-700 mb-3">You can adjust cookie settings in your browser:</p>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Edge:</strong> Settings → Privacy → Clear Browsing Data → Cookies</li>
              </ul>
            </div>

            <div className="border-l-4 border-orange-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">TravelBuddy Cookie Preferences</h3>
              <p className="text-gray-700">
                You can manage your cookie preferences directly in your TravelBuddy account settings. 
                Essential cookies cannot be disabled as they are necessary for the site to function.
              </p>
            </div>

            <div className="border-l-4 border-orange-600 pl-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Opt-Out Programs</h3>
              <ul className="space-y-2 text-gray-700 text-sm">
                <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Digital Advertising Alliance (DAA)</a> - Opt out of behavioral ads</li>
                <li><a href="https://www.networkadvertising.org/managing/opt_out.asp" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Network Advertising Initiative (NAI)</a> - Manage ad cookies</li>
                <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Google Analytics Opt-out</a> - Prevent GA data collection</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 6 */}
        <section id="section-6" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">6. Your Choices</h2>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Accept All Cookies</h3>
              <p className="text-gray-700">All cookies will be used to enhance your experience</p>
            </div>
            <div className="border-t border-orange-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Reject Non-Essential Cookies</h3>
              <p className="text-gray-700">Only essential and functional cookies will be used</p>
            </div>
            <div className="border-t border-orange-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Customize Preferences</h3>
              <p className="text-gray-700">Choose which types of cookies you want to allow</p>
            </div>
            <div className="border-t border-orange-200 pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">Change Your Mind Anytime</h3>
              <p className="text-gray-700">You can update your cookie preferences at any time</p>
            </div>
          </div>
        </section>

        {/* Section 7 */}
        <section id="section-7" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-orange-600" />
            <h2 className="text-3xl font-bold text-gray-900">7. Contact Us</h2>
          </div>
          <p className="text-gray-700 leading-relaxed mb-6">
            If you have questions about this Cookie Policy or our use of cookies:
          </p>
          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
            <div className="space-y-3 text-gray-700">
              <p><strong>Email:</strong> cookies@travelbuddy.com</p>
              <p><strong>Privacy Inquiries:</strong> privacy@travelbuddy.com</p>
              <p><strong>Data Protection Officer:</strong> dpo@travelbuddy.com</p>
              <p className="pt-4 text-sm text-gray-600">
                We will respond to all cookie-related inquiries within 14 days.
              </p>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <div className="bg-gray-100 rounded-lg p-6 mt-12 border-t-4 border-orange-600">
          <p className="text-gray-700 text-sm mb-4">
            <strong>Policy Updates:</strong> This Cookie Policy may be updated periodically to reflect changes in our 
            practices or technology. We will notify you of material changes by updating the "Last Updated" date above.
          </p>
          <p className="text-gray-700 text-sm">
            <strong>Effective Date:</strong> This policy is effective as of January 1, 2026, and applies to all new users. 
            Existing users are requested to review and accept these terms.
          </p>
        </div>
      </div>
    </div>
  )
}

export default CookiePolicyPage
