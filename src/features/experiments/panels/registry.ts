import type { ExperimentInfo } from "../../../backend/contract";
import { aaChangePanel } from "./AAChangePanel";
import { readMappingPanel } from "./ReadMappingPanel";
import { regionCoveragePanel } from "./RegionCoveragePanel";
import { sequencingOverviewPanel } from "./SequencingOverviewPanel";
import type { ExperimentPanel } from "./types";

/** Display order of the tabs. */
export const EXPERIMENT_PANELS: ExperimentPanel[] = [
  sequencingOverviewPanel,
  readMappingPanel,
  regionCoveragePanel,
  aaChangePanel,
];

export interface AvailablePanel {
  panel: ExperimentPanel;
  file: string;
}

export function getAvailablePanels(
  experiment: ExperimentInfo,
  panels: ExperimentPanel[] = EXPERIMENT_PANELS,
): AvailablePanel[] {
  const files = new Set(experiment.files);
  return panels.flatMap((panel) => {
    const file = panel.sourceFiles.find((f) => files.has(f));
    if (file === undefined || !(panel.check?.(experiment).ok ?? true))
      return [];
    return [{ panel, file }];
  });
}
