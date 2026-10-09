# School Worksheet Generator

A local-first React + TypeScript web application that takes photos of school worksheets and generates additional practice problems and their answers directly in the browser using **Chrome's Built-in Prompt API** (`window.LanguageModel`) and [`@gilfink/prompt-chain`](https://github.com/gilf/prompt-chain).

## Key Features

- **100% On-Device AI Inference**: Uses Chrome's built-in Gemini Nano model via the [Prompt API](https://developer.chrome.com/docs/ai/prompt-api)—no cloud API keys or backend servers required.
- **`@gilfink/prompt-chain` LCEL & Web Worker Architecture**:
  - Orchestrates multimodal worksheet image analysis and structured JSON problem generation using `PromptChainHost`, `createAgentWorker`, `RunnableSequence`, `RunnableLambda`, `LLMRunnable`, `StructuredOutputRunnable`, and `JSONOutputParserRunnable`.
  - Runs the agent workflow in a background Web Worker while bridging `window.LanguageModel` on the main thread.
- **Built-in Sample Worksheet**: Includes `sample-worksheet.jpg` (simplifying fractions like `4/8` and `6/15`) with a one-click **"Try Sample Worksheet (Fractions)"** button in the UI.
- **Unit & Component Tested**: Tested with Vitest and React Testing Library.

## Enabling Chrome Built-in AI (Prompt API)

1. Open Google Chrome (desktop).
2. Navigate to `chrome://flags/#optimization-guide-on-device-model` and set it to **Enabled BypassPerfRequirement**.
3. Navigate to `chrome://flags/#prompt-api-for-gemini-nano-multimodal-input` (and `chrome://flags/#prompt-api-for-gemini-nano`) and set to **Enabled**.
4. Relaunch Chrome and verify model readiness at `chrome://on-device-internals`.

## Getting Started

```bash
# Install dependencies
npm install

# Start the local Vite development server (http://localhost:9002)
npm run dev

# Run TypeScript type checking
npm run typecheck

# Run unit and component tests
npm test

# Build for production
npm run build
```
