import React, { useState, useRef } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  currentImage?: string;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  currentImage,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const [preview, setPreview] = useState<string>(currentImage || '');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Tipo de archivo no permitido. Solo se aceptan: JPG, PNG, WebP';
    }
    
    if (file.size > maxSize) {
      return `El archivo es muy grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB`;
    }
    
    return null;
  };

  const handleFileSelect = (file: File) => {
    setError('');
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Notificar al componente padre
    onImageSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <div className="relative w-full h-48">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain rounded"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-colors duration-200 flex items-center justify-center">
              <span className="text-white font-medium opacity-0 hover:opacity-100 transition-opacity duration-200">
                Cambiar imagen
              </span>
            </div>
          </div>
        ) : (
          <div className="py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Haz clic para subir</span> o arrastra una imagen aquí
            </p>
            <p className="mt-1 text-xs text-gray-500">
              PNG, JPG, WebP hasta {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes.join(',')}
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
};

export default ImageUpload;
