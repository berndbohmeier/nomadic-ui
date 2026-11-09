import { Box, Group, Tabs, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { ExperimentInfo } from "../../backend/contract";
import { BarcodesLink } from "./barcodes/BarcodesLink";
import { BarcodeSelectionProvider } from "./barcodes/BarcodeSelection";
import { OpenExperimentWindowButton } from "./OpenExperimentWindowButton";
import { getAvailablePanels } from "./panels/registry";
import { SettingsPanel } from "./SettingsPanel";

interface ExperimentViewProps {
  experiment: ExperimentInfo;
}

export function ExperimentView({ experiment }: ExperimentViewProps) {
  return (
    // Keyed so the barcode selection is never shared between experiments.
    <BarcodeSelectionProvider
      key={experiment.path}
      experimentPath={experiment.path}
    >
      <ExperimentContent experiment={experiment} />
    </BarcodeSelectionProvider>
  );
}

function ExperimentContent({ experiment }: ExperimentViewProps) {
  const { t } = useTranslation();
  const panels = getAvailablePanels(experiment);

  return (
    <Tabs defaultValue={panels[0]?.panel.id ?? "settings"} keepMounted={false}>
      <Box
        pos="sticky"
        top={0}
        pt="md"
        bg="var(--mantine-color-body)"
        style={{ zIndex: 10 }}
      >
        <Group justify="space-between" gap="xs" wrap="nowrap" align="start">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
            <Title order={2} style={{ overflowWrap: "anywhere" }}>
              {experiment.name}
            </Title>
            <OpenExperimentWindowButton
              path={experiment.path}
              title={experiment.name}
            />
          </Group>
          <BarcodesLink />
        </Group>
        <Text c="dimmed" size="sm" style={{ wordBreak: "break-all" }}>
          {experiment.path}
        </Text>
        <Tabs.List mt="xs">
          {panels.map(({ panel }) => (
            <Tabs.Tab key={panel.id} value={panel.id}>
              {panel.label(t)}
            </Tabs.Tab>
          ))}
          <Tabs.Tab value="settings">
            {t("experiments.settings.title")}
          </Tabs.Tab>
        </Tabs.List>
      </Box>
      {panels.map(({ panel: { id, Component }, file }) => (
        <Tabs.Panel key={id} value={id} pt="md">
          <Component experiment={experiment} file={file} />
        </Tabs.Panel>
      ))}
      <Tabs.Panel value="settings" pt="md">
        <SettingsPanel settings={experiment.settings} />
      </Tabs.Panel>
    </Tabs>
  );
}
