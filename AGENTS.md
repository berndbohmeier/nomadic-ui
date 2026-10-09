# Working on Nomadic UI

## Product
Nomadic is a desktop application for real-time molecular surveillance via amplicon sequencing
from nanopore sequencing data. It helps lab scientists monitor sequencing runs, gather sample-level results
like number of mapped reads, amplicon coverage, quality metrics as well as resistance-associated mutation summaries.

## Tech Stack
- Tauri for building the desktop application
- Rust for the backend logic
- React with TanStack Router for building the user interface
- Mantine for building the user interface components

## Commands
- `pnpm install` to install the project dependencies
- `pnpm dev` to start the development server for only the web application
- `pnpm build` to build the web application for production
- `pnpm tauri dev` to start the development server for the tauri application
- `pnpm tauri build` to build the tauri application for production
