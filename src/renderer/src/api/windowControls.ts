export function closeWindow(): Promise<void> {
  return window.api.window.close()
}
