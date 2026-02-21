import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/AdminLayout';
import { useState, useRef, useEffect } from 'react';
import { authAPI } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/router';
import { 
  ArrowLeft,
  Upload,
  X,
  Image as ImageIcon,
  Calendar,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

export default function NuevaObraPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingPrincipal, setUploadingPrincipal] = useState(false);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  
  const [obraId, setObraId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    artista: '',
    descripcion: '',
    tecnica: '',
    dimensiones: '',
    anio: '',
    info_adicional: '',
    precio_base: '',
    incremento_minimo: '',
    precio_comprar_ahora: '',
    fecha_cierre: '',
    estado: 'BORRADOR'
  });

  const [imagenPrincipal, setImagenPrincipal] = useState<string>('');
  const [imagenes, setImagenes] = useState<string[]>([]);
  
  // Archivos locales antes de crear la obra
  const [imagenPrincipalFile, setImagenPrincipalFile] = useState<File | null>(null);
  const [imagenesFiles, setImagenesFiles] = useState<File[]>([]);
  const [imagenPrincipalPreview, setImagenPrincipalPreview] = useState<string>('');
  const [imagenesPreview, setImagenesPreview] = useState<string[]>([]);

  const inputPrincipalRef = useRef<HTMLInputElement>(null);
  const inputGaleriaRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre || !formData.artista || !formData.descripcion) {
      toast.error('Por favor, completa todos los campos requeridos');
      return;
    }

    if (!formData.precio_base || parseFloat(formData.precio_base) <= 0) {
      toast.error('El precio base debe ser mayor a 0');
      return;
    }

    if (!formData.incremento_minimo || parseFloat(formData.incremento_minimo) <= 0) {
      toast.error('El incremento mínimo debe ser mayor a 0');
      return;
    }

    if (!formData.fecha_cierre) {
      toast.error('Debes especificar la fecha de cierre');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        precio_base: parseFloat(formData.precio_base),
        incremento_minimo: parseFloat(formData.incremento_minimo),
        precio_comprar_ahora: formData.precio_comprar_ahora ? parseFloat(formData.precio_comprar_ahora) : null,
        anio: formData.anio ? parseInt(formData.anio) : null
      };

      const response = await authAPI.post('/api/admin/obras', payload);

      if (response.data.success) {
        const newObraId = response.data.data.id;
        setObraId(newObraId);
        toast.success('Obra creada exitosamente');
        
        // Subir imágenes automáticamente si fueron seleccionadas
        let imagenesSubidas = false;
        
        if (imagenPrincipalFile) {
          try {
            setUploadingPrincipal(true);
            const formDataImg = new FormData();
            formDataImg.append('images', imagenPrincipalFile);
            formDataImg.append('tipo', 'principal');
            
            await authAPI.post(`/api/admin/obras/${newObraId}/images`, formDataImg, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            imagenesSubidas = true;
          } catch (error) {
            console.error('Error al subir imagen principal:', error);
            toast.error('Error al subir imagen principal');
          } finally {
            setUploadingPrincipal(false);
          }
        }
        
        if (imagenesFiles.length > 0) {
          try {
            setUploadingGaleria(true);
            const formDataGal = new FormData();
            imagenesFiles.forEach(file => {
              formDataGal.append('images', file);
            });
            formDataGal.append('tipo', 'galeria');
            
            await authAPI.post(`/api/admin/obras/${newObraId}/images`, formDataGal, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            imagenesSubidas = true;
          } catch (error) {
            console.error('Error al subir galería:', error);
            toast.error('Error al subir imágenes de galería');
          } finally {
            setUploadingGaleria(false);
          }
        }
        
        if (imagenesSubidas) {
          toast.success('Imágenes subidas exitosamente');
        }
        
        // Redirigir después de subir imágenes
        setTimeout(() => {
          router.push('/obras');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error al crear obra:', error);
      toast.error(error.response?.data?.message || 'Error al crear obra');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPrincipal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB');
      return;
    }

    // Limpiar preview anterior si existe
    if (imagenPrincipalPreview) {
      URL.revokeObjectURL(imagenPrincipalPreview);
    }

    // Guardar archivo y crear preview
    setImagenPrincipalFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImagenPrincipalPreview(previewUrl);
    toast.success('Imagen principal lista para subir');
  };

  const handleUploadGaleria = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Validar cantidad máxima (10 imágenes)
    if (files.length + imagenesFiles.length > 10) {
      toast.error('Máximo 10 imágenes en la galería');
      return;
    }

    // Validar cada archivo
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen válida`);
        continue;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} supera el tamaño máximo (5MB)`);
        continue;
      }
      
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Limpiar previews anteriores
    imagenesPreview.forEach(url => URL.revokeObjectURL(url));

    // Agregar nuevos archivos
    const newFiles = [...imagenesFiles, ...validFiles];
    setImagenesFiles(newFiles);

    // Crear previews
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setImagenesPreview(newPreviews);

    toast.success(`${validFiles.length} imagen(es) lista(s) para subir`);
  };

  const handleDeleteImage = async (imageUrl: string, tipo: 'principal' | 'galeria') => {
    if (!obraId) return;

    try {
      const response = await authAPI.delete(`/api/admin/obras/${obraId}/images`, {
        data: { imageUrl }
      });

      if (response.data.success) {
        if (tipo === 'principal') {
          setImagenPrincipal('');
        } else {
          setImagenes(prev => prev.filter(img => img !== imageUrl));
        }
        toast.success('Imagen eliminada');
      }
    } catch (error: any) {
      console.error('Error al eliminar imagen:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar imagen');
    }
  };

  // Eliminar imagen principal del preview local
  const handleRemovePrincipalPreview = () => {
    if (imagenPrincipalPreview) {
      URL.revokeObjectURL(imagenPrincipalPreview);
    }
    setImagenPrincipalFile(null);
    setImagenPrincipalPreview('');
    toast.success('Imagen principal removida');
  };

  // Eliminar imagen de galería del preview local
  const handleRemoveGaleriaPreview = (index: number) => {
    // Limpiar URL del preview
    URL.revokeObjectURL(imagenesPreview[index]);
    
    // Actualizar arrays
    setImagenesFiles(prev => prev.filter((_, i) => i !== index));
    setImagenesPreview(prev => prev.filter((_, i) => i !== index));
    
    toast.success('Imagen removida');
  };

  // Limpiar blob URLs al desmontar
  useEffect(() => {
    return () => {
      if (imagenPrincipalPreview) {
        URL.revokeObjectURL(imagenPrincipalPreview);
      }
      imagenesPreview.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/obras"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Volver a obras
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">
              Nueva Obra
            </h1>
            <p className="text-gray-600 mt-1">
              Completa la información de la obra de arte
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información Básica
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la obra *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    required
                    className="input w-full"
                    placeholder="Ej: Amanecer en la Costa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artista *
                  </label>
                  <input
                    type="text"
                    name="artista"
                    value={formData.artista}
                    onChange={handleChange}
                    required
                    className="input w-full"
                    placeholder="Nombre del artista"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Año
                  </label>
                  <input
                    type="number"
                    name="anio"
                    value={formData.anio}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="2024"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Técnica
                  </label>
                  <input
                    type="text"
                    name="tecnica"
                    value={formData.tecnica}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Ej: Óleo sobre lienzo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dimensiones
                  </label>
                  <input
                    type="text"
                    name="dimensiones"
                    value={formData.dimensiones}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="Ej: 80cm x 60cm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="input w-full"
                    placeholder="Descripción detallada de la obra..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Información Adicional
                  </label>
                  <textarea
                    name="info_adicional"
                    value={formData.info_adicional}
                    onChange={handleChange}
                    rows={3}
                    className="input w-full"
                    placeholder="Historia, premios, exposiciones, etc."
                  />
                </div>
              </div>
            </div>

            {/* Precios y Subasta */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Configuración de Subasta
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Base (S/) *
                  </label>
                  <input
                    type="number"
                    name="precio_base"
                    value={formData.precio_base}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    className="input w-full"
                    placeholder="1000.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incremento Mínimo (S/) *
                  </label>
                  <input
                    type="number"
                    name="incremento_minimo"
                    value={formData.incremento_minimo}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0"
                    className="input w-full"
                    placeholder="50.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio Compra Inmediata (S/)
                  </label>
                  <input
                    type="number"
                    name="precio_comprar_ahora"
                    value={formData.precio_comprar_ahora}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="input w-full"
                    placeholder="5000.00 (opcional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Los usuarios podrán comprar directamente a este precio
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4" />
                    Fecha de Cierre *
                  </label>
                  <input
                    type="datetime-local"
                    name="fecha_cierre"
                    value={formData.fecha_cierre}
                    onChange={handleChange}
                    required
                    className="input w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="input w-full"
                  >
                    <option value="BORRADOR">Borrador (no visible)</option>
                    <option value="PUBLICADA">Publicada (visible pero no activa)</option>
                    <option value="ACTIVA">Activa (recibiendo ofertas)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Puedes guardar como borrador y publicar después
                  </p>
                </div>
              </div>
            </div>

            {/* Imágenes */}
            {obraId && (
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Imágenes
                </h2>

                {/* Imagen Principal */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Imagen Principal
                  </label>
                  
                  {imagenPrincipalPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={imagenPrincipalPreview}
                        alt="Imagen principal"
                        className="w-full max-w-xs rounded-lg shadow-md"
                      />
                      <button
                        type="button"
                        onClick={handleRemovePrincipalPreview}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => inputPrincipalRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-400 transition-colors"
                    >
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        Haz clic para seleccionar la imagen principal
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        PNG, JPG hasta 5MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={inputPrincipalRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadPrincipal}
                    className="hidden"
                  />
                </div>

                {/* Galería */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Galería de Imágenes (máx. 10)
                  </label>
                  
                  {imagenesPreview.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {imagenesPreview.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Galería ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGaleriaPreview(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => inputGaleriaRef.current?.click()}
                    disabled={imagenesPreview.length >= 10}
                    className="btn btn-secondary w-full"
                  >
                    {imagenesPreview.length >= 10 ? 'Máximo alcanzado' : 'Agregar imágenes a la galería'}
                  </button>
                  <input
                    ref={inputGaleriaRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadGaleria}
                    className="hidden"
                  />
                </div>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex justify-end gap-3">
              <Link href="/obras" className="btn btn-secondary">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </span>
                ) : (
                  'Guardar Obra'
                )}
              </button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
