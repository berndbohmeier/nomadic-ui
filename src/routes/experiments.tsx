import { createFileRoute } from "@tanstack/react-router";
import { Container, Stack, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { ExperimentListContainer } from "../features/experiments/ExperimentListContainer";

export const Route = createFileRoute("/experiments")({
  component: Experiments,
});

function Experiments() {
  const { t } = useTranslation();
  return (
    <Container p="md" fluid>
      <Title order={2}>{t("experiments.title")}</Title>
      <Stack mt="md">
        <ExperimentListContainer />
      </Stack>
    </Container>
  );
}
