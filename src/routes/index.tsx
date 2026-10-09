import { createFileRoute } from "@tanstack/react-router";
import { Container, Text, Title } from "@mantine/core";

export const Route = createFileRoute("/")({ component: Start });

function Start() {
  return (
    <Container p="md" fluid>
      <Title order={2}>Start</Title>
      <Text c="dimmed">Welcome to Nomadic.</Text>
    </Container>
  );
}
