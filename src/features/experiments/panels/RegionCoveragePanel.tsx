import { useTranslation } from "react-i18next";
import { MockPanel } from "./MockPanel";
import type { ExperimentPanel, PanelProps } from "./types";

export const REGION_COVERAGE_FILE = "summary.region_coverage.csv";

export function RegionCoveragePanel({ file }: PanelProps) {
  const { t } = useTranslation();
  return (
    <MockPanel title={t("experiments.panels.regionCoverage")} file={file} />
  );
}

export const regionCoveragePanel: ExperimentPanel = {
  id: "regionCoverage",
  label: (t) => t("experiments.panels.regionCoverage"),
  sourceFiles: [REGION_COVERAGE_FILE],
  Component: RegionCoveragePanel,
};
