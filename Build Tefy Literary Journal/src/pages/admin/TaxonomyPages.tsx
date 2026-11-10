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
        onAdd={(name, description, image) => addGenre(name, description, image)}
        onUpdate={(id, patch) => updateGenre(id, { name: patch.name, description: patch.description, image: patch.image })}
        onDelete={deleteGenre}
        onMove={moveGenre}
        allowImage
      />
    </AdminPage>
  )
}

export function AdminCollectionsPage() {
  const { state, addSeries, updateSeries, deleteSeries, moveSeries } = useContent()
  return (
    <AdminPage title="Colecciones" subtitle="Sagas, trilogías, bilogías y libros autoconclusivos. Vincula y ordena los libros desde el editor de reseñas.">
      <TaxonomyManager
        items={state.series}
        usage={(id) => state.books.filter((b) => b.seriesId === id).length}
        noun={{ one: 'una colección', add: 'Nueva colección', placeholder: 'Por ejemplo: Los juegos del hambre' }}
        onAdd={(name, description, image, kind) => addSeries(name, description, kind, image)}
        onUpdate={(id, patch) => updateSeries(id, { name: patch.name, description: patch.description, image: patch.image, kind: patch.kind })}
        onDelete={deleteSeries}
        onMove={moveSeries}
        allowImage
        allowKind
      />
    </AdminPage>
  )
}
