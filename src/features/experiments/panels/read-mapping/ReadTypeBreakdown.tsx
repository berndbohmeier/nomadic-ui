import { BarChart, PieChart } from "@mantine/charts";
import { Box, Flex, Group, Stack, Table, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { ReadCounts, ReadTypeSeries } from "./summarizeReadMapping";
import "@mantine/charts/styles.css";

interface ReadTypeBreakdownProps {
  counts: ReadCounts;
  series: ReadTypeSeries[];
  variant: "pie" | "bar";
  label: string;
}

export function ReadTypeBreakdown({
  counts,
  series,
  variant,
  label,
}: ReadTypeBreakdownProps) {
  const { t, i18n } = useTranslation();
  const format = (value: number) => value.toLocaleString(i18n.language);
  const share = (value: number) =>
    counts.n_total > 0
      ? (value / counts.n_total).toLocaleString(i18n.language, {
          style: "percent",
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : t("experiments.readMapping.notApplicable");
  const tooltipValue = (value: number) => `${format(value)} (${share(value)})`;

  const values = (
    <Table
      fz="xs"
      withRowBorders={false}
      horizontalSpacing="xs"
      verticalSpacing={4}
      style={{ flex: "1 1 240px", minWidth: 0 }}
    >
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t("experiments.readMapping.readType")}</Table.Th>
          <Table.Th ta="right">{t("experiments.readMapping.reads")}</Table.Th>
          <Table.Th ta="right">
            {t("experiments.readMapping.shareOfTotal")}
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {series.map((item) => (
          <Table.Tr key={item.name}>
            <Table.Td>
              <Group gap={6} wrap="nowrap">
                <Box
                  component="span"
                  w={10}
                  h={10}
                  bg={item.color}
                  style={{ flexShrink: 0 }}
                />
                <span>{item.label}</span>
              </Group>
            </Table.Td>
            <Table.Td ta="right" style={{ fontVariantNumeric: "tabular-nums" }}>
              {format(counts[item.name])}
            </Table.Td>
            <Table.Td
              ta="right"
              style={{
                fontVariantNumeric: "tabular-nums",
                whiteSpace: "nowrap",
              }}
            >
              {share(counts[item.name])}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );

  return (
    <Stack gap="xs" role="group" aria-label={label}>
      {variant === "pie" ? (
        <Flex gap="md" align="center" justify="center" wrap="wrap">
          {counts.n_total > 0 ? (
            <PieChart
              size={288}
              style={{
                flexShrink: 0,
                maxWidth: "100%",
                height: "auto",
                aspectRatio: "1 / 1",
              }}
              pieProps={{ outerRadius: "100%" }}
              data={series.map((item) => ({
                key: item.name,
                name: item.label,
                color: item.color,
                value: counts[item.name],
              }))}
              strokeWidth={0}
              withTooltip
              tooltipDataSource="segment"
              valueFormatter={tooltipValue}
              aria-label={label}
            />
          ) : (
            <Text size="sm" c="dimmed">
              {t("experiments.readMapping.noReadsToSummarize")}
            </Text>
          )}
          {values}
        </Flex>
      ) : (
        <>
          {counts.n_total > 0 ? (
            <BarChart
              h={64}
              data={[{ ...counts, scope: label }]}
              dataKey="scope"
              type="percent"
              orientation="vertical"
              series={series}
              withYAxis={false}
              xAxisProps={{ domain: [0, 1], ticks: [0, 0.5, 1] }}
              gridAxis="none"
              tickLine="none"
              barProps={{ strokeWidth: 0 }}
              barChartProps={{
                margin: { top: 0, bottom: 0, left: 16, right: 16 },
              }}
              valueFormatter={tooltipValue}
              aria-label={label}
            />
          ) : (
            <Text size="sm" c="dimmed">
              {t("experiments.readMapping.noReadsToSummarize")}
            </Text>
          )}
          {values}
        </>
      )}
    </Stack>
  );
}
