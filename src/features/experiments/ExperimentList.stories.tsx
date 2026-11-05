import type { Meta, StoryObj } from "@storybook/react-vite";
import { MOCK_WORKSPACE_PATH } from "../../backend/mock";
import { ExperimentList } from "./ExperimentList";

const activeWorkspaceStorage = {
  "nomadic-workspace-active": JSON.stringify(MOCK_WORKSPACE_PATH),
};

const meta = {
  title: "Experiments/ExperimentList",
  component: ExperimentList,
  parameters: {
    testProviders: { storage: activeWorkspaceStorage },
  },
} satisfies Meta<typeof ExperimentList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoWorkspace: Story = {
  parameters: { testProviders: { storage: null } },
};
export const Loading: Story = {
  parameters: {
    testProviders: {
      backend: {
        workspace: { listExperiments: () => new Promise(() => undefined) },
      },
    },
  },
};
export const Error: Story = {
  parameters: {
    testProviders: {
      backend: {
        workspace: {
          listExperiments: () => Promise.reject(new globalThis.Error("Failed")),
        },
      },
    },
  },
};
export const Empty: Story = {
  parameters: {
    testProviders: {
      backend: {
        workspace: { listExperiments: () => Promise.resolve([]) },
      },
    },
  },
};
export const WithExperiments: Story = {
  parameters: {
    testProviders: {
      backend: {
        workspace: {
          listExperiments: () =>
            Promise.resolve([
              "2025-01-04_run",
              "2025-02-05_run",
              "2025-03-01_run",
            ]),
        },
      },
    },
  },
};
