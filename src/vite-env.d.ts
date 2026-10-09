/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to "mock" to run in a browser with the in-memory mock backend. */
  readonly VITE_BACKEND?: "mock";
}
