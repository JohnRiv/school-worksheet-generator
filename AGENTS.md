# AGENTS.md

## Project Overview

**School Worksheet Generator** is a Next.js web application built with Gemini Firebase Studio. It captures photos of school worksheets, generates additional practice problems and their answers, and can be deployed to Firebase Hosting. The project uses Genkit for AI integration, Tailwind CSS for styling, and Radix UI components.

## Setup Commands

```bash
# Install dependencies
npm install
# or using pnpm if preferred
pnpm install
```

## Development Commands

```bash
# Start the development server (TurboPack enabled)
npm run dev
# or
pnpm dev
```

## Build & Deploy

```bash
# Build the production bundle
npm run build
# or
pnpm build

# Start the production server
npm start
# or
pnpm start
```

## Testing Commands

```bash
# Run linting
npm run lint
# Run TypeScript type checking
npm run typecheck
```

## Code Style Guidelines

- **TypeScript**: strict mode enabled.
- **Formatting**: Prefer single quotes, no semicolons, and use Prettier (if configured).
- **Component Library**: Use Radix UI components and Tailwind CSS utilities.
- **AI Integration**: Follow Genkit patterns for prompts and tool usage.

## Security Considerations

- Store the Gemini API key in a `.env` file at the project root (`GEMINI_API_KEY`).
- Do not commit `.env` or any secret keys to version control.
- Review Firebase security rules before deploying.

## Additional Resources

- [Genkit Documentation](https://github.com/google/genkit)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
