import { CallbackManager, Tracer, createAgentWorker } from '@gilfink/prompt-chain'
import { createWorksheetAgentRouter } from './chains'

/**
 * Configures the Web Worker environment to be strictly transient (zero IndexedDB
 * or console trace persistence) before initializing `createAgentWorker`.
 */
export function setupTransientWorkerEnvironment(targetScope: Record<string, unknown> = globalThis): CallbackManager {
  try {
    Object.defineProperty(targetScope, 'indexedDB', {
      value: undefined,
      configurable: true,
      writable: true,
    })
  } catch {
    // Ignore if global property is non-configurable in a specialized test environment
  }

  const callbackManager = new CallbackManager()
  callbackManager.attachTracer(new Tracer('TransientWorksheetTracer'))
  return callbackManager
}

// Host the worksheet LCEL router inside the @gilfink/prompt-chain Web Worker runtime
// with persistent IndexedDB storage and trace exporters disabled for privacy.
const transientCallbackManager = setupTransientWorkerEnvironment()
createAgentWorker(createWorksheetAgentRouter(), [], transientCallbackManager)
