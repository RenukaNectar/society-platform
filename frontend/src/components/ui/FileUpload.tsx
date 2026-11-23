import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { clsx } from 'clsx';
import { FileUpload as FileUploadType } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import toast from 'react-hot-toast';

interface FileUploadProps {
  label?: string;
  error?: string;
  files: FileUploadType[];
  onFilesChange: (files: FileUploadType[]) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  error,
  files,
  onFilesChange,
  accept = {
    'application/pdf': ['.pdf'],
    'text/plain': ['.txt'],
    'image/*': ['.png', '.jpg', '.jpeg'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/csv': ['.csv'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  },
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024,
  className,
}) => {
  const { mode } =useSelector((state: RootState) => state.theme);
  const [uploadError, setUploadError] = useState('');

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (files.length >= maxFiles) {
        toast.error(`Only ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed to upload`);
        return;
      }

      const remainingSlots = maxFiles - files.length;
      const filesToAdd = acceptedFiles.slice(0, remainingSlots);

      const newFiles: FileUploadType[] = filesToAdd.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        url: "",
        uploadedAt: new Date().toISOString(),
      }));

      onFilesChange([...files, ...newFiles]);

      if (acceptedFiles.length > remainingSlots) {
        toast.error(`Only ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed to upload`);
      }
    },
    [files, maxFiles, onFilesChange]
  );

  const onDropRejected = useCallback(
    (fileRejections: any[]) => {
      toast.error(`Only ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed to upload`);
    },
    [maxFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept,
    maxFiles,
    maxSize,
  });

  const removeFile = (fileId: string) => {
    setUploadError('');
    onFilesChange(files.filter((file) => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label className={`block text-sm font-medium text-gray-700 ${mode}:text-gray-300 mb-2`}>
          {label}
        </label>
      )}

      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors duration-200',
          isDragActive
            ? `border-indigo-500 bg-indigo-50 ${mode}:bg-indigo-900/20`
            : `border-gray-300 ${mode}:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 ${mode}:hover:bg-gray-800`,
          (error || uploadError) && `border-red-500 ${mode}:border-red-400`
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className={`text-sm text-gray-600 ${mode}:text-gray-400`}>
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop files here, or click to select files'}
        </p>
        <p className={`text-xs text-gray-500 ${mode}:text-gray-500 mt-2`}>
          Supported: PDF, TXT, DOC, DOCX, CSV, XLS, XLSX, Images up to {formatFileSize(maxSize)}
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className={`flex items-center justify-between p-3 bg-gray-50 ${mode}:bg-gray-800 rounded-lg`}
            >
              <div className="flex items-center space-x-3">
                <File className="h-5 w-5 text-gray-400" />
                <div>
                  <p className={`text-sm font-medium text-gray-900 ${mode}:text-gray-100`}>
                    {file.name}
                  </p>
                  <p className={`text-xs text-gray-500 ${mode}:text-gray-400`}>
                    {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="text-red-500 hover:text-red-700 transition-colors duration-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(error || uploadError) && (
        <p className={`mt-1 text-xs text-red-600 ${mode}:text-red-400`}>
          {uploadError || error}
        </p>
      )}
    </div>
  );
};
