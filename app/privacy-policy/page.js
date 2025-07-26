import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900">StudyHub Privacy Policy</h1>
          <p className="text-gray-600 mb-8">Effective Date: [Insert Date]</p>
          <p className="text-gray-600 mb-8">Updated: [Insert Date]</p>
          
          <div className="prose prose-lg max-w-none">
            <p className="mb-6">
              At StudyHub, we care deeply about your privacy. This Privacy Policy explains how we collect, use, 
              and protect your information when you use our platform and services.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="mb-4">We collect the following types of information:</p>
            
            <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Students, Teachers, Admins: Name, email address, role, associated school</li>
              <li>Parents (if applicable): Name, email, student association</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">B. Activity Data</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Club participation</li>
              <li>Join requests</li>
              <li>Announcements or posts</li>
              <li>Login and usage timestamps</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900">Device Information</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Browser type, device type, operating system</li>
              <li>IP address and general geolocation</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">D. Optional</h3>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Profile photos</li>
              <li>Messages or comments posted within clubs</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Create and manage user accounts</li>
              <li>Facilitate club creation, joining, and communications</li>
              <li>Improve site functionality and user experience</li>
              <li>Send notifications (email or in-app)</li>
              <li>Ensure safety, compliance, and proper moderation</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Sharing of Information</h2>
            <p className="mb-4">We do not sell your personal data.</p>
            <p className="mb-4">We only share data:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>With your school administrators (for account management and oversight)</li>
              <li>With service providers (e.g., Firebase, analytics tools) under strict data protection agreements</li>
              <li>If legally required (e.g., court order, law enforcement request)</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Parental Consent and Access</h2>
            <p className="mb-4">Our school enables parent access, parents may view:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Their child's club memberships</li>
              <li>Notifications or updates involving their child</li>
            </ul>
            <p className="mb-4">We comply with COPPA and other applicable data protection laws.</p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Cookies and Analytics</h2>
            <p className="mb-4">
              We use limited cookies and analytics tools to understand platform usage and improve performance. 
              You may control cookies through your browser settings.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your data from 
              unauthorized access, disclosure, or loss.
            </p>
            <p className="mb-4">We:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Encrypted database storage</li>
              <li>Role-based access controls</li>
              <li>Regular security audits</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Data Retention</h2>
            <p className="mb-4">
              We retain data for as long as your account is active. You may request account deletion by 
              contacting support@studyhub.com. Deleted accounts will be removed from our systems within 
          30 days unless required for legal compliance.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Children's Privacy</h2>
            <p className="mb-4">             StudyHub is intended for students aged 13 or older. Users under 18 must use the platform 
              with school or parent supervision. We do not knowingly collect information from children 
              under 13 without verified consent.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Your Rights</h2>
            <p className="mb-4">You may:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Request access to your personal data</li>
              <li>Correct or update information</li>
              <li>Delete your account and associated data</li>
            </ul>
            <p className="mb-4">
              To exercise these rights, contact us at: 📧 support@studyhub.com
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy occasionally. Any material changes will be posted on our 
              site with a revised EffectiveDate."
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy, reach out at:
            </p>
            <p className="text-blue-600">📧 support@studyhub.com</p>
          </div>
        </div>
      </div>
    </div>
  );
} 