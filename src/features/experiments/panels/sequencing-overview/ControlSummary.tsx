import { Group, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { OverviewBarcode } from "./summarizeSequencingOverview";
import { controlVisualizationData } from "./visualizationData";

export function ControlSummary({ controls }: { controls: OverviewBarcode[] }) {
  const { t, i18n } = useTranslation();
  const data = controlVisualizationData(controls);
  const format = (value: number) => value.toLocaleString(i18n.language);
  return (
    <Group align="start" gap="xl">
      <Stack gap={0}>
        <Text size="sm">
          {t("experiments.sequencingOverview.positivePassedControls")}
        </Text>
        {data.positiveTotal === 0 ? (
          <Text c="dimmed">
            {t("experiments.sequencingOverview.noPositiveControls")}
          </Text>
        ) : (
          <Text
            fw={700}
            size="xl"
            c={data.allPositivePassed ? "green.7" : undefined}
          >
            {t("experiments.sequencingOverview.controlCount", {
              value: format(data.passed),
              total: format(data.positiveTotal),
            })}
          </Text>
        )}
      </Stack>
      <Stack gap={0}>
        <Text size="sm">
          {t("experiments.sequencingOverview.negativePassedControls")}
        </Text>
        {data.negativeTotal === 0 ? (
          <Text c="dimmed">
            {t("experiments.sequencingOverview.noNegativeControls")}
          </Text>
        ) : (
          <Text
            fw={700}
            size="xl"
            c={
              data.contaminated > 0
                ? "red.7"
                : data.negativePassed === data.negativeTotal
                  ? "green.7"
                  : undefined
            }
          >
            {t("experiments.sequencingOverview.controlCount", {
              value: format(data.negativePassed),
              total: format(data.negativeTotal),
            })}
          </Text>
        )}
      </Stack>
    </Group>
  );
}
