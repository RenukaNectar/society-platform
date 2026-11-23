import React from 'react';
import { Card } from '../components/ui/Card';
import { FileText, Shield, Users, Building, CheckCircle } from 'lucide-react';

export const TermsAndConditions: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-[60%] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">          
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Terms and Conditions</h1>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Introduction */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              Welcome to the RCS Society Management System. These Terms and Conditions govern your use of our platform 
              and services. By accessing or using our system, you agree to be bound by these terms.
            </p>
            <p className="text-gray-700">
              The system is designed to facilitate the management of cooperative societies, including registration, 
              amendments, audits, elections, and other administrative functions as per the relevant cooperative society laws.
            </p>
          </Card>

          {/* Definitions */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Definitions</h2>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900">"System"</h3>
                <p className="text-gray-700">Refers to the RCS Society Management System and all its components.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">"User"</h3>
                <p className="text-gray-700">Any individual or entity registered to use the system.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">"Society"</h3>
                <p className="text-gray-700">A cooperative society registered through the system.</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">"Authority"</h3>
                <p className="text-gray-700">The Registrar of Cooperative Societies and authorized officials.</p>
              </div>
            </div>
          </Card>

          {/* User Responsibilities */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Accurate Information</h3>
                  <p className="text-gray-700">Users must provide accurate, complete, and up-to-date information.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Compliance with Laws</h3>
                  <p className="text-gray-700">Users must comply with all applicable cooperative society laws and regulations.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Security</h3>
                  <p className="text-gray-700">Users are responsible for maintaining the security of their account credentials.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Documentation</h3>
                  <p className="text-gray-700">Users must maintain proper documentation as required by law.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* System Usage */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. System Usage</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Permitted Uses</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Society registration and management</li>
                  <li>Filing amendments and annual returns</li>
                  <li>Submitting audit requests</li>
                  <li>Managing election processes</li>
                  <li>Communication with authorities</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Prohibited Uses</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Unauthorized access to other users' data</li>
                  <li>Submitting false or misleading information</li>
                  <li>Attempting to circumvent system security</li>
                  <li>Using the system for illegal purposes</li>
                  <li>Interfering with system operations</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Data and Privacy */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data and Privacy</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Data Collection</h3>
                  <p className="text-gray-700">
                    The system collects necessary information for society management, including personal details, 
                    documents, and transaction records as required by law.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Data Protection</h3>
                  <p className="text-gray-700">
                    We implement appropriate security measures to protect user data from unauthorized access, 
                    alteration, disclosure, or destruction.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Data Sharing</h3>
                  <p className="text-gray-700">
                    Data may be shared with authorized authorities as required by law or for regulatory compliance.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Intellectual Property */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The RCS Society Management System and all its content, including but not limited to software, 
              design, text, graphics, and functionality, are the property of the government and are protected 
              by intellectual property laws.
            </p>
            <p className="text-gray-700">
              Users may not copy, reproduce, distribute, or create derivative works without explicit permission.
            </p>
          </Card>

          {/* Limitation of Liability */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              The system is provided "as is" without warranties of any kind. The government shall not be liable 
              for any direct, indirect, incidental, or consequential damages arising from the use of the system.
            </p>
            <p className="text-gray-700">
              Users acknowledge that system availability may vary and that the government is not responsible for 
              any losses resulting from system downtime or technical issues.
            </p>
          </Card>

          {/* Termination */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Termination</h2>
            <p className="text-gray-700 mb-4">
              Access to the system may be terminated or suspended for violations of these terms, fraudulent 
              activities, or as required by law.
            </p>
            <p className="text-gray-700">
              Upon termination, users must cease all use of the system and may be required to provide 
              alternative arrangements for ongoing processes.
            </p>
          </Card>

          {/* Governing Law */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These terms are governed by the laws of the jurisdiction where the system is operated and 
              the relevant cooperative society legislation.
            </p>
            <p className="text-gray-700">
              Any disputes arising from these terms shall be resolved through appropriate legal channels 
              as provided by law.
            </p>
          </Card>

          {/* Changes to Terms */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              The government reserves the right to modify these terms at any time. Users will be notified 
              of significant changes through the system or other appropriate means.
            </p>
            <p className="text-gray-700">
              Continued use of the system after changes constitutes acceptance of the modified terms.
            </p>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Building className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Registrar of Cooperative Societies</p>
                  <p className="text-gray-700">Government Office Complex</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Support Team</p>
                  <p className="text-gray-700">Available through the system helpdesk</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500">
          <p>By using this system, you acknowledge that you have read, understood, and agree to these Terms and Conditions.</p>
        </div>
      </div>
    </div>
  );
};
