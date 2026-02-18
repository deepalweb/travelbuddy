import express from 'express';
import path from 'path';
const router = express.Router();

// Privacy Policy
router.get('/privacy', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Travel Buddy</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { color: #1976D2; }
        h2 { color: #333; margin-top: 30px; }
        .last-updated { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <h1>Privacy Policy</h1>
    <p class="last-updated">Last Updated: January 20, 2026</p>
    <h2>1. Information We Collect</h2>
    <p>We collect information you provide directly to us, including:</p>
    <ul>
        <li>Account information (name, email, profile picture)</li>
        <li>Location data (with your permission)</li>
        <li>Travel preferences and favorites</li>
        <li>User-generated content (posts, reviews, photos)</li>
    </ul>
    <h2>2. How We Use Your Information</h2>
    <p>We use the information we collect to:</p>
    <ul>
        <li>Provide personalized travel recommendations</li>
        <li>Show nearby places and attractions</li>
        <li>Enable community features</li>
        <li>Improve our services</li>
    </ul>
    <h2>3. Information Sharing</h2>
    <p>We do not sell your personal information. We may share information with:</p>
    <ul>
        <li>Service providers (Google Maps, Firebase)</li>
        <li>Other users (only public profile information)</li>
        <li>Legal authorities when required by law</li>
    </ul>
    <h2>4. Data Security</h2>
    <p>We implement security measures to protect your data, including encryption and secure servers.</p>
    <h2>5. Your Rights</h2>
    <p>You have the right to:</p>
    <ul>
        <li>Access your personal data</li>
        <li>Delete your account</li>
        <li>Opt-out of location tracking</li>
        <li>Control privacy settings</li>
    </ul>
    <h2>6. Contact Us</h2>
    <p>For privacy concerns, contact us at: <a href="mailto:support@travelbuddylk.com">support@travelbuddylk.com</a></p>
</body>
</html>
  `);
});

// Terms of Service
router.get('/terms', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - Travel Buddy</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
        h1 { color: #1976D2; }
        h2 { color: #333; margin-top: 30px; }
        .last-updated { color: #666; font-style: italic; }
    </style>
</head>
<body>
    <h1>Terms of Service</h1>
    <p class="last-updated">Last Updated: January 20, 2026</p>
    <h2>1. Acceptance of Terms</h2>
    <p>By using Travel Buddy, you agree to these Terms of Service.</p>
    <h2>2. User Accounts</h2>
    <p>You are responsible for maintaining the security of your account and all activities under your account.</p>
    <h2>3. User Content</h2>
    <p>You retain ownership of content you post. By posting, you grant us a license to use, display, and distribute your content within the app.</p>
    <h2>4. Prohibited Activities</h2>
    <p>You may not:</p>
    <ul>
        <li>Post false or misleading information</li>
        <li>Harass or abuse other users</li>
        <li>Violate any laws or regulations</li>
        <li>Attempt to hack or disrupt the service</li>
    </ul>
    <h2>5. Service Availability</h2>
    <p>We strive for 99% uptime but do not guarantee uninterrupted service.</p>
    <h2>6. Limitation of Liability</h2>
    <p>Travel Buddy is provided "as is" without warranties. We are not liable for travel decisions made using our app.</p>
    <h2>7. Changes to Terms</h2>
    <p>We may update these terms. Continued use constitutes acceptance of changes.</p>
    <h2>8. Contact</h2>
    <p>Questions? Email: <a href="mailto:support@travelbuddylk.com">support@travelbuddylk.com</a></p>
</body>
</html>
  `);
});

export default router;
