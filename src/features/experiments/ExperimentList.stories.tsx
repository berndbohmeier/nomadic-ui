import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExperimentList } from "./ExperimentList";

const meta = {
  title: "Experiments/ExperimentList",
  component: ExperimentList,
  args: { experiments: [], loading: false, error: false, hasWorkspace: true },
} satisfies Meta<typeof ExperimentList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoWorkspace: Story = { args: { hasWorkspace: false } };
export const Loading: Story = { args: { loading: true } };
export const Error: Story = { args: { error: true } };
export const Empty: Story = {};
export const WithExperiments: Story = {
  args: { experiments: ["2025-01-04_run", "2025-02-05_run", "2025-03-01_run"] },
};
