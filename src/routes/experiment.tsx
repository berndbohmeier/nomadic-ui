import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@mantine/core";
import { ExperimentPage } from "../features/experiments/ExperimentPage";

export const Route = createFileRoute("/experiment")({
  validateSearch: (search: Record<string, unknown>) => ({
    path: typeof search.path === "string" ? search.path : "",
  }),
  component: ExperimentRoute,
});

function ExperimentRoute() {
  const { path } = Route.useSearch();
  return (
    <Container px="md" pb="md" fluid>
      <ExperimentPage key={path} path={path} />
    </Container>
  );
}
