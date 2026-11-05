import { useContent } from '@/hooks/useContent'
import { AdminPage } from '@/components/admin/AdminLayout'
import { TaxonomyManager } from '@/components/admin/TaxonomyManager'

export function AdminGenresPage() {
  const { state, addGenre, updateGenre, deleteGenre, moveGenre } = useContent()
  return (
    <AdminPage title="Categorías" subtitle="Los géneros con los que ordenas tus reseñas. El orden aquí es el orden en tu blog.">
      <TaxonomyManager
        items={state.genres}
        usage={(id) => state.books.filter((b) => b.genreIds.includes(id)).length}
        noun={{ one: 'un género', add: 'Nuevo género', placeholder: 'Por ejemplo: Poesía' }}
        onAdd={addGenre}
        onUpdate={updateGenre}
        onDelete={deleteGenre}
        onMove={moveGenre}
      />
    </AdminPage>
  )
}

export function AdminCollectionsPage() {
  const { state, addSeries, updateSeries, deleteSeries, moveSeries } = useContent()
  return (
    <AdminPage title="Colecciones" subtitle="Sagas y series de libros. Asigna cada libro a su saga desde el paso “El libro” de una reseña.">
      <TaxonomyManager
        items={state.series}
        usage={(id) => state.books.filter((b) => b.seriesId === id).length}
        noun={{ one: 'una saga', add: 'Nueva saga', placeholder: 'Por ejemplo: Los juegos del hambre' }}
        onAdd={addSeries}
        onUpdate={updateSeries}
        onDelete={deleteSeries}
        onMove={moveSeries}
      />
    </AdminPage>
  )
}
