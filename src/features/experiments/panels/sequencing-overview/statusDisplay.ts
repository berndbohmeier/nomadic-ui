import { useTranslation } from "react-i18next";
import type { OverviewStatus } from "./summarizeSequencingOverview";

export function useStatusLabels(): Record<OverviewStatus, string> {
  const { t } = useTranslation();
  return {
    complete: t("experiments.sequencingOverview.status.complete"),
    gathering: t("experiments.sequencingOverview.status.gathering"),
    noData: t("experiments.sequencingOverview.status.noData"),
    passed: t("experiments.sequencingOverview.status.passed"),
    contaminated: t("experiments.sequencingOverview.status.contaminated"),
    unavailable: t("experiments.sequencingOverview.status.unavailable"),
  };
}

export const statusColors: Record<OverviewStatus, string> = {
  complete: "green.6",
  passed: "green.6",
  contaminated: "red.6",
  gathering: "blue.6",
  noData: "gray.6",
  unavailable: "orange.6",
};

export const statusBadgeColors: Record<OverviewStatus, string> = {
  complete: "green",
  passed: "green",
  contaminated: "red",
  gathering: "blue",
  noData: "gray",
  unavailable: "gray",
};
