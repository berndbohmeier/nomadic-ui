import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { ReadMappingPanel } from "./ReadMappingPanel";
import i18n from "../../../i18n";
import { BarcodeSelectionProvider } from "../barcodes/BarcodeSelection";

const meta = {
  title: "Experiments/Read mapping/Panel",
  component: ReadMappingPanel,
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
      files: ["summary.read_mapping.csv"],
    },
    file: "summary.read_mapping.csv",
  },
} satisfies Meta<typeof ReadMappingPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: /NTC_2.*barcode47/ }),
    );
    await expect(canvas.getByRole("status")).toHaveTextContent("NTC_2");
    await expect(canvas.getByRole("status")).toHaveTextContent("barcode47");
  },
};

export const Loading: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: { loadReadMapping: () => new Promise(() => {}) },
      },
    },
  },
};

export const Empty: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: {
          loadReadMapping: () => Promise.resolve([]),
          loadMetadata: () => Promise.resolve([]),
        },
      },
    },
  },
};

export const LoadError: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: {
          loadReadMapping: () => Promise.reject(new Error("Invalid CSV")),
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("alert"),
    ).toHaveTextContent("Invalid CSV");
  },
};

export const MissingMetadata: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: {
          loadMetadata: () => Promise.reject("METADATA_CSV_NOT_FOUND"),
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("alert"),
    ).toHaveTextContent(i18n.t("experiments.readMapping.metadataMissing"));
  },
};

export const AmbiguousMetadata: Story = {
  parameters: {
    testProviders: {
      backend: {
        experiments: {
          loadMetadata: () => Promise.reject("METADATA_CSV_AMBIGUOUS"),
        },
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("alert"),
    ).toHaveTextContent(i18n.t("experiments.readMapping.metadataAmbiguous"));
  },
};
