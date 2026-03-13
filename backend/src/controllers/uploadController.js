const cloudinary = require('../config/cloudinary');
const { ValidationError } = require('../middleware/errorHandler');

/**
 * Subir imagen a Cloudinary
 */
const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No se ha proporcionado ningún archivo');
    }

    // Subir a Cloudinary usando buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'subasta_silenciosa', // Carpeta en Cloudinary
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' }, // Redimensionar
            { quality: 'auto' }, // Optimizar calidad
            { format: 'webp' } // Convertir a WebP para mejor rendimiento
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      
      uploadStream.end(req.file.buffer);
    });

    res.status(200).json({
      success: true,
      message: 'Imagen subida exitosamente',
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      }
    });

  } catch (error) {
    console.error('Error al subir imagen:', error);
    next(error);
  }
};

/**
 * Subir múltiples imágenes a Cloudinary
 */
const uploadMultipleImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new ValidationError('No se han proporcionado archivos');
    }

    // Subir todas las imágenes en paralelo
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'subasta_silenciosa',
            resource_type: 'image',
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto' },
              { format: 'webp' }
            ]
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
                format: result.format,
                bytes: result.bytes
              });
            }
          }
        );
        
        uploadStream.end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);

    res.status(200).json({
      success: true,
      message: `${results.length} imágenes subidas exitosamente`,
      data: results
    });

  } catch (error) {
    console.error('Error al subir múltiples imágenes:', error);
    next(error);
  }
};

/**
 * Eliminar imagen de Cloudinary
 */
const deleteImage = async (req, res, next) => {
  try {
    const { public_id } = req.params;

    if (!public_id) {
      throw new ValidationError('public_id es requerido');
    }

    // Eliminar de Cloudinary
    const result = await cloudinary.uploader.destroy(public_id);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Imagen eliminada exitosamente'
      });
    } else {
      throw new Error('No se pudo eliminar la imagen');
    }

  } catch (error) {
    console.error('Error al eliminar imagen:', error);
    next(error);
  }
};

/**
 * Obtener información de imagen de Cloudinary
 */
const getImageInfo = async (req, res, next) => {
  try {
    const { public_id } = req.params;
    
    if (!public_id) {
      throw new ValidationError('public_id es requerido');
    }

    // Obtener información de Cloudinary
    const result = await cloudinary.api.resource(public_id);
    
    res.status(200).json({
      success: true,
      data: {
        public_id: result.public_id,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
        created_at: result.created_at
      }
    });

  } catch (error) {
    console.error('Error al obtener información de imagen:', error);
    next(error);
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  getImageInfo
};
