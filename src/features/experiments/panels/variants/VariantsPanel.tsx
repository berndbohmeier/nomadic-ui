import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Badge,
  Box,
  Group,
  Loader,
  MultiSelect,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { Variant, VariantSample } from "./variantData";
import { VariantChart, type VariantView } from "./VariantChart";
import {
  appearance,
  CallSymbol,
  cellColor,
  symbolColor,
  type DisplayStatus,
} from "./variantAppearance";
import { wsafGradient, wsafMissingColor } from "./wsafScale";

const displayStatuses: DisplayStatus[] = [
  "failed",
  "unphased",
  "noCall",
  "absent",
  "wt",
  "mixed",
  "mutant",
];

interface VariantsPanelProps {
  variants: Variant[];
  samples: VariantSample[];
  mock?: boolean;
}

/** Calls are supplied explicitly; missing calls are never treated as absent. */
export function VariantsPanel({
  variants,
  samples,
  mock = false,
}: VariantsPanelProps) {
  const { t, i18n } = useTranslation();
  const [genes, setGenes] = useState<string[]>([]);
  const [view, setView] = useState<VariantView>("aaCall");
  const [selection, setSelection] = useState<{
    barcode: string;
    variantId: string;
  } | null>(null);
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => {
    let secondFrame = 0;
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => setChartReady(true));
    });
    return () => {
      cancelAnimationFrame(firstFrame);
      cancelAnimationFrame(secondFrame);
    };
  }, []);
  const choose = useCallback((barcode: string, variantId: string) => {
    setSelection({ barcode, variantId });
  }, []);
  const visibleVariants = useMemo(
    () =>
      variants.filter(
        (variant) => genes.length === 0 || genes.includes(variant.gene),
      ),
    [variants, genes],
  );
  const selectedSample =
    samples.find((sample) => sample.barcode === selection?.barcode) ??
    samples[0];
  const selectedVariant =
    visibleVariants.find((variant) => variant.id === selection?.variantId) ??
    visibleVariants[0];
  const selectedCall =
    selectedSample && selectedVariant
      ? selectedSample.calls[selectedVariant.id]
      : undefined;
  const selectedStatus = selectedCall?.status ?? "noCall";
  const unavailable = t("experiments.variants.status.noCall");
  const statusLabel = (status: DisplayStatus) =>
    t(`experiments.variants.status.${status}`);

  return (
    <Paper withBorder radius="md" p="sm">
      <Stack gap="xs">
        <Group justify="space-between" align="start">
          <div style={{ flex: "1 1 250px", minWidth: 0 }}>
            <Title order={4}>{t("experiments.variants.title")}</Title>
            <Text size="xs" c="dimmed">
              {t("experiments.variants.description")}
            </Text>
            {mock && (
              <Badge color="gray" variant="light">
                {t("experiments.variants.mock")}
              </Badge>
            )}
          </div>
          <MultiSelect
            size="xs"
            style={{ flex: "1 1 230px", maxWidth: 400, minWidth: 0 }}
            label={t("experiments.variants.genes")}
            placeholder={t("experiments.variants.allGenes")}
            description={t("experiments.variants.genesHint")}
            data={[...new Set(variants.map((variant) => variant.gene))]}
            value={genes}
            onChange={setGenes}
            clearButtonProps={{
              "aria-label": t("experiments.variants.clearGenes"),
              "aria-hidden": false,
              tabIndex: 0,
            }}
            clearable
            searchable
          />
          <SegmentedControl
            size="xs"
            aria-label={t("experiments.variants.view")}
            value={view}
            onChange={(value) => setView(value === "wsaf" ? "wsaf" : "aaCall")}
            data={[
              { value: "aaCall", label: t("experiments.variants.aaCall") },
              { value: "wsaf", label: t("experiments.variants.wsaf") },
            ]}
          />
        </Group>
        {view === "aaCall" ? (
          <Group
            gap="sm"
            role="group"
            aria-label={t("experiments.variants.legend")}
          >
            {displayStatuses.map((status) => (
              <Group key={status} gap={5}>
                <Box
                  component="span"
                  bg={cellColor(appearance[status].color)}
                  style={{
                    display: "inline-flex",
                    width: 22,
                    height: 22,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 3,
                    border: "1px solid var(--mantine-color-default-border)",
                  }}
                  aria-hidden
                >
                  <svg width={20} height={20} viewBox="-10 -10 20 20">
                    <CallSymbol status={status} />
                  </svg>
                </Box>
                <Text size="xs">{statusLabel(status)}</Text>
              </Group>
            ))}
          </Group>
        ) : (
          <Group
            gap="sm"
            align="center"
            role="group"
            aria-label={t("experiments.variants.wsafLegend")}
          >
            <Box style={{ width: 220, maxWidth: "100%" }}>
              <Box
                aria-hidden
                style={{
                  background: wsafGradient,
                  height: 14,
                  borderRadius: 3,
                  border: "1px solid var(--mantine-color-default-border)",
                }}
              />
              <Group justify="space-between" gap={0}>
                <Text size="xs">0%</Text>
                <Text size="xs">50%</Text>
                <Text size="xs">100%</Text>
              </Group>
            </Box>
            <Group gap={5}>
              <Box
                component="span"
                bg={wsafMissingColor}
                aria-hidden
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 3,
                  border: "1px solid var(--mantine-color-default-border)",
                }}
              />
              <Text size="xs">{unavailable}</Text>
            </Group>
          </Group>
        )}
        {!selectedSample || !selectedVariant ? (
          <Text c="dimmed">{t("experiments.variants.empty")}</Text>
        ) : (
          <>
            <Text size="xs" c="dimmed">
              {t("experiments.variants.count", {
                samples: samples.length,
                variants: visibleVariants.length,
              })}
            </Text>
            {chartReady ? (
              <VariantChart
                variants={visibleVariants}
                samples={samples}
                selectedBarcode={selectedSample.barcode}
                selectedVariantId={selectedVariant.id}
                view={view}
                onSelect={choose}
              />
            ) : (
              <Loader
                size="sm"
                role="status"
                aria-label={t("experiments.variants.loading")}
              />
            )}
            <Text size="xs" c="dimmed">
              {t("experiments.variants.hint")}
            </Text>
            <Paper withBorder radius="sm" p="xs" aria-live="polite">
              <Group justify="space-between">
                <div>
                  <Text size="sm" fw={600}>
                    {selectedSample.sampleId} · {selectedSample.barcode}
                  </Text>
                  <Text size="sm">
                    {selectedVariant.gene} · {selectedVariant.change}
                  </Text>
                </div>
                <Group gap="xs">
                  {selectedSample.sampleType !== "sample" && (
                    <Badge
                      color={
                        selectedSample.sampleType === "positive"
                          ? "green"
                          : "red"
                      }
                      variant="light"
                    >
                      {selectedSample.sampleType === "positive"
                        ? t("experiments.readMapping.positiveControl")
                        : t("experiments.readMapping.negativeControl")}
                    </Badge>
                  )}
                  <Badge
                    size="sm"
                    style={{
                      backgroundColor: cellColor(
                        appearance[selectedStatus].color,
                      ),
                      color: symbolColor,
                      border: "1px solid var(--mantine-color-default-border)",
                    }}
                  >
                    {statusLabel(selectedStatus)}
                  </Badge>
                </Group>
              </Group>
              <Group mt="xs" gap="lg" align="start">
                <div>
                  <Text size="xs" c="dimmed">
                    {t("experiments.variants.wsaf")}
                  </Text>
                  <Text fw={600}>
                    {selectedCall?.wsaf == null
                      ? unavailable
                      : selectedCall.wsaf.toLocaleString(i18n.language, {
                          style: "percent",
                          maximumFractionDigits: 1,
                        })}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t("experiments.variants.wsafDescription")}
                  </Text>
                </div>
                <div>
                  <Text size="xs" c="dimmed">
                    {t("experiments.variants.depth")}
                  </Text>
                  <Text fw={600}>
                    {selectedCall?.depth == null
                      ? unavailable
                      : selectedCall.depth.toLocaleString(i18n.language)}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t("experiments.variants.depthDescription")}
                  </Text>
                </div>
              </Group>
            </Paper>
          </>
        )}
      </Stack>
    </Paper>
  );
}
