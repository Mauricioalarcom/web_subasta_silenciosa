import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'
import { Navbar } from '@/components/Navbar'
import AdminBanner from '@/components/AdminBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Subasta Silenciosa - Galería de Arte',
  description: 'Participa en nuestra subasta silenciosa de arte contemporáneo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-gray-50">
            <AdminBanner />
            <Navbar />
            <main className="py-8">
              {children}
            </main>
            <footer className="bg-white border-t border-gray-200 mt-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center text-gray-600">
                  <p>&copy; 2026 Subasta Silenciosa. Todos los derechos reservados.</p>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}
