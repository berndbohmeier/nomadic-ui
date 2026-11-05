import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { AppShell } from "@mantine/core";
import { WorkspaceFooter } from "./WorkspaceFooter";

const validPath = "/Users/lab/runs/2025-01-plasmodium";
const history = [
  validPath,
  "/Users/lab/runs/2025-02-plasmodium",
  "/Users/lab/runs/2025-03-plasmodium",
];

const meta = {
  title: "Workspace/WorkspaceFooter",
  component: WorkspaceFooter,
  decorators: [
    (Story) => (
      <AppShell footer={{ height: 32 }}>
        <AppShell.Footer>
          <Story />
        </AppShell.Footer>
      </AppShell>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    testProviders: {
      backend: {
        workspace: {
          validate: (path: string) => Promise.resolve(history.includes(path)),
        },
      },
    },
  },
} satisfies Meta<typeof WorkspaceFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

const populatedStorage = {
  "nomadic-workspace-active": JSON.stringify(validPath),
  "nomadic-workspace-history": JSON.stringify(history),
};

export const NoWorkspace: Story = {};

export const WithWorkspace: Story = {
  parameters: { testProviders: { storage: populatedStorage } },
};

export const HistoryOpen: Story = {
  parameters: { testProviders: { storage: populatedStorage } },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button"));
  },
};

export const InvalidWorkspace: Story = {
  parameters: {
    testProviders: {
      storage: populatedStorage,
      backend: {
        workspace: {
          pickFolder: () => Promise.resolve("/tmp/not-a-workspace"),
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("button"));
    const document = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      await document.findByRole("menuitem", { name: /Choose/ }),
    );
  },
};
