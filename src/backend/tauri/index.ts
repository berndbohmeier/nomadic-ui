import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { open } from "@tauri-apps/plugin-dialog";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import type {
  Backend,
  AaChangeRow,
  BarcodeMetadata,
  ExperimentInfo,
  ReadMappingCounts,
  RegionCoverageRow,
} from "../contract";

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
      openInNewWindow(path, title) {
        return new Promise<void>((resolve, reject) => {
          const window = new WebviewWindow(
            `experiment-${crypto.randomUUID()}`,
            {
              url: `/experiment-window?path=${encodeURIComponent(path)}`,
              title,
            },
          );
          void window.once("tauri://created", () => resolve());
          void window.once("tauri://error", (event) =>
            reject(new Error(String(event.payload))),
          );
        });
      },
      openFolder(path) {
        return revealItemInDir(path);
      },
      loadReadMapping(path) {
        return invoke<ReadMappingCounts[]>("load_read_mapping", { path });
      },
      loadRegionCoverage(path) {
        return invoke<RegionCoverageRow[]>("load_region_coverage", { path });
      },
      loadAaChanges(path, file) {
        return invoke<AaChangeRow[]>("load_aa_changes", { path, file });
      },
      loadMetadata(path) {
        return invoke<BarcodeMetadata[]>("load_metadata", { path });
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
