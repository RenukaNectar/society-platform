import React, { useState, useCallback } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Upload, FileText, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
// import { createChallan } from "../../lib/data/registrations/api";
import { maxSize } from "../../utils/constants";
import { createRenewal } from "../../lib/data/renewals/api";

interface RenewalChallanUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  societyId: string;
  onSuccess?: () => void;
}

export const RenewalChallanUploadModal: React.FC<
  RenewalChallanUploadModalProps
> = ({ isOpen, onClose, societyId, onSuccess }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];

      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }

      setUploadedFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    maxSize: maxSize,
  });

  const removeFile = () => {
    setUploadedFile(null);
  };

  const handleSubmit = async () => {
    if (!uploadedFile) {
      toast.error("Please select a challan file to upload");
      return;
    }

    setIsUploading(true);

    try {
      const result = await createRenewal(societyId, uploadedFile);
      if (result) {
        toast.success("Renewal challan uploaded successfully!");
        setUploadedFile(null);
        onSuccess?.();
        onClose();
      } else {
        console.log("error: ", result);
        throw new Error("Failed to upload challan");
      }
    } catch (error) {
      toast.error("Challan has been already uploaded");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Renewal Challan"
      size="lg"
    >
      <div className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-4">
            Please upload your renewal challan receipt in PDF format.
          </p>
        </div>

        {/* File Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? "Drop the PDF here" : "Drag & drop a PDF file here"}
          </p>
          <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
          <p className="text-xs text-gray-400">
            Only PDF files up to 10MB are allowed
          </p>
        </div>

        {/* Uploaded File Display */}
        {uploadedFile && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {uploadedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={removeFile}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>

          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!uploadedFile || isUploading}
            className="min-w-[120px]"
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </div>
            ) : (
              "Upload Challan"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
