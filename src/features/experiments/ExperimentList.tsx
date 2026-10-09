import { Badge, Card, Group, Loader, SimpleGrid, Text } from "@mantine/core";
import { IconFlask } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { parseExperimentName } from "./parseExperimentName";

export interface ExperimentListProps {
  experiments: string[];
  loading: boolean;
  error: boolean;
  hasWorkspace: boolean;
}

export function ExperimentList({
  experiments,
  loading,
  error,
  hasWorkspace,
}: ExperimentListProps) {
  const { t, i18n } = useTranslation();
  if (!hasWorkspace)
    return <Text c="dimmed">{t("experiments.noWorkspace")}</Text>;
  if (loading) return <Loader size="sm" />;
  if (error) return <Text c="red">{t("experiments.error")}</Text>;
  if (experiments.length === 0)
    return <Text c="dimmed">{t("experiments.empty")}</Text>;
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
      {experiments.map(parseExperimentName).map(({ id, date, label }) => (
        <Card key={id} withBorder padding="md" radius="md" title={id}>
          <Group gap="xs" wrap="nowrap" align="flex-start">
            <IconFlask size={20} />
            <Text fw={500} lineClamp={2} style={{ wordBreak: "break-word" }}>
              {label}
            </Text>
          </Group>
          {date && (
            <Badge mt="sm" variant="light">
              {date.toLocaleDateString(i18n.language, {
                dateStyle: "medium",
                timeZone: "UTC",
              })}
            </Badge>
          )}
        </Card>
      ))}
    </SimpleGrid>
  );
}
