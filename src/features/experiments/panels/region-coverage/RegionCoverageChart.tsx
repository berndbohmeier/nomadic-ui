import { useState } from "react";
import { BarChart, PieChart, ScatterChart } from "@mantine/charts";
import {
  Badge,
  Box,
  Divider,
  Flex,
  Group,
  Paper,
  ScrollArea,
  Stack,
  Table,
  Text,
  Title,
  UnstyledButton,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import type {
  BarcodeMetadata,
  RegionCoverageRow,
} from "../../../../backend/contract";
import { summarizeRegionCoverage } from "./summarizeRegionCoverage";
import "@mantine/charts/styles.css";

interface RegionCoverageChartProps {
  data: RegionCoverageRow[];
  metadata: BarcodeMetadata[];
  selectedBarcodes: string[];
  initialBarcode?: string;
}

export function RegionCoverageChart({
  data,
  metadata,
  selectedBarcodes,
  initialBarcode,
}: RegionCoverageChartProps) {
  const { t, i18n } = useTranslation();
  const summary = summarizeRegionCoverage(data, metadata, selectedBarcodes);
  const { amplicons, barcodes, totals, totalReads } = summary;
  const [selectedBarcode, setSelectedBarcode] = useState(
    initialBarcode ?? barcodes[0]?.barcode,
  );
  const [hiddenAmplicons, setHiddenAmplicons] = useState<Set<string>>(
    () => new Set(),
  );
  const selected =
    barcodes.find((row) => row.barcode === selectedBarcode) ?? barcodes[0];
  const format = (value: number) => value.toLocaleString(i18n.language);
  const formatShare = (value: number, total: number) =>
    total > 0
      ? (value / total).toLocaleString(i18n.language, {
          style: "percent",
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : t("experiments.regionCoverage.notApplicable");
  const series = amplicons.map((amplicon) => ({
    name: amplicon.key,
    label: amplicon.name,
    color: amplicon.color,
  }));
  const scatterData = amplicons
    .map((amplicon, ampliconIndex) => ({ amplicon, ampliconIndex }))
    .filter(({ amplicon }) => !hiddenAmplicons.has(amplicon.name))
    .map(({ amplicon, ampliconIndex }) => {
      const offset =
        amplicons.length > 1
          ? (ampliconIndex / (amplicons.length - 1) - 0.5) * 0.72
          : 0;
      return {
        name: amplicon.name,
        color: amplicon.color,
        data: barcodes.map((barcode, barcodeIndex) => ({
          barcodePosition: barcodeIndex + offset,
          nReads: barcode.counts[amplicon.name],
          barcodeIndex,
        })),
      };
    });
  const toggleAmplicon = (name: string) => {
    setHiddenAmplicons((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };
  const isolateAmplicon = (name: string) => {
    setHiddenAmplicons(
      new Set(
        amplicons
          .filter((amplicon) => amplicon.name !== name)
          .map((amplicon) => amplicon.name),
      ),
    );
  };
  const selectedChartData = selected
    ? [
        {
          scope: selected.barcode,
          ...Object.fromEntries(
            amplicons.map((amplicon) => [
              amplicon.key,
              selected.counts[amplicon.name],
            ]),
          ),
        },
      ]
    : [];
  const axisHeight =
    Math.max(120, ...barcodes.map((row) => row.sampleId.length * 8)) + 62;

  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="md">
        <div>
          <Title order={3}>{t("experiments.panels.regionCoverage")}</Title>
          <Text size="sm" c="dimmed">
            {t("experiments.regionCoverage.description")}
          </Text>
        </div>

        {barcodes.length === 0 || amplicons.length === 0 ? (
          <Text c="dimmed">{t("experiments.regionCoverage.empty")}</Text>
        ) : (
          <Stack gap="xs">
            <Group
              gap="xs"
              role="group"
              aria-label={t("experiments.regionCoverage.ampliconLegend")}
            >
              {amplicons.map((amplicon) => {
                const visible = !hiddenAmplicons.has(amplicon.name);
                return (
                  <UnstyledButton
                    key={amplicon.key}
                    px={6}
                    py={3}
                    aria-pressed={visible}
                    aria-label={t(
                      visible
                        ? "experiments.regionCoverage.hideAmplicon"
                        : "experiments.regionCoverage.showAmplicon",
                      { amplicon: amplicon.name },
                    )}
                    title={t("experiments.regionCoverage.isolateAmplicon", {
                      amplicon: amplicon.name,
                    })}
                    onClick={() => toggleAmplicon(amplicon.name)}
                    onDoubleClick={() => isolateAmplicon(amplicon.name)}
                    style={{
                      borderRadius: "var(--mantine-radius-sm)",
                      opacity: visible ? 1 : 0.45,
                      textDecoration: visible ? undefined : "line-through",
                    }}
                  >
                    <Group gap={5} wrap="nowrap">
                      <Box
                        component="span"
                        w={9}
                        h={9}
                        bg={amplicon.color}
                        style={{ borderRadius: "50%", flexShrink: 0 }}
                      />
                      <Text size="xs">{amplicon.name}</Text>
                    </Group>
                  </UnstyledButton>
                );
              })}
            </Group>
            <ScrollArea type="auto" offsetScrollbars>
              <Box miw={Math.max(760, barcodes.length * 44)}>
                <ScatterChart
                  h={220 + axisHeight}
                  data={scatterData}
                  dataKey={{ x: "barcodePosition", y: "nReads" }}
                  tickLine="none"
                  gridAxis="x"
                  strokeDasharray="3 3"
                  referenceAreas={barcodes.map((barcode, index) => ({
                    x1: index - 0.5,
                    x2: index + 0.5,
                    fill:
                      barcode.barcode === selected?.barcode
                        ? "var(--mantine-primary-color-light)"
                        : index % 2 === 0
                          ? "var(--mantine-color-default-hover)"
                          : "transparent",
                    fillOpacity:
                      barcode.barcode === selected?.barcode ? 0.75 : 0.35,
                    stroke: "var(--mantine-color-default-border)",
                    strokeOpacity: 0.8,
                    strokeWidth: 1,
                    className: "region-coverage-barcode-band",
                    style: { cursor: "pointer" },
                    onClick: (event) => {
                      event.stopPropagation();
                      setSelectedBarcode(barcode.barcode);
                    },
                  }))}
                  xAxisLabel={t("experiments.regionCoverage.sampleBarcode")}
                  yAxisLabel={t("experiments.regionCoverage.reads")}
                  labels={{
                    x: t("experiments.regionCoverage.sampleBarcode"),
                    y: t("experiments.regionCoverage.reads"),
                  }}
                  valueFormatter={{
                    x: (value) => {
                      const row = barcodes[Math.round(value)];
                      return row
                        ? `${row.sampleId} · ${row.barcode}`
                        : String(value);
                    },
                    y: format,
                  }}
                  yAxisProps={{ allowDecimals: false, width: 78 }}
                  xAxisProps={{
                    domain: [-0.6, barcodes.length - 0.4],
                    ticks: barcodes.map((_, index) => index),
                    interval: 0,
                    height: axisHeight,
                    tick: ({
                      x,
                      y,
                      payload,
                    }: {
                      x?: number | string;
                      y?: number | string;
                      payload?: { value?: number };
                    }) => {
                      const row = barcodes[payload?.value ?? -1];
                      if (!row) return <g />;
                      const control = row.sampleType !== "sample";
                      return (
                        <g
                          transform={`translate(${x}, ${y})`}
                          role="button"
                          tabIndex={0}
                          aria-label={t(
                            "experiments.regionCoverage.selectSample",
                            {
                              sample: row.sampleId,
                              barcode: row.barcode,
                            },
                          )}
                          aria-pressed={row.barcode === selected?.barcode}
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
                              row.barcode === selected?.barcode
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
                                ? t("experiments.regionCoverage.positiveShort")
                                : t("experiments.regionCoverage.negativeShort")}
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
                  scatterProps={{
                    style: { cursor: "pointer" },
                    onClick: (point) => {
                      const index = Number(point.payload?.barcodeIndex);
                      if (Number.isInteger(index)) {
                        setSelectedBarcode(barcodes[index]?.barcode);
                      }
                    },
                  }}
                  aria-label={t("experiments.regionCoverage.chartLabel")}
                />
              </Box>
            </ScrollArea>
          </Stack>
        )}

        <Divider />

        <Flex direction={{ base: "column", xl: "row" }} gap="xl">
          <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
            <div>
              <Text fw={500}>
                {t("experiments.regionCoverage.allBarcodes")}
              </Text>
              <Text size="xs" c="dimmed">
                {t("experiments.regionCoverage.totalReads", {
                  reads: format(totalReads),
                })}
              </Text>
            </div>
            {totalReads > 0 ? (
              <Flex gap="md" align="center" justify="center" wrap="wrap">
                <PieChart
                  size={260}
                  data={totals.map((item) => ({
                    key: item.key,
                    name: item.name,
                    color: item.color,
                    value: item.nReads,
                  }))}
                  strokeWidth={0}
                  withTooltip
                  tooltipDataSource="segment"
                  valueFormatter={(value) =>
                    `${format(value)} (${formatShare(value, totalReads)})`
                  }
                  aria-label={t(
                    "experiments.regionCoverage.aggregateChartLabel",
                  )}
                />
                <AmpliconTable
                  rows={totals.map((item) => ({
                    ...item,
                    value: item.nReads,
                  }))}
                  total={totalReads}
                  format={format}
                  formatShare={formatShare}
                />
              </Flex>
            ) : (
              <Text size="sm" c="dimmed">
                {t("experiments.regionCoverage.noReads")}
              </Text>
            )}
          </Stack>

          {selected && (
            <>
              <Divider hiddenFrom="xl" />
              <Divider orientation="vertical" visibleFrom="xl" />
              <Stack
                gap="sm"
                role="status"
                aria-live="polite"
                aria-atomic="true"
                style={{ flex: 1, minWidth: 0 }}
              >
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>{selected.sampleId}</Text>
                    <Text size="sm" c="dimmed">
                      {selected.barcode}
                    </Text>
                  </div>
                  {selected.sampleType !== "sample" && (
                    <Badge
                      color={
                        selected.sampleType === "positive" ? "green" : "red"
                      }
                      variant="light"
                    >
                      {selected.sampleType === "positive"
                        ? t("experiments.regionCoverage.positiveControl")
                        : t("experiments.regionCoverage.negativeControl")}
                    </Badge>
                  )}
                </Group>
                {selected.totalReads > 0 ? (
                  <>
                    <BarChart
                      h={220}
                      data={selectedChartData}
                      dataKey="scope"
                      type="default"
                      series={series}
                      withXAxis={false}
                      maxBarWidth={28}
                      tickLine="none"
                      gridAxis="y"
                      valueFormatter={format}
                      yAxisProps={{ allowDecimals: false, width: 72 }}
                      aria-label={t(
                        "experiments.regionCoverage.sampleChartLabel",
                        { sample: selected.sampleId },
                      )}
                    />
                    <AmpliconTable
                      rows={amplicons.map((item) => ({
                        ...item,
                        value: selected.counts[item.name],
                      }))}
                      total={selected.totalReads}
                      format={format}
                      formatShare={formatShare}
                    />
                  </>
                ) : (
                  <Text size="sm" c="dimmed">
                    {t("experiments.regionCoverage.noSampleReads")}
                  </Text>
                )}
              </Stack>
            </>
          )}
        </Flex>
      </Stack>
    </Paper>
  );
}

interface TableRow {
  key: string;
  name: string;
  color: string;
  value: number;
}

function AmpliconTable({
  rows,
  total,
  format,
  formatShare,
}: {
  rows: TableRow[];
  total: number;
  format: (value: number) => string;
  formatShare: (value: number, total: number) => string;
}) {
  const { t } = useTranslation();
  return (
    <Table
      fz="xs"
      withRowBorders={false}
      horizontalSpacing="xs"
      verticalSpacing={4}
      style={{ flex: "1 1 280px", minWidth: 0 }}
    >
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{t("experiments.regionCoverage.amplicon")}</Table.Th>
          <Table.Th ta="right">
            {t("experiments.regionCoverage.reads")}
          </Table.Th>
          <Table.Th ta="right">
            {t("experiments.regionCoverage.share")}
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={row.key}>
            <Table.Td>
              <Group gap={6} wrap="nowrap">
                <Box
                  component="span"
                  w={10}
                  h={10}
                  bg={row.color}
                  style={{ flexShrink: 0 }}
                />
                <span>{row.name}</span>
              </Group>
            </Table.Td>
            <Table.Td ta="right" style={{ fontVariantNumeric: "tabular-nums" }}>
              {format(row.value)}
            </Table.Td>
            <Table.Td ta="right" style={{ fontVariantNumeric: "tabular-nums" }}>
              {formatShare(row.value, total)}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}
