import { Alert, Button, Loader, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useBackend } from "../../../app/context";
import { useBarcodeSelection } from "../barcodes/BarcodeSelection";
import { RegionCoverageChart } from "./region-coverage/RegionCoverageChart";
import type { ExperimentPanel, PanelProps } from "./types";

export const REGION_COVERAGE_FILE = "summary.region_coverage.csv";

export function RegionCoveragePanel({ experiment }: PanelProps) {
  const { t } = useTranslation();
  const backend = useBackend();
  const coverage = useQuery({
    queryKey: ["experiment", experiment.path, "regionCoverage"],
    queryFn: () => backend.experiments.loadRegionCoverage(experiment.path),
    refetchInterval: 5000,
  });
  const selection = useBarcodeSelection();
  const error = coverage.error ?? selection.error;
  const isError = coverage.isError || selection.error != null;
  const hasData =
    coverage.data !== undefined && selection.metadata !== undefined;
  const refetch = () => {
    if (coverage.isError) void coverage.refetch();
    if (selection.error != null) selection.refetch();
  };

  if (!hasData && !isError) {
    return (
      <Loader
        size="sm"
        role="status"
        aria-label={t("experiments.regionCoverage.loading")}
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
          title={t("experiments.regionCoverage.error")}
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
              onClick={refetch}
            >
              {t("experiments.regionCoverage.retry")}
            </Button>
          </Stack>
        </Alert>
      )}
      {coverage.data !== undefined && selection.metadata !== undefined && (
        <RegionCoverageChart
          key={experiment.path}
          data={coverage.data}
          metadata={selection.metadata}
          selectedBarcodes={selection.selected}
        />
      )}
    </Stack>
  );
}

export const regionCoveragePanel: ExperimentPanel = {
  id: "regionCoverage",
  label: (t) => t("experiments.panels.regionCoverage"),
  sourceFiles: [REGION_COVERAGE_FILE],
  Component: RegionCoveragePanel,
};
