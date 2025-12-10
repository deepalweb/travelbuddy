import React from 'react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-600 mb-8">Last Updated: January 2025</p>

        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              Welcome to TravelBuddy ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
              This privacy policy explains how we collect, use, and safeguard your information when you use our mobile application and website 
              at travelbuddylk.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">2.1 Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, password (encrypted)</li>
              <li><strong>Profile Information:</strong> Profile picture, bio, travel preferences</li>
              <li><strong>Contact Information:</strong> Phone number (optional)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">2.2 Location Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>GPS location for nearby places and recommendations</li>
              <li>Location history for personalized travel suggestions</li>
              <li>You can disable location access in device settings</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">2.3 User Content</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Photos and videos you upload to community posts</li>
              <li>Reviews, ratings, and comments</li>
              <li>Saved places and trip plans</li>
              <li>Messages and interactions with other users</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">2.4 Device Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device type, operating system, app version</li>
              <li>IP address, browser type</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Provide Services:</strong> Enable core features like trip planning, community posts, and place discovery</li>
              <li><strong>Personalization:</strong> Recommend destinations, deals, and content based on your preferences</li>
              <li><strong>Communication:</strong> Send notifications, updates, and respond to inquiries</li>
              <li><strong>Safety:</strong> Provide emergency services and location-based safety features</li>
              <li><strong>Improvement:</strong> Analyze usage to improve app performance and features</li>
              <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Data Sharing</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">We DO NOT sell your personal data.</h3>
            
            <p className="mb-2">We may share data with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> Firebase (authentication), Google Maps (location services), Azure (hosting)</li>
              <li><strong>Other Users:</strong> Public profile info, posts, and reviews you choose to share</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect rights and safety</li>
              <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>All data transmitted is encrypted using SSL/TLS</li>
              <li>Passwords are hashed and never stored in plain text</li>
              <li>Secure Azure cloud infrastructure with regular backups</li>
              <li>Regular security audits and updates</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Opt-Out:</strong> Disable location services, notifications, or marketing emails</li>
              <li><strong>Data Portability:</strong> Export your data in a machine-readable format</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact us at <a href="mailto:privacy@travelbuddylk.com" className="text-blue-600 hover:underline">privacy@travelbuddylk.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p>
              We retain your data as long as your account is active or as needed to provide services. 
              After account deletion, we may retain certain data for legal compliance (typically 30-90 days), 
              then permanently delete it from our systems.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Children's Privacy</h2>
            <p>
              TravelBuddy is not intended for users under 13 years old. We do not knowingly collect data from children. 
              If you believe a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Third-Party Services</h2>
            <p className="mb-2">We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Firebase Authentication:</strong> Secure user authentication</li>
              <li><strong>Google Maps API:</strong> Location services and place information</li>
              <li><strong>Microsoft Azure:</strong> Cloud hosting and database</li>
            </ul>
            <p className="mt-3">
              These services have their own privacy policies. We recommend reviewing them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries outside Sri Lanka, including the United States 
              (Azure servers). We ensure appropriate safeguards are in place to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of significant changes via email 
              or in-app notification. Continued use of TravelBuddy after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">12. Contact Us</h2>
            <p>For privacy-related questions or concerns:</p>
            <ul className="list-none space-y-2 mt-3">
              <li><strong>Email:</strong> <a href="mailto:privacy@travelbuddylk.com" className="text-blue-600 hover:underline">privacy@travelbuddylk.com</a></li>
              <li><strong>Website:</strong> <a href="https://travelbuddylk.com/contact" className="text-blue-600 hover:underline">travelbuddylk.com/contact</a></li>
              <li><strong>Address:</strong> TravelBuddy, Colombo, Sri Lanka</li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            By using TravelBuddy, you agree to this Privacy Policy and our{' '}
            <a href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
