import { useState } from "react";
import { BarChart } from "@mantine/charts";
import {
  Badge,
  Box,
  Divider,
  Group,
  Paper,
  ScrollArea,
  SimpleGrid,
  Stack,
  Text,
  Title,
  useComputedColorScheme,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { ReadMappingDatum } from "../../../../backend/contract";
import { ReadTypeBreakdown } from "./ReadTypeBreakdown";
import { summarizeReadMapping } from "./summarizeReadMapping";
import "@mantine/charts/styles.css";

interface ReadMappingChartProps {
  data: ReadMappingDatum[];
  initialBarcode?: string;
}

export function ReadMappingChart({
  data,
  initialBarcode,
}: ReadMappingChartProps) {
  const { t, i18n } = useTranslation();
  const dark = useComputedColorScheme("light") === "dark";
  const summary = summarizeReadMapping(data);
  const { barcodes, totals } = summary;
  const [selectedBarcode, setSelectedBarcode] = useState(
    initialBarcode ?? barcodes[0]?.barcode,
  );
  const selected =
    barcodes.find((row) => row.barcode === selectedBarcode) ?? barcodes[0];
  // Reserve space for full sample names while keeping the plot height constant.
  const axisHeight =
    Math.max(120, ...barcodes.map((row) => row.sampleId.length * 8)) + 62;
  const format = (value: number) => value.toLocaleString(i18n.language);
  const formatShare = (value: number | null) =>
    value === null
      ? t("experiments.readMapping.notApplicable")
      : value.toLocaleString(i18n.language, {
          style: "percent",
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
  const series = [
    {
      name: "n_primary" as const,
      label: t("experiments.readMapping.primary"),
      color: dark ? "blue.6" : "blue.8",
    },
    {
      name: "n_secondary" as const,
      label: t("experiments.readMapping.secondary"),
      color: "blue.4",
    },
    {
      name: "n_supplementary" as const,
      label: t("experiments.readMapping.supplementary"),
      color: "blue.2",
    },
    {
      name: "n_unmapped" as const,
      label: t("experiments.readMapping.unmapped"),
      color: dark ? "gray.6" : "gray.4",
    },
  ];
  const formatCountWithShare = (count: number, total: number) =>
    `${format(count)} (${formatShare(total > 0 ? count / total : null)})`;

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md">
        <Group justify="space-between" align="start">
          <Title order={3}>{t("experiments.panels.readMapping")}</Title>
          <div>
            <Text size="xs" c="dimmed">
              {t("experiments.readMapping.unclassifiedShare")}
            </Text>
            <Text fw={500} size="lg" data-testid="unclassified-share">
              {formatShare(summary.unclassifiedShare)}
            </Text>
            <Text size="xs" c="dimmed">
              {t("experiments.readMapping.unclassifiedCounts", {
                unclassified: format(summary.unclassifiedReads),
                total: format(summary.allReads),
              })}
            </Text>
          </div>
        </Group>

        {!selected ? (
          <Text c="dimmed">{t("experiments.readMapping.empty")}</Text>
        ) : (
          <ScrollArea type="auto" offsetScrollbars>
            <Box miw={Math.max(560, barcodes.length * 24 + 100)}>
              <BarChart
                h={260 + axisHeight}
                data={barcodes}
                dataKey="barcode"
                type="stacked"
                series={series}
                maxBarWidth={36}
                tickLine="none"
                gridAxis="x"
                strokeDasharray="0"
                xAxisLabel={t("experiments.readMapping.sampleBarcode")}
                yAxisLabel={t("experiments.readMapping.reads")}
                valueFormatter={format}
                yAxisProps={{ allowDecimals: false, width: 78 }}
                xAxisProps={{
                  interval: 0,
                  height: axisHeight,
                  tick: ({
                    x,
                    y,
                    payload,
                  }: {
                    x?: number | string;
                    y?: number | string;
                    payload?: { value?: string };
                  }) => {
                    const row = barcodes.find(
                      (item) => item.barcode === payload?.value,
                    );
                    if (!row) return <g />;
                    const control = row.sampleType !== "sample";
                    return (
                      <g
                        transform={`translate(${x}, ${y})`}
                        role="button"
                        tabIndex={0}
                        aria-label={t("experiments.readMapping.selectSample", {
                          sample: row.sampleId,
                          barcode: row.barcode,
                        })}
                        aria-pressed={row.barcode === selected.barcode}
                        style={{ cursor: "pointer" }}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedBarcode(row.barcode);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            event.stopPropagation();
                            setSelectedBarcode(row.barcode);
                          }
                        }}
                      >
                        <rect
                          x={-11}
                          y={4}
                          width={22}
                          height={axisHeight - 10}
                          rx={3}
                          fill={
                            row.barcode === selected.barcode
                              ? "var(--mantine-primary-color-light)"
                              : "transparent"
                          }
                        />
                        <text
                          y={18}
                          textAnchor="middle"
                          fill="var(--mantine-color-dimmed)"
                          fontSize={12}
                        >
                          {row.barcode.replace(/^barcode/, "")}
                        </text>
                        {control && (
                          <text
                            y={35}
                            textAnchor="middle"
                            fill={`var(--mantine-color-${row.sampleType === "positive" ? "green" : "red"}-text)`}
                            fontSize={11}
                          >
                            {row.sampleType === "positive"
                              ? t("experiments.readMapping.positiveShort")
                              : t("experiments.readMapping.negativeShort")}
                          </text>
                        )}
                        <text
                          transform="translate(0, 46) rotate(-90)"
                          textAnchor="end"
                          dominantBaseline="middle"
                          fill="var(--mantine-color-text)"
                          fontSize={12}
                          fontWeight={500}
                        >
                          {row.sampleId}
                        </text>
                      </g>
                    );
                  },
                }}
                barProps={{
                  strokeWidth: 0,
                  style: { cursor: "pointer" },
                  onClick: (_bar, index) =>
                    setSelectedBarcode(barcodes[index]?.barcode),
                }}
                barChartProps={{
                  onClick: ({ activeLabel, isTooltipActive }) => {
                    if (
                      isTooltipActive &&
                      barcodes.some((row) => row.barcode === activeLabel)
                    ) {
                      setSelectedBarcode(String(activeLabel));
                    }
                  },
                }}
                tooltipProps={{
                  labelFormatter: (barcode) => {
                    const row = barcodes.find(
                      (item) => item.barcode === barcode,
                    );
                    return row ? (
                      <div>
                        <Text fw={500}>{row.sampleId}</Text>
                        <Text size="xs" c="dimmed">
                          {row.barcode}
                        </Text>
                      </div>
                    ) : (
                      String(barcode)
                    );
                  },
                }}
                aria-label={t("experiments.readMapping.chartLabel")}
              />
            </Box>
          </ScrollArea>
        )}

        <Divider />
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
          <Stack gap="sm">
            <div>
              <Text fw={500}>{t("experiments.readMapping.allBarcodes")}</Text>
              <Text size="xs" c="dimmed">
                {t("experiments.readMapping.demultiplexedReads", {
                  reads: format(totals.n_total),
                })}
              </Text>
            </div>
            <ReadTypeBreakdown
              counts={totals}
              series={series}
              variant="pie"
              label={t("experiments.readMapping.aggregateComposition")}
            />
          </Stack>
          {selected && (
            <Stack gap="sm" role="status" aria-live="polite" aria-atomic="true">
              <Group justify="space-between">
                <div>
                  <Text fw={500} style={{ overflowWrap: "anywhere" }}>
                    {selected.sampleId}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {selected.barcode}
                  </Text>
                </div>
                {selected.sampleType !== "sample" && (
                  <Badge
                    color={selected.sampleType === "positive" ? "green" : "red"}
                    variant="light"
                  >
                    {selected.sampleType === "positive"
                      ? t("experiments.readMapping.positiveControl")
                      : t("experiments.readMapping.negativeControl")}
                  </Badge>
                )}
              </Group>
              <ReadTypeBreakdown
                counts={selected}
                series={series}
                variant="bar"
                label={t("experiments.readMapping.sampleComposition", {
                  sample: selected.sampleId,
                })}
              />
              <SimpleGrid cols={{ base: 1, sm: 3 }} component="dl" m={0}>
                {[
                  [
                    t("experiments.readMapping.total"),
                    format(selected.n_total),
                  ],
                  [
                    t("experiments.readMapping.mapped"),
                    formatCountWithShare(selected.n_mapped, selected.n_total),
                  ],
                  [
                    t("experiments.readMapping.primaryMapped"),
                    formatCountWithShare(selected.n_primary, selected.n_mapped),
                  ],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Text component="dt" size="xs" c="dimmed">
                      {label}
                    </Text>
                    <Text
                      component="dd"
                      m={0}
                      fw={500}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {value}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
              {selected.n_mapped === 0 && (
                <Text size="sm">
                  {selected.n_total === 0
                    ? t("experiments.readMapping.noReads")
                    : t("experiments.readMapping.noTargetReads")}
                </Text>
              )}
              {selected.sampleType === "negative" && selected.n_mapped > 0 && (
                <Text size="sm">
                  {t("experiments.readMapping.controlTargetReads", {
                    reads: format(selected.n_mapped),
                  })}
                </Text>
              )}
            </Stack>
          )}
        </SimpleGrid>
        <Text size="xs" c="dimmed">
          {t("experiments.readMapping.explanation")}
        </Text>
      </Stack>
    </Paper>
  );
}
