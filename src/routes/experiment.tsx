import { createFileRoute, Link } from "@tanstack/react-router";
import { Anchor, Container } from "@mantine/core";
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
    <Container px="md" pb="md" fluid>
      <ExperimentPage
        key={path}
        path={path}
        headerTop={
          <Anchor component={Link} to="/experiments" size="sm">
            {t("experiments.view.back")}
          </Anchor>
        }
      />
    </Container>
  );
}
