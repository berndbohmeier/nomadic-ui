import { Stack, Tabs, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { ExperimentInfo } from "../../backend/contract";
import { getAvailablePanels } from "./panels/registry";
import { SettingsPanel } from "./SettingsPanel";

interface ExperimentViewProps {
  experiment: ExperimentInfo;
}

export function ExperimentView({ experiment }: ExperimentViewProps) {
  const { t } = useTranslation();
  const panels = getAvailablePanels(experiment);

  return (
    <Stack>
      <div>
        <Title order={2}>{experiment.name}</Title>
        <Text c="dimmed" size="sm" style={{ wordBreak: "break-all" }}>
          {experiment.path}
        </Text>
      </div>
      <Tabs
        defaultValue={panels[0]?.panel.id ?? "settings"}
        keepMounted={false}
      >
        <Tabs.List>
          {panels.map(({ panel }) => (
            <Tabs.Tab key={panel.id} value={panel.id}>
              {panel.label(t)}
            </Tabs.Tab>
          ))}
          <Tabs.Tab value="settings">
            {t("experiments.settings.title")}
          </Tabs.Tab>
        </Tabs.List>
        {panels.map(({ panel: { id, Component }, file }) => (
          <Tabs.Panel key={id} value={id} pt="md">
            <Component experiment={experiment} file={file} />
          </Tabs.Panel>
        ))}
        <Tabs.Panel value="settings" pt="md">
          <SettingsPanel settings={experiment.settings} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}
