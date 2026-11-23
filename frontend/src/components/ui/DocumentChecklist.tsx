import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { CheckCircle, FileText, AlertCircle, X } from 'lucide-react';

interface DocumentChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  title?: string;
  description?: string;
}

const requiredDocuments = [
  {
    id: 'bye_laws',
    name: 'Bye-law',
    description: 'Society bye-laws document',
    required: true
  },
  {
    id: 'bank_certificate',
    name: 'Bank Certificate',
    description: 'Bank account opening certificate',
    required: true
  },
  {
    id: 'economic_scheme',
    name: 'Economic Scheme',
    description: 'Economic scheme and business plan',
    required: true
  },
  {
    id: 'contributor_list',
    name: 'Contributor List',
    description: 'List of society contributors/members',
    required: true
  },
  {
    id: 'circular_minutes_of_meeting',
    name: 'Circular Minutes of Meeting',
    description: 'Meeting circular and minutes',
    required: true
  },
  {
    id: 'land_document',
    name: 'Land Document',
    description: 'Land ownership or lease documents',
    required: true
  },
  {
    id: 'full_particulars_of_the_promoter',
    name: 'Full Particulars of the Promoter',
    description: 'Complete details of society promoters',
    required: true
  },
  {
    id: 'circular_for_promoters_meeting',
    name: 'Circular for Promoters\' Meeting',
    description: 'Meeting circular for promoters',
    required: true
  },
  {
    id: 'minutes_of_meeting_of_promoters_meeting',
    name: 'Minutes of Meeting of Promoters\' Meeting',
    description: 'Minutes of promoters meeting',
    required: true
  },
  {
    id: 'custom_documents',
    name: 'Custom Documents',
    description: 'Additional supporting documents (optional)',
    required: false
  }
];

export const DocumentChecklist: React.FC<DocumentChecklistProps> = ({
  isOpen,
  onClose,
  onProceed,
  title = "Required Documents Checklist",
  description = "Please ensure you have the following documents ready before proceeding with the registration:"
}) => {
  const requiredDocs = requiredDocuments.filter(doc => doc.required);
  const optionalDocs = requiredDocuments.filter(doc => !doc.required);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {/* Important Notes */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-2 mb-2">Important Notes:</h4>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>• All documents must be in PDF,XLS, XLSX , DOC, DOCX format</li>
                  <li>• Maximum file size: 30MB per document</li>
                  <li>• Ensure all documents are clear and legible</li>
                  <li>• Required documents must be uploaded to complete registration</li>
                </ul>
              </div>
            </div>
          </div>

        <div className="space-y-6">
          {/* Required Documents */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-900">Required Documents</h3>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {requiredDocs.length} documents
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {requiredDocs.map((doc, index) => (
                <div key={doc.id} className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900">{doc.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                  </div>
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Optional Documents */}
          {optionalDocs.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FileText className="h-5 w-5  text-red-500" />
                <h3 className="text-lg font-medium text-gray-900">Optional Documents</h3>
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                  {optionalDocs.length} documents
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {optionalDocs.map((doc, index) => (
                  <div key={doc.id} className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-red-600">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">{doc.name}</h4>
                      <p className="text-xs text-gray-600 mt-1">{doc.description}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-red-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

         
          
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={onProceed}
            className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Proceed to Registration
          </Button>
        </div>
      </div>
    </Modal>
  );
};
