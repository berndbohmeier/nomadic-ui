import type { ComponentType } from "react";
import type { TFunction } from "i18next";
import type { ExperimentInfo } from "../../../backend/contract";

export interface PanelProps {
  experiment: ExperimentInfo;
  /** The file that made this panel available (first match in `sourceFiles`). */
  file: string;
}

export type PanelCheckResult = { ok: true } | { ok: false; reason: string };

export interface ExperimentPanel {
  id: string;
  label(t: TFunction): string;
  /** Accepted source files, in order of preference (e.g. current and legacy formats). The panel is offered if any exists. */
  sourceFiles: string[];
  /** Hook for later consistency checks of the experiment data. */
  check?(experiment: ExperimentInfo): PanelCheckResult;
  Component: ComponentType<PanelProps>;
}
