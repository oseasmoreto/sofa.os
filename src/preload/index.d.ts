import { ElectronAPI } from '@electron-toolkit/preload'

interface SofaApi {
  window: {
    close: () => Promise<void>
    minimize: () => Promise<void>
    toggleMaximize: () => Promise<void>
  }
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: SofaApi
  }
}
