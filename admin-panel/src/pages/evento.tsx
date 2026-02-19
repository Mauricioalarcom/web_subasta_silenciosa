import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/AdminLayout';
import { authAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {Calendar, Save, AlertCircle, Image as ImageIcon, X } from 'lucide-react';

interface Evento {
  id: string;
  nombre: string;
  organizacion: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_cierre: string;
  logo_url: string | null;
  banner_url: string | null;
  email_contacto: string;
  telefono_contacto: string | null;
  mensaje_bienvenida: string | null;
  terminos: string | null;
  estado: string;
}

export default function EventoPage() {
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    organizacion: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_cierre: '',
    email_contacto: '',
    telefono_contacto: '',
    mensaje_bienvenida: '',
    terminos: '',
    estado: 'ACTIVO'
  });

  // Cargar datos del evento
  useEffect(() => {
    loadEvento();
  }, []);

  const loadEvento = async () => {
    try {
      setLoading(true);
      const response = await authAPI.get('/api/admin/evento');
      
      if (response.data.success) {
        const data = response.data.data;
        setEvento(data);
        
        // Llenar formulario con datos existentes
        setFormData({
          nombre: data.nombre || '',
          organizacion: data.organizacion || '',
          descripcion: data.descripcion || '',
          fecha_inicio: data.fecha_inicio ? new Date(data.fecha_inicio).toISOString().slice(0, 16) : '',
          fecha_cierre: data.fecha_cierre ? new Date(data.fecha_cierre).toISOString().slice(0, 16) : '',
          email_contacto: data.email_contacto || '',
          telefono_contacto: data.telefono_contacto || '',
          mensaje_bienvenida: data.mensaje_bienvenida || '',
          terminos: data.terminos || '',
          estado: data.estado || 'ACTIVO'
        });
      }
    } catch (error: any) {
      console.error('Error al cargar evento:', error);
      toast.error(error.response?.data?.message || 'Error al cargar el evento');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre || !formData.fecha_inicio || !formData.fecha_cierre) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    if (new Date(formData.fecha_cierre) <= new Date(formData.fecha_inicio)) {
      toast.error('La fecha de cierre debe ser posterior a la fecha de inicio');
      return;
    }

    try {
      setSaving(true);
      const response = await authAPI.put('/api/admin/evento', formData);
      
      if (response.data.success) {
        toast.success('Evento actualizado exitosamente');
        setEvento(response.data.data);
      }
    } catch (error: any) {
      console.error('Error al actualizar evento:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar el evento');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File, tipo: 'logo' | 'banner') => {
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    formDataUpload.append('tipo', tipo);

    try {
      if (tipo === 'logo') {
        setUploadingLogo(true);
      } else {
        setUploadingBanner(true);
      }

      const response = await authAPI.post('/api/admin/evento/image', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success(`${tipo === 'logo' ? 'Logo' : 'Banner'} subido exitosamente`);
        setEvento(response.data.data.evento);
      }
    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      toast.error(error.response?.data?.message || 'Error al subir la imagen');
    } finally {
      if (tipo === 'logo') {
        setUploadingLogo(false);
      } else {
        setUploadingBanner(false);
      }
    }
  };

  const handleDeleteImage = async (tipo: 'logo' | 'banner') => {
    if (!confirm(`¿Estás seguro de eliminar el ${tipo === 'logo' ? 'logo' : 'banner'}?`)) {
      return;
    }

    try {
      const response = await authAPI.delete(`/api/admin/evento/image/${tipo}`);
      
      if (response.data.success) {
        toast.success(`${tipo === 'logo' ? 'Logo' : 'Banner'} eliminado exitosamente`);
        loadEvento(); // Recargar evento
      }
    } catch (error: any) {
      console.error('Error al eliminar imagen:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar la imagen');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AdminLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Configuración del Evento
            </h1>
            <p className="text-gray-600 mt-1">
              Administra la información general del evento de subasta
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información Básica */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información Básica
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre del Evento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="input"
                    placeholder="Ej: Subasta de Arte 2026"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Organización
                  </label>
                  <input
                    type="text"
                    name="organizacion"
                    value={formData.organizacion}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="Ej: Galería Arte & Cultura"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleInputChange}
                  rows={3}
                  className="input"
                  placeholder="Describe brevemente el evento"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Inicio <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="datetime-local"
                      name="fecha_inicio"
                      value={formData.fecha_inicio}
                      onChange={handleInputChange}
                      required
                      className="input pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Cierre <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="datetime-local"
                      name="fecha_cierre"
                      value={formData.fecha_cierre}
                      onChange={handleInputChange}
                      required
                      className="input pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email de Contacto
                  </label>
                  <input
                    type="email"
                    name="email_contacto"
                    value={formData.email_contacto}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="contacto@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    name="telefono_contacto"
                    value={formData.telefono_contacto || ''}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="+51 999 999 999"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="input"
                >
                  <option value="BORRADOR">Borrador</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="FINALIZADO">Finalizado</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>

            {/* Imágenes */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Imágenes del Evento
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo
                  </label>
                  
                  {evento?.logo_url ? (
                    <div className="relative">
                      <img
                        src={`http://localhost:4000${evento.logo_url}`}
                        alt="Logo"
                        className="w-full h-40 object-contain border-2 border-gray-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage('logo')}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingLogo ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        ) : (
                          <>
                            <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Click para subir logo</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG (MAX. 5MB)</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0], 'logo');
                          }
                        }}
                        disabled={uploadingLogo}
                      />
                    </label>
                  )}
                </div>

                {/* Banner */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Banner
                  </label>
                  
                  {evento?.banner_url ? (
                    <div className="relative">
                      <img
                        src={`http://localhost:4000${evento.banner_url}`}
                        alt="Banner"
                        className="w-full h-40 object-cover border-2 border-gray-200 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage('banner')}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingBanner ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        ) : (
                          <>
                            <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Click para subir banner</p>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG (MAX. 5MB)</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(e.target.files[0], 'banner');
                          }
                        }}
                        disabled={uploadingBanner}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Mensajes y Términos
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje de Bienvenida
                </label>
                <textarea
                  name="mensaje_bienvenida"
                  value={formData.mensaje_bienvenida || ''}
                  onChange={handleInputChange}
                  rows={3}
                  className="input"
                  placeholder="Mensaje que verán los participantes al ingresar"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Términos y Condiciones
                </label>
                <textarea
                  name="terminos"
                  value={formData.terminos || ''}
                  onChange={handleInputChange}
                  rows={5}
                  className="input"
                  placeholder="Escribe los términos y condiciones de la subasta"
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-gray-500">
                <AlertCircle className="w-4 h-4 mr-1" />
                Los cambios se guardarán inmediatamente
              </div>
              
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
