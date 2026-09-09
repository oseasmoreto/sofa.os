import { onMounted, onUnmounted, reactive, ref } from 'vue'

interface Row {
  getItems: () => HTMLElement[]
  onFocusIndex?: (index: number) => void
}

const rows: Row[] = []
const position = reactive({ rowIndex: 0, colIndex: 0 })
const enabled = ref(true)
let leftEdgeHandler: (() => void) | null = null

function focusCurrent(): void {
  const row = rows[position.rowIndex]
  if (!row) return

  const items = row.getItems()
  if (!items.length) return

  const col = Math.min(position.colIndex, items.length - 1)
  items[col]?.focus()
  row.onFocusIndex?.(col)
}

function isFocusWithinRows(): boolean {
  const active = document.activeElement
  if (!active || active === document.body) return false
  return rows.some((row) => row.getItems().includes(active as HTMLElement))
}

// Uma linha registrada antes de seus itens existirem (ex: um card só
// aparece depois de um fetch assíncrono resolver) fica vazia no momento
// do auto-foco inicial, que só é tentado uma vez. Quem possui essa linha
// deve chamar isso assim que seus itens ficarem disponíveis, pra tentar
// focar de novo — mas só se nada mais já estiver focado nesse meio tempo.
export function refreshFocus(): void {
  if (!isFocusWithinRows()) {
    focusCurrent()
  }
}

export function registerRow(
  getItems: () => HTMLElement[],
  onFocusIndex?: (index: number) => void
): () => void {
  const row: Row = { getItems, onFocusIndex }
  rows.push(row)

  if (rows.length === 1) {
    requestAnimationFrame(focusCurrent)
  }

  return () => {
    const index = rows.indexOf(row)
    if (index !== -1) rows.splice(index, 1)
    if (position.rowIndex >= rows.length) {
      position.rowIndex = Math.max(rows.length - 1, 0)
      requestAnimationFrame(focusCurrent)
    }
  }
}

function moveRow(delta: number): void {
  const nextIndex = Math.min(Math.max(position.rowIndex + delta, 0), rows.length - 1)
  if (nextIndex === position.rowIndex) return
  position.rowIndex = nextIndex
  focusCurrent()
}

function moveCol(delta: number): void {
  const row = rows[position.rowIndex]
  if (!row) return

  const items = row.getItems()
  const nextIndex = Math.min(Math.max(position.colIndex + delta, 0), items.length - 1)

  if (nextIndex === position.colIndex) {
    if (delta < 0 && position.colIndex === 0 && leftEdgeHandler) {
      leftEdgeHandler()
    }
    return
  }

  position.colIndex = nextIndex
  focusCurrent()
}

function onKeydown(event: KeyboardEvent): void {
  // Tab é bloqueado globalmente: a navegação por foco padrão do browser
  // não conhece o sistema de linhas do spatialNav e pode levar o foco pra
  // fora dele (ex: parar num item da sidebar), deixando "enabled" travado
  // em false pra sempre e as setas mortas.
  if (event.key === 'Tab') {
    event.preventDefault()
    return
  }

  if (!enabled.value) return

  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      moveRow(-1)
      break
    case 'ArrowDown':
      event.preventDefault()
      moveRow(1)
      break
    case 'ArrowLeft':
      event.preventDefault()
      moveCol(-1)
      break
    case 'ArrowRight':
      event.preventDefault()
      moveCol(1)
      break
  }
}

export function useSpatialNavigation(): void {
  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}

export function pauseSpatialNavigation(): void {
  enabled.value = false
}

export function resumeSpatialNavigation(): void {
  enabled.value = true
}

export function resetPosition(): void {
  position.rowIndex = 0
  position.colIndex = 0
}

export function focusGrid(): void {
  focusCurrent()
}

export function setLeftEdgeHandler(handler: (() => void) | null): void {
  leftEdgeHandler = handler
}
