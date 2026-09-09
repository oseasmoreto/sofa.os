export function launchApp(appId: string, query?: string, directUrl?: string): Promise<void> {
  return window.api.app.launch(appId, query, directUrl)
}
