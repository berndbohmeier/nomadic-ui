import { createFileRoute } from "@tanstack/react-router";
import { Container, Text, Title } from "@mantine/core";

export const Route = createFileRoute("/experiments")({
  component: Experiments,
});

function Experiments() {
  return (
    <Container p="md" fluid>
      <Title order={2}>Experiments</Title>
      <Text c="dimmed">Your sequencing experiments will appear here.</Text>
    </Container>
  );
}
