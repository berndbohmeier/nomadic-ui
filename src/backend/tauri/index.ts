import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Backend, ExperimentInfo } from "../contract";

interface WorkspaceInfo {
  valid: boolean;
  hasMetadata: boolean;
  hasBeds: boolean;
}

export function createTauriBackend(): Backend {
  return {
    experiments: {
      load(path) {
        return invoke<ExperimentInfo>("load_experiment", { path });
      },
    },
    workspace: {
      async pickFolder() {
        const selected = await open({ directory: true, multiple: false });
        return typeof selected === "string" ? selected : null;
      },
      async validate(path) {
        const info = await invoke<WorkspaceInfo>("validate_workspace", {
          path,
        });
        return info.valid;
      },
      listExperiments(path) {
        return invoke<string[]>("list_experiments", { path });
      },
    },
  };
}
