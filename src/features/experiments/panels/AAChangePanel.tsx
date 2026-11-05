import { useTranslation } from "react-i18next";
import { MockPanel } from "./MockPanel";
import type { ExperimentPanel, PanelProps } from "./types";

export const AA_CHANGES_FILE = "summary.aa_changes.csv";
/** Older output format. */
export const AA_CHANGES_LEGACY_FILE = "summary.variants.csv";

export function AAChangePanel({ file }: PanelProps) {
  const { t } = useTranslation();
  return <MockPanel title={t("experiments.panels.aaChange")} file={file} />;
}

export const aaChangePanel: ExperimentPanel = {
  id: "aaChange",
  label: (t) => t("experiments.panels.aaChange"),
  sourceFiles: [AA_CHANGES_FILE, AA_CHANGES_LEGACY_FILE],
  Component: AAChangePanel,
};
