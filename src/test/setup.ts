import '@testing-library/jest-dom/vitest'

// Provide ResizeObserver stub for Radix UI ScrollArea in jsdom
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverStub as any
}
