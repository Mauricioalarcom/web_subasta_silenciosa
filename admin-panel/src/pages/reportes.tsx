import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminLayout } from '@/components/AdminLayout';

export default function ReportesPage() {
  return (
    <ProtectedRoute>
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Reportes y Exportación
          </h1>
          <div className="card">
            <p className="text-gray-600">
              Próximamente: Generación y exportación de reportes
            </p>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
