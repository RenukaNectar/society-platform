import React from 'react';
import { Card } from '../components/ui/Card';
import { Shield, Lock, Eye, Database, Users, Building, CheckCircle } from 'lucide-react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-[60%] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">          
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Introduction */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              The RCS Society Management System ("we," "our," or "us") is committed to protecting your privacy 
              and ensuring the security of your personal information. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our system.
            </p>
            <p className="text-gray-700">
              By using our system, you consent to the data practices described in this policy. This policy applies 
              to all users of the system, including society members, officials, and administrative staff.
            </p>
          </Card>

          {/* Information We Collect */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Personal Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                    <li>Name, address, and contact details</li>
                    <li>Identity documents and verification information</li>
                    <li>Professional qualifications and experience</li>
                    <li>Bank account and financial information</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Society Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                    <li>Society registration details and byelaws</li>
                    <li>Member lists and membership details</li>
                    <li>Financial records and audit reports</li>
                    <li>Meeting minutes and resolutions</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Database className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">System Usage Data</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                    <li>Login times and session information</li>
                    <li>Pages visited and actions performed</li>
                    <li>System logs and error reports</li>
                    <li>Communication records</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* How We Use Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Information</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Primary Purposes</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                    <li>Processing society registrations and amendments</li>
                    <li>Managing audit requests and compliance</li>
                    <li>Facilitating election processes</li>
                    <li>Providing administrative services</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Secondary Purposes</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                    <li>System improvement and maintenance</li>
                    <li>Legal compliance and regulatory reporting</li>
                    <li>Security and fraud prevention</li>
                    <li>Communication and notifications</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Information Sharing */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Authorized Sharing</h3>
                  <p className="text-gray-700">
                    We may share your information with authorized government officials, regulatory bodies, 
                    and law enforcement agencies as required by law or for regulatory compliance.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Society Members</h3>
                  <p className="text-gray-700">
                    Certain information may be shared with other members of your society as required 
                    for governance and transparency purposes.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Third-Party Service Providers</h3>
                  <p className="text-gray-700">
                    We may engage third-party service providers for system maintenance, hosting, 
                    and security services, with appropriate data protection agreements in place.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Data Security */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Lock className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Security Measures</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                    <li>Encryption of sensitive data in transit and at rest</li>
                    <li>Multi-factor authentication for user accounts</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Access controls and role-based permissions</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Lock className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Data Breach Response</h3>
                  <p className="text-gray-700">
                    In the event of a data breach, we will notify affected users and relevant authorities 
                    as required by law, and take immediate steps to contain and remediate the breach.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Data Retention */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your information for as long as necessary to fulfill the purposes outlined in this policy, 
              comply with legal obligations, resolve disputes, and enforce our agreements.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Eye className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Retention Periods</h3>
                  <p className="text-gray-700">
                    Society records are typically retained for 10-15 years, while personal information 
                    may be retained for shorter periods as required by law.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Your Rights */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Access and Correction</h3>
                  <p className="text-gray-700">
                    You have the right to access, review, and correct your personal information 
                    through the system or by contacting our support team.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Data Portability</h3>
                  <p className="text-gray-700">
                    You may request a copy of your data in a structured, machine-readable format 
                    for transfer to another system.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Withdrawal of Consent</h3>
                  <p className="text-gray-700">
                    You may withdraw your consent for certain data processing activities, 
                    though this may affect your ability to use certain system features.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Cookies and Tracking */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-700 mb-4">
              Our system uses essential cookies and similar technologies to provide core functionality, 
              maintain security, and improve user experience.
            </p>
            <div className="space-y-3">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Types of Cookies Used</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Session cookies for authentication and security</li>
                  <li>Preference cookies for user settings</li>
                  <li>Analytics cookies for system performance monitoring</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Children's Privacy */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our system is not intended for use by individuals under the age of 18. We do not knowingly 
              collect personal information from children without appropriate parental consent.
            </p>
            <p className="text-gray-700">
              If we become aware that we have collected personal information from a child without proper consent, 
              we will take steps to delete such information promptly.
            </p>
          </Card>

          {/* International Transfers */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information is primarily stored and processed within the jurisdiction where the system operates. 
              Any international transfers will comply with applicable data protection laws and regulations.
            </p>
            <p className="text-gray-700">
              We ensure that appropriate safeguards are in place to protect your data during any transfers.
            </p>
          </Card>

          {/* Changes to Policy */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time to reflect changes in our practices, 
              technology, legal requirements, or other factors.
            </p>
            <p className="text-gray-700">
              We will notify you of any material changes through the system or other appropriate means. 
              Your continued use of the system after changes constitutes acceptance of the updated policy.
            </p>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Building className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Data Protection Officer</h3>
                  <p className="text-gray-700">Registrar of Cooperative Societies</p>
                  <p className="text-gray-700">Government Office Complex</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Privacy Inquiries</h3>
                  <p className="text-gray-700">Available through the system helpdesk</p>
                  <p className="text-gray-700">Email: privacy@rcs-system.gov</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Users className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">General Support</h3>
                  <p className="text-gray-700">System helpdesk and support channels</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Legal Basis */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Legal Basis for Processing</h2>
            <p className="text-gray-700 mb-4">
              We process your personal information based on the following legal grounds:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><strong>Legal Obligation:</strong> Processing required by cooperative society laws and regulations</li>
              <li><strong>Contract Performance:</strong> Processing necessary to provide system services</li>
              <li><strong>Legitimate Interest:</strong> Processing for system security and improvement</li>
              <li><strong>Consent:</strong> Processing based on your explicit consent for specific purposes</li>
            </ul>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500">
          <p>
            This Privacy Policy is effective as of the date shown above. By using our system, 
            you acknowledge that you have read and understood this policy.
          </p>
        </div>
      </div>
    </div>
  );
};