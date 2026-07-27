import { useEffect } from 'react'
import { useSeason } from './SeasonAccess'
import { pageTitle } from './SeasonLabels'

export function useDocumentTitle(): void {
  const { squad, seasonName, isArchived } = useSeason()

  useEffect(() => {
    document.title = pageTitle(squad.name, seasonName, isArchived)
  }, [squad.name, seasonName, isArchived])
}
