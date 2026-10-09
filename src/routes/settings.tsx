import { createFileRoute } from "@tanstack/react-router";
import { Container, Select, Stack, Text, Title, useMantineColorScheme } from "@mantine/core";
import type { MantineColorScheme } from "@mantine/core";

export const Route = createFileRoute("/settings")({ component: Settings });

function Settings() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Container p="md" fluid>
      <Stack gap="lg">
        <div>
          <Title order={2}>Settings</Title>
          <Text c="dimmed">Application settings.</Text>
        </div>
        <Select<MantineColorScheme>
          label="Color scheme"
          description="Choose light mode, dark mode, or follow your system setting."
          data={[
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "auto", label: "Auto" },
          ]}
          value={colorScheme}
          onChange={(value) => {
            if (value) setColorScheme(value);
          }}
          w={280}
        />
      </Stack>
    </Container>
  );
}
