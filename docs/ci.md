## CI and application packages

The GitHub Actions workflow runs on pull requests, pushes to `main`, version tag
pushes, and manual dispatch. Frontend linting, formatting, build, unit tests,
Storybook browser tests, Playwright end-to-end tests, and Rust formatting,
Clippy, and tests run in parallel. The browser end-to-end tests use the mock
backend; they do not exercise native dialogs or Rust commands.
Run `pnpm check` and `pnpm lint:ci` for the frontend and CI checks.
Run `pnpm test:unit --run`, `pnpm test:storybook --run`, `pnpm test:e2e`,
and `pnpm test:ci` to run the same frontend and CI-script tests locally.
Storybook and end-to-end tests require Playwright Chromium.

After all checks pass, the workflow builds these unsigned installers in parallel:

| Platform            | Packages              |
| ------------------- | --------------------- |
| Linux x64           | Debian, RPM, AppImage |
| Windows x64         | MSI, NSIS installer   |
| macOS Apple Silicon | DMG                   |
| macOS Intel         | DMG                   |

Download each `bundle-*` artifact from the workflow run. Linux builds use
Ubuntu 22.04 as a compatibility baseline; older distributions may not be
supported. Artifacts expire according to the repository's Actions retention
settings.

### Draft releases

1. Set the same stable `MAJOR.MINOR.PATCH` version in `package.json`,
   `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` (update
   `src-tauri/Cargo.lock` when changing the Rust package version).
2. Push a matching tag such as `v0.1.0`. Tags beginning with `v` that are not
   stable versions, or whose versions do not match, fail the workflow.
3. Once all checks and all four builds pass, the workflow creates a draft
   GitHub release containing the installers. Review it before publishing.
   Reruns update assets on an existing draft; they refuse to modify a published
   release. A failed asset upload may leave a draft that can be retried.

Builds are not code-signed or notarized. Windows may show SmartScreen warnings,
and macOS Gatekeeper may block downloaded apps. Configure platform signing and
macOS notarization before relying on these packages for normal public
distribution. See Tauri's [GitHub Actions guide](https://v2.tauri.app/distribute/pipelines/github/)
and [distribution documentation](https://v2.tauri.app/distribute/).
