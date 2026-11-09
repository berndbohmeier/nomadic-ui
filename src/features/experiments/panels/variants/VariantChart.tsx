import { memo, useMemo, useState } from "react";
import { ScrollArea, Tooltip } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { Variant, VariantSample } from "./variantData";
import {
  appearance,
  CallSymbol,
  cellColor,
  type DisplayStatus,
} from "./variantAppearance";
import { wsafColor } from "./wsafScale";

export type VariantView = "aaCall" | "wsaf";

interface ChartProps {
  variants: Variant[];
  samples: VariantSample[];
  selectedBarcode: string;
  selectedVariantId: string;
  view: VariantView;
  onSelect: (barcode: string, variantId: string) => void;
}

interface RowProps {
  variant: Variant;
  samples: VariantSample[];
  y: number;
  selectedBarcode: string | null;
  onSelect: ChartProps["onSelect"];
  statusLabels: Record<DisplayStatus, string>;
  view: VariantView;
  formatWsaf: (value: number | null) => string;
}

const VariantRow = memo(function VariantRow({
  variant,
  samples,
  y,
  selectedBarcode,
  onSelect,
  statusLabels,
  view,
  formatWsaf,
}: RowProps) {
  return (
    <g>
      <text
        x={125}
        y={y + 4}
        textAnchor="end"
        fill="var(--mantine-color-dimmed)"
        fontSize={12}
      >
        {variant.gene} · {variant.change}
      </text>
      {samples.map((sample, index) => {
        const call = sample.calls[variant.id];
        const status = call?.status ?? "noCall";
        const label = `${sample.sampleId} · ${sample.barcode} · ${variant.gene} ${variant.change} · ${statusLabels[status]}${view === "wsaf" ? ` · ${formatWsaf(call?.wsaf ?? null)}` : ""}`;
        const active = sample.barcode === selectedBarcode;
        const choose = () => onSelect(sample.barcode, variant.id);
        const x = 144 + index * 28;
        return (
          <g
            key={sample.barcode}
            role="button"
            tabIndex={0}
            aria-label={label}
            data-tooltip-label={label}
            aria-pressed={active}
            style={{ cursor: "pointer" }}
            onClick={choose}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                choose();
              }
            }}
          >
            <rect
              x={x - 13}
              y={y - 10}
              width={26}
              height={20}
              rx={3}
              fill={
                view === "wsaf"
                  ? wsafColor(call?.wsaf ?? null)
                  : cellColor(appearance[status].color)
              }
              stroke={
                active
                  ? "var(--mantine-color-text)"
                  : "var(--mantine-color-default-border)"
              }
              strokeWidth={active ? 2 : 1}
            />
            {view === "aaCall" && (
              <g transform={`translate(${x},${y})`}>
                <CallSymbol status={status} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
});

export function VariantChart({
  variants,
  samples,
  selectedBarcode,
  selectedVariantId,
  view,
  onSelect,
}: ChartProps) {
  const { t, i18n } = useTranslation();
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const statusLabels = useMemo(
    () => ({
      failed: t("experiments.variants.status.failed"),
      unphased: t("experiments.variants.status.unphased"),
      absent: t("experiments.variants.status.absent"),
      wt: t("experiments.variants.status.wt"),
      mixed: t("experiments.variants.status.mixed"),
      mutant: t("experiments.variants.status.mutant"),
      noCall: t("experiments.variants.status.noCall"),
    }),
    [t],
  );
  const formatWsaf = useMemo(() => {
    const formatter = new Intl.NumberFormat(i18n.language, {
      style: "percent",
      maximumFractionDigits: 1,
    });
    return (value: number | null) =>
      `${t("experiments.variants.wsaf")}: ${value === null ? statusLabels.noCall : formatter.format(value)}`;
  }, [i18n.language, statusLabels.noCall, t]);
  const axisHeight =
    Math.max(100, ...samples.map((sample) => sample.sampleId.length * 8)) + 62;
  const axisY = variants.length * 24 + 20;
  const width = 130 + samples.length * 28;
  return (
    <ScrollArea
      h={480}
      type="auto"
      offsetScrollbars
      data-testid="variants-chart-scroll-area"
    >
      <svg
        width={width}
        height={axisY + axisHeight}
        role="group"
        aria-label={t("experiments.variants.chartLabel")}
        style={{ display: "block" }}
      >
        <Tooltip.Floating
          role="tooltip"
          label={hoveredLabel}
          disabled={hoveredLabel === null}
          position="top"
        >
          <g
            onPointerOver={(event) => {
              const element = event.target;
              if (element instanceof Element) {
                const cell = element.closest<SVGGElement>(
                  "[data-tooltip-label]",
                );
                setHoveredLabel(cell?.dataset.tooltipLabel ?? null);
              }
            }}
            onPointerLeave={() => setHoveredLabel(null)}
          >
            {variants.map((variant, index) => (
              <VariantRow
                key={variant.id}
                variant={variant}
                samples={samples}
                y={12 + index * 24}
                selectedBarcode={
                  variant.id === selectedVariantId ? selectedBarcode : null
                }
                statusLabels={statusLabels}
                view={view}
                formatWsaf={formatWsaf}
                onSelect={onSelect}
              />
            ))}
          </g>
        </Tooltip.Floating>
        {samples.map((sample, index) => {
          const choose = () => onSelect(sample.barcode, selectedVariantId);
          return (
            <g
              key={sample.barcode}
              transform={`translate(${144 + index * 28},${axisY})`}
              role="button"
              tabIndex={0}
              aria-label={t("experiments.variants.selectSample", {
                sample: sample.sampleId,
                barcode: sample.barcode,
              })}
              aria-pressed={sample.barcode === selectedBarcode}
              style={{ cursor: "pointer" }}
              onClick={choose}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  choose();
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
                  sample.barcode === selectedBarcode
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
                {sample.barcode.replace(/^barcode/, "")}
              </text>
              {sample.sampleType !== "sample" && (
                <text
                  y={35}
                  textAnchor="middle"
                  fill={`var(--mantine-color-${sample.sampleType === "positive" ? "green" : "red"}-text)`}
                  fontSize={11}
                >
                  {sample.sampleType === "positive"
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
                {sample.sampleId}
              </text>
            </g>
          );
        })}
      </svg>
    </ScrollArea>
  );
}
