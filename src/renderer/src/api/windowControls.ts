export function closeWindow(): Promise<void> {
  return window.api.window.close()
}

export function minimizeWindow(): Promise<void> {
  return window.api.window.minimize()
}

export function toggleMaximizeWindow(): Promise<void> {
  return window.api.window.toggleMaximize()
}
