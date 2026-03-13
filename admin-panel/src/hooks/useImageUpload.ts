import { useState } from 'react';
import apiClient from '../lib/api';

interface UseImageUploadReturn {
  uploading: boolean;
  error: string | null;
  uploadImage: (file: File) => Promise<string | null>;
  uploadMultipleImages: (files: File[]) => Promise<string[]>;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await apiClient.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.data.url; // Cloudinary devuelve la URL en data.url
      } else {
        throw new Error(response.data.message || 'Error al subir imagen');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al subir imagen';
      setError(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadMultipleImages = async (files: File[]): Promise<string[]> => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images`, file);
      });

      const response = await apiClient.post('/api/upload/multiple', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        return response.data.data.map((img: any) => img.url); // Cloudinary devuelve array de objetos con url
      } else {
        throw new Error(response.data.message || 'Error al subir imágenes');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Error al subir imágenes';
      setError(errorMessage);
      return [];
    } finally {
      setUploading(false);
    }
  };

  return {
    uploading,
    error,
    uploadImage,
    uploadMultipleImages,
  };
};
