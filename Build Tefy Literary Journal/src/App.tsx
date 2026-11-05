import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { ContentProvider } from '@/hooks/useContent'
import { AdminSessionProvider } from '@/hooks/useAdminSession'
import { FeedbackProvider } from '@/components/ui/Feedback'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { SiteHead } from '@/components/layout/SiteHead'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { HomePage } from '@/pages/public/HomePage'
import { ReviewsPage } from '@/pages/public/ReviewsPage'
import { ReviewDetailPage } from '@/pages/public/ReviewDetailPage'
import { GenresPage, GenreDetailPage } from '@/pages/public/GenresPage'
import { CollectionsPage, CollectionDetailPage } from '@/pages/public/CollectionsPage'
import { AboutPage } from '@/pages/public/AboutPage'
import { PrivacyPage } from '@/pages/public/PrivacyPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const AdminReviewsPage = lazy(() => import('@/pages/admin/AdminReviewsPage').then((m) => ({ default: m.AdminReviewsPage })))
const ReviewEditorPage = lazy(() => import('@/pages/admin/ReviewEditorPage').then((m) => ({ default: m.ReviewEditorPage })))
const AdminCollectionsPage = lazy(() => import('@/pages/admin/TaxonomyPages').then((m) => ({ default: m.AdminCollectionsPage })))
const AdminGenresPage = lazy(() => import('@/pages/admin/TaxonomyPages').then((m) => ({ default: m.AdminGenresPage })))
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage').then((m) => ({ default: m.SettingsPage })))

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

export default function App() {
  return (
    <ContentProvider>
      <AdminSessionProvider>
        <FeedbackProvider>
          <BrowserRouter basename={basename}>
            <SiteHead />
            <Suspense fallback={<div className="min-h-dvh bg-night" aria-busy="true" />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<HomePage />} />
                <Route path="resenas" element={<ReviewsPage />} />
                <Route path="resenas/:slug" element={<ReviewDetailPage />} />
                <Route path="generos" element={<GenresPage />} />
                <Route path="generos/:slug" element={<GenreDetailPage />} />
                <Route path="colecciones" element={<CollectionsPage />} />
                <Route path="colecciones/:slug" element={<CollectionDetailPage />} />
                <Route path="sobre-nia" element={<AboutPage />} />
                <Route path="sobre-tefy" element={<Navigate to="/sobre-nia" replace />} />
                <Route path="privacidad" element={<PrivacyPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="resenas" element={<AdminReviewsPage />} />
                <Route path="resenas/nueva" element={<ReviewEditorPage />} />
                <Route path="resenas/:id/editar" element={<ReviewEditorPage />} />
                <Route path="colecciones" element={<AdminCollectionsPage />} />
                <Route path="categorias" element={<AdminGenresPage />} />
                <Route path="configuracion" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
            </Suspense>
          </BrowserRouter>
        </FeedbackProvider>
      </AdminSessionProvider>
    </ContentProvider>
  )
}
