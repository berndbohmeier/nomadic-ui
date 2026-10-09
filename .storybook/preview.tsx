import type { Preview } from "@storybook/react-vite";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import "../src/i18n";

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
      <MantineProvider
        forceColorScheme={
          context.globals.colorScheme === "dark" ? "dark" : "light"
        }
      >
        <Story />
      </MantineProvider>
    ),
  ],
  parameters: { layout: "padded" },
};

export default preview;
