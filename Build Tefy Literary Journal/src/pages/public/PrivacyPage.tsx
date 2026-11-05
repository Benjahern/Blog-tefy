import { useContent } from '@/hooks/useContent'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { PageHero } from '@/components/layout/PageHero'
import { NotFoundPage } from './NotFoundPage'

export function PrivacyPage() {
  useDocumentTitle('Política de privacidad')
  const { state } = useContent()
  const text = state.settings.privacyPolicy
  if (!text) return <NotFoundPage />
  return (
    <>
      <PageHero title="Política de privacidad" />
      <div className="mx-auto max-w-[720px] px-5 sm:px-8">
        <div className="tefy-prose">{text.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}</div>
      </div>
    </>
  )
}
