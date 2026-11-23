import React, { useState, useCallback } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Upload, FileText, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import Spinner from "../spinner/Spinner";
import { useDocumentUpload } from "../../hooks/useDocumentUpload";
import { uploadSignature } from "../../lib/data/signature/api";
import { removeBackground } from "@imgly/background-removal";

export const SignatureUploadModal = ({
  isOpen,
  onClose,
  onSuccess,
}: any) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { uploadFile } = useDocumentUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    const ext = "." + selectedFile.name.split(".").pop()?.toLowerCase();

    const allowed = [
      ".jpeg",
      ".jpg",
      ".png"
    ];

    if (!allowed.includes(ext)) {
      toast.error("Invalid file type");
      return;
    }

    setFile(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg",".jpeg"]
    }
  });

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);

    try {
      let fileToUpload = file;

      if (file.type.startsWith("image/")) {
        const blob = await removeBackground(file);

        fileToUpload = new File([blob], "signature.png", {
          type: "image/png",
        });
      }

      // upload file
      const res = await uploadFile(fileToUpload);

      if (res?.id) {
        await uploadSignature(res.id);
      }

      toast.success("Signature uploaded successfully!");
      setFile(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Signature"
      size="lg"
    >
      <div className="relative">

        {isUploading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-white/75">
            <Spinner size="lg" />
            <p className="mt-3 text-sm font-medium text-gray-700">
              Uploading signature...
            </p>
          </div>
        )}

        <div className="space-y-6">

          {/*  INFO */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Please upload your signature document.
            </p>
          </div>

          {/*  DROPZONE */}
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
              {isDragActive
                ? "Drop file here"
                : "Drag & drop file here"}
            </p>

            <p className="text-sm text-gray-500 mb-4">
              or click to browse
            </p>

            <p className="text-xs text-gray-400">
              Allowed: PDF, DOC, PNG
            </p>
          </div>

          {/*  FILE PREVIEW */}
          {file && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/*  ACTION BUTTONS (BOTTOM RIGHT) */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!file || isUploading}
              className="min-w-[140px]"
            >
              {isUploading ? "Uploading..." : "Upload Signature"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};