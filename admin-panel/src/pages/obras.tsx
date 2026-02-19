import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/AdminLayout';

export default function ObrasPage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Gestión de Obras
          </h1>
          <div className="card">
            <p className="text-gray-600">
              Próximamente: Listado y gestión de obras
            </p>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
