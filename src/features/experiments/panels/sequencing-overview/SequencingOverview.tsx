import {
  Badge,
  Box,
  Group,
  Paper,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import classes from "./SequencingOverview.module.css";
import { statusBadgeColors, useStatusLabels } from "./statusDisplay";
import { SampleVisualizations } from "./SampleVisualizations";
import { ControlSummary } from "./ControlSummary";
import {
  OVERVIEW_THRESHOLDS,
  type OverviewBarcode,
  type OverviewStatus,
} from "./summarizeSequencingOverview";

interface Props {
  samples: OverviewBarcode[];
  controls: OverviewBarcode[];
}

const sampleStatuses: OverviewStatus[] = [
  "gathering",
  "noData",
  "complete",
  "unavailable",
];
const controlStatuses: OverviewStatus[] = [
  "contaminated",
  "gathering",
  "noData",
  "passed",
  "unavailable",
];
const ampliconStatuses: OverviewStatus[] = [
  "contaminated",
  "gathering",
  "noData",
  "complete",
  "passed",
];

function BarcodeDetails({ barcode }: { barcode: OverviewBarcode }) {
  const { t } = useTranslation();
  const labels = useStatusLabels();
  return (
    <Box component="details">
      <Box component="summary" style={{ cursor: "pointer" }}>
        <Group component="span" gap="xs">
          <Text component="span" fw={500}>
            {barcode.sampleId} · {barcode.barcode}
          </Text>
          {barcode.sampleType !== "sample" && (
            <Text component="span" size="sm">
              {barcode.sampleType === "positive"
                ? t("experiments.sequencingOverview.positiveControl")
                : t("experiments.sequencingOverview.negativeControl")}
            </Text>
          )}
          <Badge color={statusBadgeColors[barcode.status]}>
            {labels[barcode.status]}
          </Badge>
          {barcode.amplicons.length > 0 && barcode.sampleType === "sample" && (
            <Text component="span" size="sm">
              {t("experiments.sequencingOverview.sampleCount", {
                complete: barcode.amplicons.filter(
                  (amplicon) => amplicon.status === "complete",
                ).length,
                total: barcode.amplicons.length,
              })}
            </Text>
          )}
          {barcode.amplicons.length > 0 &&
            barcode.sampleType === "positive" && (
              <Text component="span" size="sm">
                {t("experiments.sequencingOverview.positiveCount", {
                  passed: barcode.passedCount,
                  total: barcode.amplicons.length,
                })}
              </Text>
            )}
        </Group>
      </Box>
      <Stack gap="sm" pl="md" mt="xs">
        {barcode.amplicons.length === 0 && (
          <Text>{t("experiments.sequencingOverview.noRows")}</Text>
        )}
        {ampliconStatuses.map((status) => {
          const rows = barcode.amplicons.filter(
            (amplicon) => amplicon.status === status,
          );
          if (rows.length === 0) return null;
          return (
            <Box key={status}>
              <Text fw={500}>
                {labels[status]} ({rows.length})
              </Text>
              <Table.ScrollContainer minWidth={500}>
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>
                        {t("experiments.sequencingOverview.amplicon")}
                      </Table.Th>
                      <Table.Th>
                        {t("experiments.sequencingOverview.meanCoverage")}
                      </Table.Th>
                      <Table.Th>
                        {t("experiments.sequencingOverview.coveredPercent")}
                      </Table.Th>
                      {barcode.sampleType === "sample" && (
                        <Table.Th>
                          {t("experiments.sequencingOverview.reason")}
                        </Table.Th>
                      )}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {rows.map(({ row }) => (
                      <Table.Tr key={row.name}>
                        <Table.Td>{row.name}</Table.Td>
                        <Table.Td>{String(row.mean_cov)}</Table.Td>
                        <Table.Td>{String(row.cov_gr100_per)}%</Table.Td>
                        {barcode.sampleType === "sample" && (
                          <Table.Td>
                            {[
                              ...(row.mean_cov <=
                              OVERVIEW_THRESHOLDS.sampleMeanCoverage
                                ? [t("experiments.sequencingOverview.lowMean")]
                                : []),
                              ...(row.cov_gr100_per <=
                              OVERVIEW_THRESHOLDS.sampleCoveredPercent
                                ? [
                                    t(
                                      "experiments.sequencingOverview.lowPercent",
                                    ),
                                  ]
                                : []),
                            ].join("; ") || "-"}
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

function BarcodeGroups({
  rows,
  statuses,
}: {
  rows: OverviewBarcode[];
  statuses: OverviewStatus[];
}) {
  const labels = useStatusLabels();
  return statuses.map((status) => {
    const group = rows.filter((row) => row.status === status);
    if (group.length === 0) return null;
    return (
      <Box component="details" key={status}>
        <Box component="summary" className={classes["group-summary"]}>
          {labels[status]} ({group.length})
        </Box>
        <Stack gap="xs" pl="md" mt="xs">
          {group.map((row) => (
            <BarcodeDetails key={row.barcode} barcode={row} />
          ))}
        </Stack>
      </Box>
    );
  });
}

export function SequencingOverview({ samples, controls }: Props) {
  const { t } = useTranslation();
  return (
    <Paper withBorder radius="md" p="md" className={classes.container}>
      <Stack>
        <Title order={3}>{t("experiments.panels.sequencingOverview")}</Title>
        <Text size="sm">
          {t("experiments.sequencingOverview.presentRowsOnly")}
        </Text>
        <Box className={classes.sections}>
          <Stack
            component="section"
            aria-label={t("experiments.sequencingOverview.samples")}
            className={classes.section}
          >
            <Title order={3}>
              {t("experiments.sequencingOverview.samples")}
            </Title>
            <Text size="sm">
              {t("experiments.sequencingOverview.sampleCriteria", {
                mean: OVERVIEW_THRESHOLDS.sampleMeanCoverage,
                percent: OVERVIEW_THRESHOLDS.sampleCoveredPercent,
                noData: OVERVIEW_THRESHOLDS.noDataMeanCoverage,
                noDataPercent: OVERVIEW_THRESHOLDS.sampleNoDataFraction * 100,
              })}
            </Text>
            {samples.length === 0 ? (
              <Text c="dimmed">
                {t("experiments.sequencingOverview.noSamples")}
              </Text>
            ) : (
              <>
                <SampleVisualizations samples={samples} />
                <BarcodeGroups rows={samples} statuses={sampleStatuses} />
              </>
            )}
          </Stack>
          <Stack
            component="section"
            aria-label={t("experiments.sequencingOverview.controls")}
            className={classes.controls}
          >
            <Title order={3}>
              {t("experiments.sequencingOverview.controls")}
            </Title>
            <Text size="sm">
              {t("experiments.sequencingOverview.controlCriteria", {
                negative: OVERVIEW_THRESHOLDS.negativeMeanCoverage,
                positive: OVERVIEW_THRESHOLDS.positiveMeanCoverage,
                fraction: OVERVIEW_THRESHOLDS.positivePassedFraction * 100,
              })}
            </Text>
            <Text size="sm">
              {t("experiments.sequencingOverview.negativeCaveat")}
            </Text>
            <ControlSummary controls={controls} />
            {controls.length === 0 ? (
              <Text c="dimmed">
                {t("experiments.sequencingOverview.noControls")}
              </Text>
            ) : (
              <>
                <BarcodeGroups rows={controls} statuses={controlStatuses} />
              </>
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
