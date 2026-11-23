import React, { useState, useCallback } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Upload, FileSpreadsheet, X, Download } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { bulkUploadApplicants } from '../../lib/data/users/api';
import { maxSize } from '../../utils/constants';
import Spinner from '../spinner/Spinner';

interface BulkUploadApplicantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ACCEPTED_TYPES = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
};

const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

const SAMPLE_SHEET_HEADERS = ['firstname', 'lastname', 'email', 'mobile', 'password', 'ncd_id'];
const SAMPLE_SHEET_ROWS = [
  ['John', 'Doe', 'john.doe@example.com', '9876543210', 'Test@123', 'C120010924325'],
  ['Jane', 'Smith', 'jane.smith@example.com', '9876543211', 'Test@123', 'C120010924326'],
];

export const BulkUploadApplicantModal: React.FC<BulkUploadApplicantModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const downloadSampleSheet = () => {
    const csvContent = [
      SAMPLE_SHEET_HEADERS.join(','),
      ...SAMPLE_SHEET_ROWS.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'applicant_bulk_upload_sample_with_ncd.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error('Only Excel (.xlsx, .xls) or CSV files are allowed');
      return;
    }

    setUploadedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize,
  });

  const removeFile = () => {
    setUploadedFile(null);
  };

  const handleClose = () => {
    if (isUploading) return;
    setUploadedFile(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!uploadedFile) {
      toast.error('Please select a sheet file to upload');
      return;
    }

    setIsUploading(true);
    try {
      const result = await bulkUploadApplicants(uploadedFile);

      if (result?.success) {
        toast.success(result?.message || 'Applicants uploaded successfully!');
        setUploadedFile(null);
        onSuccess?.();
        onClose();
      } else {
        throw new Error(result?.message || 'Failed to upload applicants');
      }
    } catch (error) {
      console.error('Error uploading applicants:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload applicants');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Upload Applicants"
      size="lg"
    >
      <div className="relative">
        {isUploading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-white/75">
            <Spinner size="lg" />
            <p className="mt-3 text-sm font-medium text-gray-700">
              Uploading applicants...
            </p>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-gray-600">
              Upload an Excel or CSV sheet to create applicant users in bulk.
              Columns: <span className="font-medium">firstname, lastname, email, mobile, password, ncd_id</span>.
              If <span className="font-medium">ncd_id</span> is provided, the applicant is synced with the existing society that has the same NCD ID.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadSampleSheet}
              disabled={isUploading}
              className="shrink-0"
            >
              <Download className="h-4 w-4 mr-2" />
              Sample Sheet
            </Button>
          </div>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Drop the sheet here' : 'Drag & drop a sheet file here'}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse files
            </p>
            <p className="text-xs text-gray-400">
              Only .xlsx, .xls or .csv files up to 10MB are allowed
            </p>
          </div>

          {uploadedFile && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
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

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!uploadedFile || isUploading}
              className="min-w-[140px]"
            >
              {isUploading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Uploading...</span>
                </div>
              ) : (
                'Upload Sheet'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
