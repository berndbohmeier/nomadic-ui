import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { BarcodeSelectionProvider } from "../barcodes/BarcodeSelection";
import { AAChangePanel } from "./AAChangePanel";

const meta = {
  title: "Experiments/AA changes/Panel",
  component: AAChangePanel,
  decorators: [
    (Story) => (
      <BarcodeSelectionProvider experimentPath="/data/results/experiment">
        <Story />
      </BarcodeSelectionProvider>
    ),
  ],
  args: {
    experiment: {
      path: "/data/results/experiment",
      name: "experiment",
      settings: null,
      files: ["summary.aa_changes.csv"],
    },
    file: "summary.aa_changes.csv",
  },
} satisfies Meta<typeof AAChangePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Positive control")).toBeVisible();
    await expect(canvas.getByText("4 variants · 48 samples")).toBeVisible();
  },
};

export const LegacyFile: Story = {
  args: { file: "summary.variants.csv" },
  parameters: {
    testProviders: {
      backend: {
        experiments: {
          loadAaChanges: (_path: string, file: string) =>
            file === "summary.variants.csv"
              ? Promise.resolve([
                  {
                    barcode: "barcode01",
                    gene: "dhfr",
                    aa_change: "N51I",
                    aa_call: "mixed",
                    aa_depth: 20,
                    aa_wsaf: 0.5,
                  },
                ])
              : Promise.reject(new Error("Wrong file")),
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const frequency = await canvas.findByText("50%");
    await expect(frequency).toBeVisible();
    const details = frequency.closest<HTMLElement>(".mantine-Paper-root");
    if (!details) throw new Error("Missing call details");
    await expect(within(details).getByText("20")).toBeVisible();
  },
};

export const Loading: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: { loadAaChanges: () => new Promise(() => {}) },
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("status", {
        name: "Loading amino-acid changes",
      }),
    ).toBeVisible();
  },
};

export const LoadError: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: {
          loadAaChanges: () => Promise.reject(new Error("Invalid CSV")),
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Invalid CSV",
    );
    await userEvent.click(canvas.getByRole("button", { name: "Try again" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Invalid CSV",
    );
  },
};
