import React from 'react';

const TermsOfServicePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: January 2025</p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using TravelBuddy (the "Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you do not agree to these Terms, please do not use the Service. These Terms apply to all users, including 
              travelers, merchants, travel agents, and transport providers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              TravelBuddy is an AI-powered travel planning platform that provides:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Trip planning and itinerary creation</li>
              <li>Place discovery and recommendations</li>
              <li>Community features for sharing travel experiences</li>
              <li>Deals and offers from merchants and travel agents</li>
              <li>Transportation booking and coordination</li>
              <li>Emergency services and safety features</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">3.1 Registration</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must be at least 13 years old to create an account</li>
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>One person may not maintain multiple accounts</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">3.2 Account Types</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Traveler:</strong> Standard user account for trip planning</li>
              <li><strong>Merchant:</strong> Business account for offering deals</li>
              <li><strong>Travel Agent:</strong> Professional account for travel services</li>
              <li><strong>Transport Provider:</strong> Account for transportation services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. User Conduct</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">You agree NOT to:</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Post false, misleading, or fraudulent content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Upload malicious code or viruses</li>
              <li>Violate intellectual property rights</li>
              <li>Scrape or collect user data without permission</li>
              <li>Impersonate others or misrepresent affiliations</li>
              <li>Post spam, advertisements, or promotional content (except authorized merchants)</li>
              <li>Use the Service for illegal activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Content</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">5.1 Your Content</h3>
            <p>
              You retain ownership of content you post (photos, reviews, posts). By posting, you grant TravelBuddy 
              a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content within the Service.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">5.2 Content Standards</h3>
            <p>All content must:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Be accurate and not misleading</li>
              <li>Not contain hate speech, violence, or explicit material</li>
              <li>Not infringe on others' rights</li>
              <li>Comply with local laws and regulations</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">5.3 Content Removal</h3>
            <p>
              We reserve the right to remove content that violates these Terms without notice. 
              Repeated violations may result in account suspension or termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Merchant & Service Provider Terms</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">6.1 Deals & Offers</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Merchants are responsible for honoring posted deals and offers</li>
              <li>All pricing must be accurate and clearly stated</li>
              <li>Deals must comply with consumer protection laws</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">6.2 Service Quality</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Travel agents and transport providers must maintain professional standards</li>
              <li>Services must be delivered as described</li>
              <li>Proper licensing and insurance required where applicable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Payments & Subscriptions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Some features may require paid subscriptions</li>
              <li>Subscription fees are non-refundable unless required by law</li>
              <li>We may change pricing with 30 days notice</li>
              <li>You can cancel subscriptions at any time</li>
              <li>Transactions between users and merchants are independent of TravelBuddy</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Intellectual Property</h2>
            <p>
              TravelBuddy and its original content, features, and functionality are owned by TravelBuddy and protected 
              by international copyright, trademark, and other intellectual property laws. You may not copy, modify, 
              or distribute our content without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Third-Party Services</h2>
            <p>
              TravelBuddy integrates with third-party services (Google Maps, Firebase, payment processors). 
              We are not responsible for third-party services or their content. Your use of third-party services 
              is subject to their terms and policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Disclaimers</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">10.1 Service "As Is"</h3>
            <p>
              TravelBuddy is provided "as is" without warranties of any kind. We do not guarantee uninterrupted, 
              secure, or error-free service.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">10.2 Travel Risks</h3>
            <p>
              Travel involves inherent risks. We are not responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Accuracy of place information or reviews</li>
              <li>Quality of services provided by merchants or agents</li>
              <li>Travel delays, cancellations, or disruptions</li>
              <li>Personal injury, property damage, or loss during travel</li>
              <li>Political instability, natural disasters, or health emergencies</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">10.3 User Content</h3>
            <p>
              We do not verify user-generated content. Reviews, ratings, and recommendations reflect individual 
              opinions and may not be accurate.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, TravelBuddy shall not be liable for any indirect, incidental, 
              special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from 
              your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Indemnification</h2>
            <p>
              You agree to indemnify and hold TravelBuddy harmless from any claims, damages, or expenses arising from 
              your use of the Service, violation of these Terms, or infringement of any rights of another.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">13. Termination</h2>
            <p>
              We may suspend or terminate your account at any time for:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Violation of these Terms</li>
              <li>Fraudulent or illegal activity</li>
              <li>Prolonged inactivity</li>
              <li>Request from law enforcement</li>
            </ul>
            <p className="mt-3">
              You may delete your account at any time through app settings. Upon termination, your right to use 
              the Service ceases immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">14. Dispute Resolution</h2>
            <p>
              Any disputes arising from these Terms shall be resolved through:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Good faith negotiation between parties</li>
              <li>Mediation if negotiation fails</li>
              <li>Arbitration or courts of Sri Lanka as final resort</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">15. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of material changes via 
              email or in-app notification. Continued use after changes constitutes acceptance of new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">16. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Sri Lanka, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">17. Contact Information</h2>
            <p>For questions about these Terms:</p>
            <ul className="list-none space-y-2 mt-3">
              <li><strong>Email:</strong> <a href="mailto:legal@travelbuddylk.com" className="text-blue-600 hover:underline">legal@travelbuddylk.com</a></li>
              <li><strong>Website:</strong> <a href="https://travelbuddylk.com/contact" className="text-blue-600 hover:underline">travelbuddylk.com/contact</a></li>
              <li><strong>Address:</strong> TravelBuddy, Colombo, Sri Lanka</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            By using TravelBuddy, you agree to these Terms of Service and our{' '}
            <a href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
