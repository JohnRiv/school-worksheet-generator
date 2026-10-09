# AGENTS.md

## Project Overview

**School Worksheet Generator** is a React + TypeScript single-page web application served via Vite. It captures or uploads photos of school worksheets, analyzes them locally in Chrome using the built-in **Prompt API** (`window.LanguageModel`) and `@gilfink/prompt-chain`, and generates additional practice problems and answers.

## Setup Commands

```bash
# Install dependencies
npm install
```

## Development Commands

```bash
# Start the local Vite development server on port 9002
npm run dev
```

## Build & Preview

```bash
# Type-check and build the production bundle into dist/
npm run build

# Preview the production bundle locally
npm run preview
```

## Testing Commands

```bash
# Run Vitest unit & component tests
npm test

# Run TypeScript type checking
npm run typecheck
```

## Code Style Guidelines

- **TypeScript**: strict mode enabled.
- **Formatting**: Prefer single quotes, no semicolons.
- **Component Library**: Use Radix UI components and Tailwind CSS utilities.
- **AI Integration**: Use `@gilfink/prompt-chain` (`PromptChainHost`, `createAgentWorker`, `RunnableSequence`, `StructuredOutputRunnable`, `WorksheetChromeAIPlugin`) with Chrome's `window.LanguageModel` Prompt API.
