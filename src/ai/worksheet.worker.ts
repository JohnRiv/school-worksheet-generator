import { createAgentWorker } from '@gilfink/prompt-chain'
import { createWorksheetAgentRouter } from './chains'

// Host the worksheet LCEL router inside the @gilfink/prompt-chain Web Worker runtime
createAgentWorker(createWorksheetAgentRouter())
