import { Alert, Button, Loader, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { useBackend } from "../../../app/context";
import { useBarcodeSelection } from "../barcodes/BarcodeSelection";
import { VariantsPanel } from "./variants/VariantsPanel";
import { variantMatrix } from "./variants/variantData";
import type { ExperimentPanel, PanelProps } from "./types";

export const AA_CHANGES_FILE = "summary.aa_changes.csv";
/** Older output format. */
export const AA_CHANGES_LEGACY_FILE = "summary.variants.csv";

export function AAChangePanel({ experiment, file }: PanelProps) {
  const { t } = useTranslation();
  const backend = useBackend();
  const selection = useBarcodeSelection();
  const changes = useQuery({
    queryKey: ["experiment", experiment.path, "aaChanges", file],
    queryFn: () => backend.experiments.loadAaChanges(experiment.path, file),
    refetchInterval: 5000,
  });
  const data = useMemo(
    () =>
      changes.data !== undefined && selection.metadata !== undefined
        ? variantMatrix(changes.data, selection.metadata, selection.selected)
        : undefined,
    [changes.data, selection.metadata, selection.selected],
  );
  const error = changes.error ?? selection.error;
  const isError = changes.isError || selection.error != null;
  if (data === undefined && !isError) {
    return (
      <Loader
        size="sm"
        role="status"
        aria-label={t("experiments.variants.loading")}
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
        <Alert color="red" role="alert" title={t("experiments.variants.error")}>
          <Stack gap="sm" align="start">
            {metadataError && <Text size="sm">{metadataError}</Text>}
            {!metadataError && errorCode && (
              <Text size="sm" style={{ overflowWrap: "anywhere" }}>
                {t("experiments.regionCoverage.errorDetails", {
                  details: errorCode,
                })}
              </Text>
            )}
            {data !== undefined && t("experiments.regionCoverage.staleData")}
            <Button
              size="xs"
              variant="light"
              color="red"
              loading={changes.isFetching}
              onClick={() => {
                if (changes.isError) void changes.refetch();
                if (selection.error != null) selection.refetch();
              }}
            >
              {t("experiments.regionCoverage.retry")}
            </Button>
          </Stack>
        </Alert>
      )}
      {data !== undefined && <VariantsPanel key={experiment.path} {...data} />}
    </Stack>
  );
}

export const aaChangePanel: ExperimentPanel = {
  id: "aaChange",
  label: (t) => t("experiments.panels.aaChange"),
  sourceFiles: [AA_CHANGES_FILE, AA_CHANGES_LEGACY_FILE],
  Component: AAChangePanel,
};
