import { createFileRoute } from "@tanstack/react-router";
import { Container, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

export const Route = createFileRoute("/")({ component: Start });

function Start() {
  const { t } = useTranslation();
  return (
    <Container p="md" fluid>
      <Title order={2}>{t("start.title")}</Title>
      <Text c="dimmed">{t("start.welcome")}</Text>
    </Container>
  );
}
