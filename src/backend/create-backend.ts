import { isTauri } from "@tauri-apps/api/core";
import type { Backend } from "./contract";

export async function createBackend(): Promise<Backend> {
  if (import.meta.env.VITE_BACKEND === "mock") {
    const { createMockBackend } = await import("./mock");
    return createMockBackend();
  }
  if (isTauri()) {
    const { createTauriBackend } = await import("./tauri");
    return createTauriBackend();
  }
  throw new Error(
    "Unsupported runtime: not running in Tauri. Set VITE_BACKEND=mock to use the mock backend.",
  );
}
