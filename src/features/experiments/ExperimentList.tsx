import {
  Badge,
  Card,
  Group,
  Loader,
  SimpleGrid,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconFlask } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useBackend } from "../../app/context";
import { useWorkspace } from "../workspace/useWorkspace";
import { joinPath } from "./joinPath";
import { OpenExperimentWindowButton } from "./OpenExperimentWindowButton";
import { parseExperimentName } from "./parseExperimentName";

interface ExperimentListProps {
  /** Called with the full path of the experiment folder. */
  onOpen?: (path: string) => void;
}

export function ExperimentList({ onOpen }: ExperimentListProps) {
  const { t, i18n } = useTranslation();
  const backend = useBackend();
  const { activeWorkspace } = useWorkspace();
  const {
    data: experiments = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ["experiments", activeWorkspace],
    queryFn: () => backend.workspace.listExperiments(activeWorkspace!),
    enabled: activeWorkspace !== null,
  });

  const hasWorkspace = activeWorkspace !== null;
  if (!hasWorkspace)
    return <Text c="dimmed">{t("experiments.noWorkspace")}</Text>;
  if (isPending) return <Loader size="sm" />;
  if (isError) return <Text c="red">{t("experiments.error")}</Text>;
  if (experiments.length === 0)
    return <Text c="dimmed">{t("experiments.empty")}</Text>;
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}>
      {experiments.map(parseExperimentName).map(({ id, date, label }) => (
        <Card key={id} withBorder padding="md" radius="md" title={id}>
          <Group gap="xs" wrap="nowrap" align="flex-start">
            <UnstyledButton
              type="button"
              disabled={!onOpen}
              onClick={() => onOpen?.(joinPath(activeWorkspace, "results", id))}
              style={{ flex: 1, minWidth: 0, textAlign: "left" }}
            >
              <Group gap="xs" wrap="nowrap" align="flex-start">
                <IconFlask size={20} />
                <Text
                  fw={500}
                  lineClamp={2}
                  style={{ wordBreak: "break-word" }}
                >
                  {label}
                </Text>
              </Group>
            </UnstyledButton>
            <OpenExperimentWindowButton
              path={joinPath(activeWorkspace, "results", id)}
              title={id}
            />
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
