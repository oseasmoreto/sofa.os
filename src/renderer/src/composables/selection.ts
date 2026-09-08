import { ref } from 'vue'
import type { Title } from '../../../shared/types'

const selectedTitle = ref<Title | null>(null)

export function useSelection(): {
  selectedTitle: typeof selectedTitle
  select: (title: Title) => void
  clear: () => void
} {
  return {
    selectedTitle,
    select: (title: Title) => {
      selectedTitle.value = title
    },
    clear: () => {
      selectedTitle.value = null
    }
  }
}
