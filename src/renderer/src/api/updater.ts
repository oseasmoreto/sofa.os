import type { UpdateStatus } from '../../../shared/types'

export function checkForUpdates(): Promise<void> {
  return window.api.updater.check()
}

export function quitAndInstall(): Promise<void> {
  return window.api.updater.quitAndInstall()
}

export function getAppVersion(): Promise<string> {
  return window.api.updater.getVersion()
}

export function onUpdateStatus(callback: (status: UpdateStatus) => void): () => void {
  return window.api.updater.onStatus(callback)
}
