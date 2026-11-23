import { useState, useRef } from 'react';
import { uploadDocument, UploadDocumentOptions } from '../lib/data/societies/api';
import { toast } from 'react-hot-toast';
import { maxSize } from '../utils/constants';

interface UploadState {
  isUploading: boolean;
  progress: number;
  uploadedId: string | null;
  uploadedUrl: string | null;
  error: string | null;
}

export const useDocumentUpload = () => {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    uploadedId: null,
    uploadedUrl: null,
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    // Check file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Only PDF, TXT, CSV, XLS, XLSX, JPEG, JPG and PNG files are allowed' };
    }

    if (file.size > maxSize) {
      return { isValid: false, error: `File size must be less than ${maxSize}MB` };
    }

    return { isValid: true };
  };

  const uploadFile = async (
    file: File,
    options?: UploadDocumentOptions
  ): Promise<{ id: string; url: string } | null> => {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      toast.error(validation.error!);
      return null;
    }

    // Reset state
    setUploadState({
      isUploading: true,
      progress: 0,
      uploadedId: null,
      uploadedUrl: null,
      error: null,
    });

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      const response = await uploadDocument(
        file,
        (progress) => {
          // Only update progress if not aborted
          if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
            setUploadState(prev => ({ ...prev, progress }));
          }
        },
        abortControllerRef.current,
        options
      );
      
      if (response && response.success) {
        setUploadState({
          isUploading: false,
          progress: 100,
          uploadedId: response.data.id,
          uploadedUrl: response.data.url,
          error: null,
        });
        toast.success('Document uploaded successfully');
        return { id: response.data.id, url: response.data.url };
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message === 'Upload cancelled') {
        setUploadState({
          isUploading: false,
          progress: 0,
          uploadedId: null,
          uploadedUrl: null,
          error: null,
        });
        return null;
      }

      const message = error?.message || 'Upload failed';
      setUploadState({
        isUploading: false,
        progress: 0,
        uploadedId: null,
        uploadedUrl: null,
        error: message,
      });
      toast.error(message);
      return null;
    }
  };

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setUploadState({
        isUploading: false,
        progress: 0,
        uploadedId: null,
        uploadedUrl: null,
        error: null,
      });
      abortControllerRef.current = null;
    }
  };

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      uploadedId: null,
      uploadedUrl: null,
      error: null,
    });
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return {
    uploadState,
    uploadFile,
    cancelUpload,
    resetUpload,
  };
}; 