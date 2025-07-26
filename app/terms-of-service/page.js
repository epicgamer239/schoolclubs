import React from 'react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">StudyHub Terms of Service</h1>
          <p className="text-gray-600 mb-8">Effective Date: [Insert Date]</p>
          
          <div className="prose prose-lg max-w-none">
            <p className="mb-6">Welcome to StudyHub. These Terms of Service ("Terms") govern your access to and use of StudyHub's platform, 
              including any mobile applications, websites, features, and services (collectively, the "Service). 
              By accessing or using StudyHub, you agree to be bound by these Terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">1 Eligibility</h2>
            <p className="mb-4">
              You must be at least 13 years old to use StudyHub. If you are under 18, you may only use the Service 
              with the consent and supervision of a parent, guardian, or school administrator.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Accounts</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>You are responsible for maintaining the confidentiality of your login credentials and account.</li>
              <li>You agree to provide accurate, complete, and current information during registration.</li>
              <li>You may not impersonate another person or entity or create accounts for unauthorized use.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Roles & Permissions</h2>
            <p className="mb-4">StudyHub provides distinct account roles:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Students may join and participate in clubs.</li>
              <li>Teachers may create, manage, and oversee clubs.</li>
              <li>Administrators may manage school-wide data and user roles.</li>
              <li>Parents (if applicable) may view their child's club activity with consent.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Use StudyHub for any unlawful or harmful purpose.</li>
              <li>Harass, abuse, or harm other users.</li>
              <li>Post false or misleading information.</li>
              <li>Upload viruses, malware, or attempt to disrupt the platform's functionality.</li>
              <li>Attempt to gain unauthorized access to accounts or data.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. User Content</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>You retain ownership of content you upload to StudyHub (e.g., club descriptions, announcements).</li>
              <li>By submitting content, you grant StudyHub a non-exclusive, royalty-free, worldwide license to use, 
                  display, and distribute it for the purpose of operating the platform.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Privacy</h2>
            <p className="mb-4">
              Your use of StudyHub is also governed by our Privacy Policy. We take data protection seriously and 
              limit data sharing to what is necessary to provide and improve the service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">7 Termination</h2>
            <p className="mb-4">StudyHub reserves the right to:</p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Suspend or terminate accounts that violate these Terms.</li>
              <li>Modify or discontinue the Service at any time without prior notice.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">8 Disclaimers</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>StudyHub is provided "as is" without warranties of any kind.</li>
              <li>We do not guarantee uninterrupted or error-free service.</li>
              <li>StudyHub is not responsible for actions taken by users, including students or schools.</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by law, StudyHub shall not be liable for any indirect, incidental, 
              special, or consequential damages arising from your use of the platform.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="mb-4">
              We may update these Terms from time to time. We will notify users of material changes, and continued 
              use of the Service constitutes acceptance of the revised Terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact</h2>
            <p className="mb-4">
              If you have questions or concerns about these Terms, please contact us at:
            </p>
            <p className="text-blue-600">📧 support@studyhub.com</p>
          </div>
        </div>
      </div>
    </div>
  );
} 