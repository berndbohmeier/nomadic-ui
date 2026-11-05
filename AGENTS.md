# Working on Nomadic UI

## Product
Nomadic is a desktop application for real-time molecular surveillance via amplicon sequencing
from nanopore sequencing data. It helps lab scientists monitor sequencing runs, gather sample-level results
like number of mapped reads, amplicon coverage, quality metrics as well as resistance-associated mutation summaries.

## Tech Stack
- Tauri for building the desktop application
- Rust for the backend logic
- React with TanStack Router for building the user interface
- TanStack Query for data fetching and caching
- Mantine for building the user interface components
- i18next + react-i18next for internationalization
- Vitest for testing of components and logic
- Playwright for end-to-end tests


## Commands
- `pnpm install` to install the project dependencies
- `pnpm dev` to start the development server for only the web application.
- `pnpm build` to build the web application for production
- `pnpm tauri dev` to start the development server for the tauri application
- `pnpm tauri build` to build the tauri application for production
- `pnpm mock` runs the web app in a browser with the in-memory mock backend (no Tauri; fake data), via `vite --mode mock` and `.env.mock`
- `pnpm test:e2e` to run Playwright browser tests against the mock backend (does not cover native dialogs or Rust commands)

## Backend boundary
Only `src/backend/tauri/` may import `@tauri-apps/*` (plus `isTauri` in `create-backend.ts`). Components use `useBackend()`.

## Instructions
- Always translate the UI into all supported languages using i18next.
- Split components into feature-based directories under `src/features`. Prefer colocating related files within the same feature directory. Prefer pure components when possible and create a storybook story for each component.


## Internationalization
This project uses i18next. Locale files live in `src/i18n/locales/{{language}}/{{namespace}}.json`; the source language is `en`. Run `npx i18next-cli extract` after adding or changing `t()` calls and `npx i18next-cli status` to see what is still untranslated.

## Visual Check
If you want to check the visual apperance you can do one of the following:
- Storybook: Run `pnpm storybook` to start the Storybook development server and visually check the components at localhost:6006.
- Mock App: Run `pnpm mock` to start the web application with the in-memory mock backend and visually check the components at localhost:1420.
- Playwright: Run `pnpm test:e2e` to execute the end-to-end tests in a browser against the mock backend.