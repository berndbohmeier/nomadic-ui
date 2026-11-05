import { Center, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface MockPanelProps {
  title: string;
  file: string;
}

export function MockPanel({ title, file }: MockPanelProps) {
  const { t } = useTranslation();
  return (
    <Center mih={300}>
      <Stack align="center" gap="xs">
        <Title order={3}>{title}</Title>
        <Text c="dimmed">{t("experiments.panels.placeholder", { file })}</Text>
      </Stack>
    </Center>
  );
}
