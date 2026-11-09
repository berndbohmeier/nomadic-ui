import { Alert, Button, Loader, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useBackend } from "../../../app/context";
import { useBarcodeSelection } from "../barcodes/BarcodeSelection";
import { REGION_COVERAGE_FILE } from "./RegionCoveragePanel";
import { SequencingOverview } from "./sequencing-overview/SequencingOverview";
import { summarizeSequencingOverview } from "./sequencing-overview/summarizeSequencingOverview";
import type { ExperimentPanel, PanelProps } from "./types";

export function SequencingOverviewPanel({ experiment }: PanelProps) {
  const { t } = useTranslation();
  const backend = useBackend();
  const coverage = useQuery({
    queryKey: ["experiment", experiment.path, "regionCoverage"],
    queryFn: () => backend.experiments.loadRegionCoverage(experiment.path),
    refetchInterval: 5000,
  });
  const selection = useBarcodeSelection();
  const hasData =
    coverage.data !== undefined && selection.metadata !== undefined;
  const error = coverage.error ?? selection.error;
  const isError = coverage.isError || selection.error != null;
  if (!hasData && !isError) {
    return (
      <Loader
        size="sm"
        role="status"
        aria-label={t("experiments.sequencingOverview.loading")}
      />
    );
  }
  const errorCode = error == null ? "" : String(error).replace(/^Error: /, "");
  const metadataError =
    errorCode === "METADATA_CSV_NOT_FOUND"
      ? t("experiments.regionCoverage.metadataMissing")
      : errorCode === "METADATA_CSV_AMBIGUOUS"
        ? t("experiments.regionCoverage.metadataAmbiguous")
        : null;
  return (
    <Stack>
      {isError && (
        <Alert
          color="red"
          role="alert"
          title={t("experiments.sequencingOverview.error")}
        >
          <Stack gap="sm" align="start">
            {metadataError && <Text size="sm">{metadataError}</Text>}
            {!metadataError && errorCode && (
              <Text size="sm" style={{ overflowWrap: "anywhere" }}>
                {t("experiments.regionCoverage.errorDetails", {
                  details: errorCode,
                })}
              </Text>
            )}
            {hasData && t("experiments.regionCoverage.staleData")}
            <Button
              size="xs"
              variant="light"
              color="red"
              loading={coverage.isFetching}
              onClick={() => {
                if (coverage.isError) void coverage.refetch();
                if (selection.error != null) selection.refetch();
              }}
            >
              {t("experiments.regionCoverage.retry")}
            </Button>
          </Stack>
        </Alert>
      )}
      {coverage.data !== undefined && selection.metadata !== undefined && (
        <SequencingOverview
          {...summarizeSequencingOverview(
            coverage.data,
            selection.metadata,
            selection.selected,
          )}
        />
      )}
    </Stack>
  );
}

export const sequencingOverviewPanel: ExperimentPanel = {
  id: "sequencingOverview",
  label: (t) => t("experiments.panels.sequencingOverview"),
  sourceFiles: [REGION_COVERAGE_FILE],
  Component: SequencingOverviewPanel,
};
