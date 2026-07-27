import { useEffect } from 'react'
import { useSeason } from './SeasonAccess'

export function useDocumentTitle(): void {
  const { squad, seasonName, isArchived } = useSeason()

  useEffect(() => {
    const season = seasonName.replace('Håndballsesongen ', '')
    document.title = isArchived ? `${squad.name} ${season} (arkiv)` : `Terminliste - ${squad.name}`
  }, [squad.name, seasonName, isArchived])
}
