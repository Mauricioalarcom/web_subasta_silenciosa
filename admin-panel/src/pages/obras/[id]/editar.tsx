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
  DollarSign,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function EditarObraPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPrincipal, setUploadingPrincipal] = useState(false);
  const [uploadingGaleria, setUploadingGaleria] = useState(false);
  
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
  const [numeroOfertas, setNumeroOfertas] = useState(0);

  const inputPrincipalRef = useRef<HTMLInputElement>(null);
  const inputGaleriaRef = useRef<HTMLInputElement>(null);

  // Cargar datos de la obra
  useEffect(() => {
    if (id) {
      loadObra();
    }
  }, [id]);

  const loadObra = async () => {
    try {
      setLoading(true);
      const response = await authAPI.get(`/api/admin/obras/${id}`);
      
      if (response.data.success) {
        const obra = response.data.data;
        
        setFormData({
          nombre: obra.nombre || '',
          artista: obra.artista || '',
          descripcion: obra.descripcion || '',
          tecnica: obra.tecnica || '',
          dimensiones: obra.dimensiones || '',
          anio: obra.anio ? obra.anio.toString() : '',
          info_adicional: obra.info_adicional || '',
          precio_base: obra.precio_base ? parseFloat(obra.precio_base).toString() : '',
          incremento_minimo: obra.incremento_minimo ? parseFloat(obra.incremento_minimo).toString() : '',
          precio_comprar_ahora: obra.precio_comprar_ahora ? parseFloat(obra.precio_comprar_ahora).toString() : '',
          fecha_cierre: obra.fecha_cierre ? new Date(obra.fecha_cierre).toISOString().slice(0, 16) : '',
          estado: obra.estado || 'BORRADOR'
        });

        setImagenPrincipal(obra.imagen_principal || '');
        setImagenes(obra.imagenes || []);
        setNumeroOfertas(obra.numero_ofertas || 0);
      }
    } catch (error: any) {
      console.error('Error al cargar obra:', error);
      toast.error(error.response?.data?.message || 'Error al cargar obra');
      router.push('/obras');
    } finally {
      setLoading(false);
    }
  };

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
      setSaving(true);

      const payload = {
        ...formData,
        precio_base: parseFloat(formData.precio_base),
        incremento_minimo: parseFloat(formData.incremento_minimo),
        precio_comprar_ahora: formData.precio_comprar_ahora ? parseFloat(formData.precio_comprar_ahora) : null,
        anio: formData.anio ? parseInt(formData.anio) : null
      };

      const response = await authAPI.put(`/api/admin/obras/${id}`, payload);

      if (response.data.success) {
        toast.success('Obra actualizada exitosamente');
        setTimeout(() => {
          router.push('/obras');
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error al actualizar obra:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar obra');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPrincipal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingPrincipal(true);

      const formData = new FormData();
      formData.append('images', file);
      formData.append('tipo', 'principal');

      const response = await authAPI.post(`/api/admin/obras/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setImagenPrincipal(response.data.data.imagen_principal);
        toast.success('Imagen principal actualizada');
      }
    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      toast.error(error.response?.data?.message || 'Error al subir imagen');
    } finally {
      setUploadingPrincipal(false);
    }
  };

  const handleUploadGaleria = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingGaleria(true);

      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });
      formData.append('tipo', 'galeria');

      const response = await authAPI.post(`/api/admin/obras/${id}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setImagenes(response.data.data.imagenes || []);
        toast.success(`${files.length} imagen(es) agregada(s)`);
      }
    } catch (error: any) {
      console.error('Error al subir imágenes:', error);
      toast.error(error.response?.data?.message || 'Error al subir imágenes');
    } finally {
      setUploadingGaleria(false);
    }
  };

  const handleDeleteImage = async (imageUrl: string, tipo: 'principal' | 'galeria') => {
    if (!confirm('¿Eliminar esta imagen?')) return;

    try {
      const response = await authAPI.delete(`/api/admin/obras/${id}/images`, {
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

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Cargando obra...</p>
              </div>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

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
              Editar Obra
            </h1>
            <p className="text-gray-600 mt-1">
              Modifica la información de la obra
            </p>
            {numeroOfertas > 0 && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Esta obra tiene <strong>{numeroOfertas} oferta(s)</strong>. No puedes cambiar el precio base.
                </p>
              </div>
            )}
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
                    disabled={numeroOfertas > 0}
                    className="input w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="1000.00"
                  />
                  {numeroOfertas > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      No se puede modificar con ofertas activas
                    </p>
                  )}
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
                    <option value="CERRADA">Cerrada</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Imágenes */}
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
                
                {imagenPrincipal ? (
                  <div className="relative inline-block">
                    <img
                      src={imagenPrincipal}
                      alt="Imagen principal"
                      className="w-full max-w-xs rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(imagenPrincipal, 'principal')}
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
                    {uploadingPrincipal ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Haz clic para subir la imagen principal
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PNG, JPG hasta 5MB
                        </p>
                      </>
                    )}
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
                  Galería de Imágenes ({imagenes.length})
                </label>
                
                {imagenes.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {imagenes.map((imagen, index) => (
                      <div key={index} className="relative">
                        <img
                          src={imagen}
                          alt={`Galería ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteImage(imagen, 'galeria')}
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
                  disabled={uploadingGaleria}
                  className="btn btn-secondary w-full"
                >
                  {uploadingGaleria ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      Subiendo...
                    </span>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Agregar más imágenes
                    </>
                  )}
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

            {/* Botones de Acción */}
            <div className="flex justify-end gap-3">
              <Link href="/obras" className="btn btn-secondary">
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Guardando...
                  </span>
                ) : (
                  'Guardar Cambios'
                )}
              </button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
