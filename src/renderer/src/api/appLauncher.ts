export function launchApp(appId: string, query?: string): Promise<void> {
  return window.api.app.launch(appId, query)
}
