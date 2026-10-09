import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import { AppShell } from "@mantine/core";
import { fn } from "storybook/test";
import { WorkspaceFooter } from "./WorkspaceFooter";

const meta = {
  title: "Workspace/WorkspaceFooter",
  component: WorkspaceFooter,
  args: {
    activeWorkspace: null,
    history: [],
    error: null,
    onSelect: fn(),
    onRemove: fn(),
    onChoose: fn(),
  },
  decorators: [
    (Story) => (
      <AppShell footer={{ height: 32 }}>
        <AppShell.Footer>
          <Story />
        </AppShell.Footer>
      </AppShell>
    ),
  ],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof WorkspaceFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

const history = [
  "/Users/lab/runs/2025-01-plasmodium",
  "/Users/lab/runs/2025-02-plasmodium",
  "/Users/lab/runs/2025-03-plasmodium",
];

export const NoWorkspace: Story = {};

export const WithWorkspace: Story = {
  args: { activeWorkspace: history[0], history },
};

export const HistoryOpen: Story = {
  args: { activeWorkspace: history[0], history },
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByRole("button"));
  },
};

export const InvalidWorkspace: Story = {
  args: {
    activeWorkspace: history[0],
    history,
    error: `"/tmp/not-a-workspace" is not a valid workspace`,
  },
};
