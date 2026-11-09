import { DonutChart } from "@mantine/charts";
import { Box, Flex, Group, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { OverviewBarcode } from "./summarizeSequencingOverview";
import { statusColors, useStatusLabels } from "./statusDisplay";
import { SAMPLE_STATUSES, sampleVisualizationData } from "./visualizationData";
import "@mantine/charts/styles.css";

export function SampleVisualizations({
  samples,
}: {
  samples: OverviewBarcode[];
}) {
  const { t, i18n } = useTranslation();
  const labels = useStatusLabels();
  const { counts } = sampleVisualizationData(samples);
  const format = (value: number) => value.toLocaleString(i18n.language);
  return (
    <Stack gap="sm">
      <Title order={4}>
        {t("experiments.sequencingOverview.sampleStatusChart")}
      </Title>
      <Flex gap="md" align="center" wrap="wrap">
        <DonutChart
          size={150}
          chartLabel={format(samples.length)}
          data={SAMPLE_STATUSES.map((status) => ({
            name: labels[status],
            value: counts[status],
            color: statusColors[status],
          }))}
          tooltipDataSource="segment"
          valueFormatter={format}
          aria-label={t("experiments.sequencingOverview.sampleStatusChart")}
        />
        <Stack gap={4}>
          {SAMPLE_STATUSES.map((status) => (
            <Group key={status} gap="xs" wrap="nowrap">
              <Box w={10} h={10} bg={statusColors[status]} aria-hidden="true" />
              <Text size="sm">
                {labels[status]}: {format(counts[status])}
              </Text>
            </Group>
          ))}
        </Stack>
      </Flex>
    </Stack>
  );
}
