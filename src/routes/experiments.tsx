import { createFileRoute } from "@tanstack/react-router";
import { Container, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/experiments")({
  component: Experiments,
});

function Experiments() {
  const { t } = useTranslation();
  return (
    <Container p="md" fluid>
      <Title order={2}>{t("experiments.title")}</Title>
      <Text c="dimmed">{t("experiments.empty")}</Text>
    </Container>
  );
}
