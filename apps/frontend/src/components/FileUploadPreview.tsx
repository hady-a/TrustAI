import React, { useCallback, useState } from 'react';
import { Upload, X, FileVideo, FileAudio, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export interface UploadedFile {
  file: File;
  id?: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  progress?: number;
}

export interface FileUploadPreviewProps {
  onFilesSelected: (files: File[]) => void;
  onFilesRemoved?: (fileNames: string[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  disabled?: boolean;
}

const FILE_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string }> = {
  'video/mp4': { icon: <FileVideo className="w-6 h-6" />, color: 'text-blue-600' },
  'video/mpeg': { icon: <FileVideo className="w-6 h-6" />, color: 'text-blue-600' },
  'video/quicktime': { icon: <FileVideo className="w-6 h-6" />, color: 'text-blue-600' },
  'video/x-msvideo': { icon: <FileVideo className="w-6 h-6" />, color: 'text-blue-600' },
  'video/webm': { icon: <FileVideo className="w-6 h-6" />, color: 'text-blue-600' },
  'audio/mpeg': { icon: <FileAudio className="w-6 h-6" />, color: 'text-purple-600' },
  'audio/wav': { icon: <FileAudio className="w-6 h-6" />, color: 'text-purple-600' },
  'audio/ogg': { icon: <FileAudio className="w-6 h-6" />, color: 'text-purple-600' },
  'audio/aac': { icon: <FileAudio className="w-6 h-6" />, color: 'text-purple-600' },
  'text/plain': { icon: <FileText className="w-6 h-6" />, color: 'text-gray-600' },
  'application/pdf': { icon: <FileText className="w-6 h-6" />, color: 'text-red-600' },
  'application/json': { icon: <FileText className="w-6 h-6" />, color: 'text-gray-600' },
};

/**
 * FileUploadPreview Component
 * Displays file upload area with drag-and-drop support
 * Shows preview of selected files with size and type information
 */
export const FileUploadPreview: React.FC<FileUploadPreviewProps> = ({
  onFilesSelected,
  onFilesRemoved,
  maxFiles = 5,
  maxFileSize = 500 * 1024 * 1024, // 500MB
  acceptedTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'text/plain',
    'application/pdf',
  ],
  disabled = false,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFiles = (files: FileList | File[]): { valid: UploadedFile[]; errors: string[] } => {
    const newErrors: string[] = [];
    const validFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file size
      if (file.size > maxFileSize) {
        newErrors.push(
          `${file.name} exceeds maximum file size (${formatBytes(maxFileSize)})`
        );
        continue;
      }

      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        newErrors.push(
          `${file.name} has unsupported file type. Supported: ${acceptedTypes.join(', ')}`
        );
        continue;
      }

      // Check total file count
      if (uploadedFiles.length + validFiles.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`);
        break;
      }

      validFiles.push({
        file,
        status: 'pending',
        preview: createPreview(file),
      });
    }

    return { valid: validFiles, errors: newErrors };
  };

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const { valid, errors } = validateFiles(files);

      if (errors.length > 0) {
        setErrors(errors);
        return;
      }

      setErrors([]);
      const newFiles = [...uploadedFiles, ...valid];
      setUploadedFiles(newFiles);

      // Notify parent component
      onFilesSelected(newFiles.map((f) => f.file));
    },
    [uploadedFiles, onFilesSelected]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileName: string) => {
    const newFiles = uploadedFiles.filter((f) => f.file.name !== fileName);
    setUploadedFiles(newFiles);
    onFilesRemoved?.(newFiles.map((f) => f.file.name));
    onFilesSelected(newFiles.map((f) => f.file));
  };

  const clearAll = () => {
    setUploadedFiles([]);
    setErrors([]);
    onFilesRemoved?.(uploadedFiles.map((f) => f.file.name));
    onFilesSelected([]);
  };

  const getFileIcon = (mimeType: string) => {
    return FILE_TYPE_CONFIG[mimeType] || FILE_TYPE_CONFIG['text/plain'];
  };

  return (
    <div className="w-full space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          multiple
          onChange={handleChange}
          disabled={disabled}
          accept={acceptedTypes.join(',')}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          title="Upload files"
          aria-label="File upload input"
        />

        <div className="flex flex-col items-center">
          <Upload className={`w-12 h-12 mb-3 ${dragActive ? 'text-blue-600' : 'text-gray-400'}`} />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Drag files here or click to upload
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            Supported: Video, Audio, Text (max {formatBytes(maxFileSize)} per file)
          </p>
          <div className="text-xs text-gray-500">
            Maximum {maxFiles} files allowed
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          {errors.map((error, index) => (
            <div key={index} className="flex items-start mb-2 last:mb-0">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold text-gray-900">
              Uploaded Files ({uploadedFiles.length}/{maxFiles})
            </h4>
            {uploadedFiles.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-3">
            {uploadedFiles.map((uploadedFile) => {
              const iconData = getFileIcon(uploadedFile.file.type);
              return (
                <div
                  key={uploadedFile.file.name}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                >
                  <div className="flex items-center flex-1 min-w-0">
                    <div className={`${iconData.color} flex-shrink-0`}>
                      {iconData.icon}
                    </div>

                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatBytes(uploadedFile.file.size)}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="ml-2 flex-shrink-0 flex items-center">
                    {uploadedFile.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {uploadedFile.status === 'error' && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFile(uploadedFile.file.name)}
                      className="ml-2 text-gray-400 hover:text-red-600 transition"
                      title="Remove file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Info */}
          {uploadedFiles.some((f) => f.status === 'uploading') && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                Uploading {uploadedFiles.filter((f) => f.status === 'uploading').length} file(s)...
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State Info */}
      {uploadedFiles.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No files selected yet</p>
        </div>
      )}
    </div>
  );
};

/**
 * Utility function to format bytes to human-readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Create preview data for files
 */
function createPreview(file: File): string | undefined {
  if (file.type.startsWith('image/')) {
    return URL.createObjectURL(file);
  }
  return undefined;
}

export default FileUploadPreview;
