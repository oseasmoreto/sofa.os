import emblaCarouselVue from 'embla-carousel-vue'
import type { EmblaOptionsType } from 'embla-carousel'
import { onMounted, onUnmounted, ref } from 'vue'
import { registerRow } from './spatialNav'

export function useEmblaRow(
  options: EmblaOptionsType,
  itemRefs: { value: HTMLElement[] },
  onNearEnd?: () => void
): {
  emblaRef: ReturnType<typeof emblaCarouselVue>[0]
  canScrollPrev: ReturnType<typeof ref<boolean>>
  canScrollNext: ReturnType<typeof ref<boolean>>
  scrollPrev: () => void
  scrollNext: () => void
  reInit: () => void
} {
  const [emblaRef, emblaApi] = emblaCarouselVue(options)
  const canScrollPrev = ref(false)
  const canScrollNext = ref(false)

  function updateScrollState(): void {
    const api = emblaApi.value
    if (!api) return

    canScrollPrev.value = api.canScrollPrev()
    canScrollNext.value = api.canScrollNext()

    const snaps = api.scrollSnapList()
    if (onNearEnd && snaps.length > 0 && api.selectedScrollSnap() >= snaps.length - 3) {
      onNearEnd()
    }
  }

  function scrollPrev(): void {
    emblaApi.value?.scrollPrev()
  }

  function scrollNext(): void {
    emblaApi.value?.scrollNext()
  }

  function reInit(): void {
    emblaApi.value?.reInit()
    updateScrollState()
  }

  let unregister: (() => void) | null = null

  onMounted(() => {
    const api = emblaApi.value
    if (api) {
      api.on('select', updateScrollState)
      api.on('reInit', updateScrollState)
      updateScrollState()
    }

    unregister = registerRow(
      () => itemRefs.value,
      (index) => emblaApi.value?.scrollTo(index)
    )
  })

  onUnmounted(() => {
    unregister?.()
  })

  return { emblaRef, canScrollPrev, canScrollNext, scrollPrev, scrollNext, reInit }
}
