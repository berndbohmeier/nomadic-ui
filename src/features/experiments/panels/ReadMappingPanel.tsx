import { useTranslation } from "react-i18next";
import { Alert, Button, Loader, Stack, Text } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useBackend } from "../../../app/context";
import { ReadMappingChart } from "./read-mapping/ReadMappingChart";
import type { ExperimentPanel, PanelProps } from "./types";

export const READ_MAPPING_FILE = "summary.read_mapping.csv";

export function ReadMappingPanel({ experiment }: PanelProps) {
  const { t } = useTranslation();
  const backend = useBackend();
  const { data, error, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["experiment", experiment.path, "readMapping"],
    queryFn: () => backend.experiments.loadReadMapping(experiment.path),
    refetchInterval: 5000,
  });

  if (isPending) {
    return (
      <Loader
        size="sm"
        role="status"
        aria-label={t("experiments.readMapping.loading")}
      />
    );
  }

  const errorCode = error == null ? "" : String(error).replace(/^Error: /, "");
  const metadataError =
    errorCode === "METADATA_CSV_NOT_FOUND"
      ? t("experiments.readMapping.metadataMissing")
      : errorCode === "METADATA_CSV_AMBIGUOUS"
        ? t("experiments.readMapping.metadataAmbiguous")
        : null;

  return (
    <Stack>
      {isError && (
        <Alert
          color="red"
          role="alert"
          title={t("experiments.readMapping.error")}
        >
          <Stack gap="sm" align="start">
            {metadataError && <Text size="sm">{metadataError}</Text>}
            {!metadataError && errorCode && (
              <Text size="sm" style={{ overflowWrap: "anywhere" }}>
                {t("experiments.readMapping.errorDetails", {
                  details: errorCode,
                })}
              </Text>
            )}
            {data !== undefined && t("experiments.readMapping.staleData")}
            <Button
              size="xs"
              variant="light"
              color="red"
              loading={isFetching}
              onClick={() => void refetch()}
            >
              {t("experiments.readMapping.retry")}
            </Button>
          </Stack>
        </Alert>
      )}
      {data !== undefined && (
        <ReadMappingChart key={experiment.path} data={data} />
      )}
    </Stack>
  );
}

export const readMappingPanel: ExperimentPanel = {
  id: "readMapping",
  label: (t) => t("experiments.panels.readMapping"),
  sourceFiles: [READ_MAPPING_FILE],
  Component: ReadMappingPanel,
};
