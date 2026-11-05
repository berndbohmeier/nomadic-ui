import { useTranslation } from "react-i18next";
import { MockPanel } from "./MockPanel";
import type { ExperimentPanel, PanelProps } from "./types";

export const READ_MAPPING_FILE = "summary.read_mapping.csv";

export function ReadMappingPanel({ file }: PanelProps) {
  const { t } = useTranslation();
  return <MockPanel title={t("experiments.panels.readMapping")} file={file} />;
}

export const readMappingPanel: ExperimentPanel = {
  id: "readMapping",
  label: (t) => t("experiments.panels.readMapping"),
  sourceFiles: [READ_MAPPING_FILE],
  Component: ReadMappingPanel,
};
