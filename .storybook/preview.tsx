import type { Preview } from "@storybook/react-vite";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "../src/i18n";
import { TestProviders, type TestProviderParameters } from "./TestProviders";

const preview: Preview = {
  globalTypes: {
    colorScheme: {
      description: "Color scheme",
      toolbar: {
        title: "Color scheme",
        icon: "mirror",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { colorScheme: "light" },
  decorators: [
    (Story, context) => (
      <TestProviders
        key={context.id}
        parameters={
          context.parameters.testProviders as TestProviderParameters | undefined
        }
      >
        <Story />
      </TestProviders>
    ),
    (Story, context) => (
      <MantineProvider
        forceColorScheme={
          context.globals.colorScheme === "dark" ? "dark" : "light"
        }
      >
        <Story />
      </MantineProvider>
    ),
  ],
  parameters: {
    layout: "padded",

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
};

export default preview;
