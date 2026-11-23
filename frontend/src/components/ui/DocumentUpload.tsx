import React from "react";
import { Upload, Check, X, Minus } from "lucide-react";
import { useDocumentUpload } from "../../hooks/useDocumentUpload";

interface DocumentUploadProps {
  label: string;
  onUploadComplete: (documentId: string, documentUrl?: string) => void;
  onUploadCancel: (documentId?: string) => void;
  error?: string;
  required?: boolean;
  existingDocument?: { id: string; url: string };
  onReplace?: (newDocumentId: string, newDocumentUrl?: string) => void;
  /** Sent as `document_type` to `/societies/media` (e.g. `bye_laws` for QR-stamped PDF). */
  documentType?: string;

  multiple?: boolean;
  maxFiles?: number;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  onUploadComplete,
  onUploadCancel,
  error,
  required = false,
  existingDocument,
  onReplace,
  documentType,
  multiple = false,
  maxFiles,
}) => {
  const { uploadState, uploadFile, cancelUpload, resetUpload } =
    useDocumentUpload();

  const supportedFileTypes = [
    ".pdf",
    ".txt",
    ".csv",
    ".xls",
    ".xlsx",
    ".jpg",
    ".jpeg",
    ".png",
  ];

  const acceptAttribute =
    ".pdf,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png";

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Max file validation (for multiple uploads)
    if (multiple && maxFiles && fileArray.length > maxFiles) {
      alert(`You can upload a maximum of ${maxFiles} documents.`);
      return;
    }

    for (const file of fileArray) {
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

      if (!supportedFileTypes.includes(fileExtension)) {
        alert(
          `Unsupported file type: ${file.name}\nAllowed: ${supportedFileTypes.join(
            ", ",
          )}`,
        );
        continue;
      }

      resetUpload();

      const uploadResult = await uploadFile(file, documentType ? { documentType } : undefined);

      if (uploadResult) {
        if (existingDocument && onReplace) {
          onReplace(uploadResult.id, uploadResult.url);
        } else {
          onUploadComplete(uploadResult.id, uploadResult.url);
        }
      }
    }

    // Reset input so same file can be re-selected
    event.target.value = "";
  };

  const handleCancel = () => {
    cancelUpload();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="space-y-2">
        {/* Existing Document */}
        {existingDocument && !uploadState.uploadedId && (
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-900">
                Existing {label}
              </span>
            </div>

            <label className="cursor-pointer">
              <input
                type="file"
                accept={acceptAttribute}
                multiple={multiple}
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50 text-gray-700 cursor-pointer">
                <Upload className="h-3 w-3 mr-1" />
                Replace
              </div>
            </label>
          </div>
        )}

        {/* Upload Button */}
        {!existingDocument &&
          !uploadState.isUploading &&
          !uploadState.uploadedId && (
            <label className="cursor-pointer">
              <input
                type="file"
                accept={acceptAttribute}
                multiple={multiple}
                onChange={handleFileChange}
                className="hidden"
                disabled={uploadState.isUploading}
              />
              <div className="inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50 text-gray-700 cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </div>
            </label>
          )}

        {/* Upload Progress */}
        {uploadState.isUploading && (
          <div className="flex items-center space-x-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                <span>Uploading...</span>
                <span>{uploadState.progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${uploadState.progress}%` }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-red-500 hover:text-red-700 text-xs flex items-center"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </button>
          </div>
        )}

        {/* Upload Success */}
        {uploadState.uploadedId && (
          <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 text-green-700">
              <Check className="h-4 w-4" />
              <span className="text-sm font-medium">
                {label} uploaded successfully
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                resetUpload();
                onUploadCancel(uploadState.uploadedId ?? undefined);
              }}
              className="text-red-500 hover:text-red-700"
            >
              <Minus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
