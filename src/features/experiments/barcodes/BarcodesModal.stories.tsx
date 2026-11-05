import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { metadataData } from "../../../backend/mock/read-mapping";
import { BarcodesModal } from "./BarcodesModal";

const all = metadataData.map((row) => row.barcode);

const meta = {
  title: "Experiments/Barcodes/Modal",
  component: BarcodesModal,
  args: {
    opened: true,
    onClose: fn(),
    onApply: fn(),
    metadata: metadataData,
    selected: all,
  },
} satisfies Meta<typeof BarcodesModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllSelected: Story = {};

export const ApplyDeselected: Story = {
  play: async ({ args }) => {
    const body = within(document.body);
    await userEvent.click(
      await body.findByRole("checkbox", { name: /barcode01/ }),
    );
    await userEvent.click(body.getByRole("button", { name: "Apply" }));
    await expect(args.onApply).toHaveBeenCalledWith(all.slice(1));
  },
};

export const ReorderWithKeyboard: Story = {
  play: async ({ args }) => {
    const body = within(document.body);
    const handle = await body.findByRole("button", {
      name: /Reorder barcode01/,
    });
    handle.focus();
    await userEvent.keyboard(" ");
    await userEvent.keyboard("{ArrowDown}");
    await userEvent.keyboard(" ");
    await userEvent.click(body.getByRole("button", { name: "Apply" }));
    await expect(args.onApply).toHaveBeenCalledWith([
      all[1],
      all[0],
      ...all.slice(2),
    ]);
  },
};
