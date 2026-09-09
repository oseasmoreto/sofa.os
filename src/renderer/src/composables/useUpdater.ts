import { ref } from 'vue'
import type { UpdateStatus } from '../../../shared/types'
import { checkForUpdates, onUpdateStatus, openDownloadPage } from '../api/updater'

const status = ref<UpdateStatus>({ state: 'idle' })
let subscribed = false

export function useUpdater(): {
  status: typeof status
  check: () => Promise<void>
  openDownload: () => Promise<void>
} {
  if (!subscribed) {
    subscribed = true
    onUpdateStatus((next) => {
      status.value = next
    })
  }

  return {
    status,
    check: checkForUpdates,
    openDownload: openDownloadPage
  }
}
