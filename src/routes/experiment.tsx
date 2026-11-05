import { createFileRoute, Link } from "@tanstack/react-router";
import { Anchor, Container, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { ExperimentPage } from "../features/experiments/ExperimentPage";

export const Route = createFileRoute("/experiment")({
  validateSearch: (search: Record<string, unknown>) => ({
    path: typeof search.path === "string" ? search.path : "",
  }),
  component: ExperimentRoute,
});

function ExperimentRoute() {
  const { t } = useTranslation();
  const { path } = Route.useSearch();
  return (
    <Container p="md" fluid>
      <Stack>
        <Anchor component={Link} to="/experiments" size="sm">
          {t("experiments.view.back")}
        </Anchor>
        <ExperimentPage key={path} path={path} />
      </Stack>
    </Container>
  );
}
