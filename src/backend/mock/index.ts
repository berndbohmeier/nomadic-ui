import type { Backend } from "../contract";
import { readMappingData } from "./read-mapping";

export const MOCK_WORKSPACE_PATH = "/mock/workspaces/run-001";

export const MOCK_EXPERIMENT_FILES = [
  "summary.aa_changes.csv",
  "summary.read_mapping.csv",
  "summary.region_coverage.csv",
];

export interface MockBackendOverrides {
  workspace?: Partial<Backend["workspace"]>;
  experiments?: Partial<Backend["experiments"]>;
}

export function createMockBackend(
  overrides: MockBackendOverrides = {},
): Backend {
  const validPaths = new Set([MOCK_WORKSPACE_PATH]);
  return {
    experiments: {
      load: (path) =>
        Promise.resolve({
          path,
          name: path.split(/[\\/]/).filter(Boolean).pop() ?? path,
          settings: {
            startDate: "2025-07-28T14:54:21+00:00",
            caller: "delve",
            fastqDir: "/data/run/*/*/fastq_pass",
            metadataCsv: "/data/metadata.csv",
            regionBed: "/data/beds/amplicons.bed",
            referenceName: "Pf3D7",
            nBarcodes: 48,
            nRegions: 10,
            minknowDir: "/data/run",
          },
          files: MOCK_EXPERIMENT_FILES,
        }),
      loadReadMapping: () =>
        Promise.resolve(readMappingData.map((row) => ({ ...row }))),
      ...overrides.experiments,
    },
    workspace: {
      pickFolder: () => Promise.resolve(MOCK_WORKSPACE_PATH),
      validate: (path) => Promise.resolve(validPaths.has(path)),
      listExperiments: (path) =>
        Promise.resolve(
          validPaths.has(path) ? ["experiment-001", "experiment-002"] : [],
        ),
      ...overrides.workspace,
    },
  };
}
