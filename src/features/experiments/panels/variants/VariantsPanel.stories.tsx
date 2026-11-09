import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { VariantsPanel } from "./VariantsPanel";
import {
  mockVariants,
  mockVariantSamples,
  variantStatuses,
} from "./mockVariants";

const meta = {
  title: "Experiments/Variants/Panel",
  component: VariantsPanel,
  args: { variants: mockVariants, samples: mockVariantSamples, mock: true },
} satisfies Meta<typeof VariantsPanel>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const ResponsiveHeader: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: "min(900px, 100%)" }} data-testid="panel-container">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const container = canvas.getByTestId("panel-container");
    const heading = canvas.getByRole("heading", { name: "Variants" });
    const genes = canvas.getByRole("combobox", { name: "Genes" });
    const switcher = canvas.getByRole("radiogroup", {
      name: "Variant display",
    });
    const selector = genes.closest<HTMLElement>(".mantine-MultiSelect-root");
    if (!selector) throw new Error("Missing gene selector");
    await expect(selector.getBoundingClientRect().top).toBeLessThan(
      heading.getBoundingClientRect().bottom,
    );
    await expect(selector.getBoundingClientRect().left).toBeGreaterThan(
      heading.getBoundingClientRect().right,
    );
    await expect(switcher.getBoundingClientRect().top).toBeLessThan(
      heading.getBoundingClientRect().bottom,
    );
    container.style.width = "320px";
    await waitFor(() =>
      expect(selector.getBoundingClientRect().top).toBeGreaterThan(
        heading.getBoundingClientRect().bottom,
      ),
    );
    await expect(selector.getBoundingClientRect().right).toBeLessThanOrEqual(
      container.getBoundingClientRect().right,
    );
    await expect(switcher.getBoundingClientRect().right).toBeLessThanOrEqual(
      container.getBoundingClientRect().right,
    );
    await userEvent.click(genes);
    await userEvent.click(
      within(document.body).getByRole("option", { name: "geneA" }),
    );
    await expect(canvas.getByText("3 variants · 12 samples")).toBeVisible();
  },
};
const checkPalette = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const legendElement = canvas.getByRole("group", {
    name: "Variant call legend",
  });
  const legend = within(legendElement);
  const labels = {
    failed: "Failed",
    unphased: "Unphased",
    absent: "Absent",
    wt: "Wildtype",
    mixed: "Mixed",
    mutant: "Mutant",
  };
  for (const status of variantStatuses) {
    const sample = mockVariantSamples.find((s) =>
      mockVariants.some((v) => s.calls[v.id]?.status === status),
    )!;
    const variant = mockVariants.find(
      (v) => sample.calls[v.id]?.status === status,
    )!;
    const cell = await canvas.findByRole("button", {
      name: `${sample.sampleId} · ${sample.barcode} · ${variant.gene} ${variant.change} · ${labels[status]}`,
    });
    const swatch = legend.getByText(labels[status]).previousElementSibling!;
    const rect = cell.querySelector("rect")!;
    await expect(getComputedStyle(rect).fill).toBe(
      getComputedStyle(swatch).backgroundColor,
    );
    if (status === "wt" || status === "mixed" || status === "mutant") {
      const symbol = cell.querySelector(`[data-symbol="${status}"]`)!;
      const legendSymbol = swatch.querySelector(`[data-symbol="${status}"]`)!;
      await expect(symbol.innerHTML).toBe(legendSymbol.innerHTML);
      await expect(symbol.querySelector("circle")?.getAttribute("fill")).toBe(
        status === "mutant" ? "black" : "white",
      );
      await expect(Boolean(symbol.querySelector('[fill="black"]'))).toBe(
        status !== "wt",
      );
      await expect(Boolean(symbol.querySelector("path"))).toBe(
        status === "mixed",
      );
      await expect(symbol.querySelector("[stroke]")).toBeNull();
      continue;
    }
    const symbol = cell.querySelector("text")!;
    const legendSymbol = swatch.querySelector("text")!;
    await expect(getComputedStyle(symbol).fill).toBe(
      getComputedStyle(legendSymbol).fill,
    );
    if (status === "absent")
      await expect(getComputedStyle(rect).fill).toBe("rgb(255, 255, 255)");
    const rgb = (value: string) => value.match(/\d+/g)!.slice(0, 3).map(Number);
    const luminance = (value: string) => {
      const channels = rgb(value).map((channel) => {
        const n = channel / 255;
        return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const a = luminance(getComputedStyle(rect).fill);
    const b = luminance(getComputedStyle(symbol).fill);
    await expect(
      (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
    ).toBeGreaterThanOrEqual(4.5);
  }
  await expect(legend.getByText("Not reported")).toBeVisible();
  await expect(
    Array.from(
      legendElement.children,
      (element) => element.lastElementChild?.textContent,
    ),
  ).toEqual([
    "Failed",
    "Unphased",
    "Not reported",
    "Absent",
    "Wildtype",
    "Mixed",
    "Mutant",
  ]);
  const mixed = legend.getByText("Mixed").previousElementSibling!;
  const mutant = legend.getByText("Mutant").previousElementSibling!;
  await expect(getComputedStyle(mixed).backgroundColor).toBe(
    getComputedStyle(mutant).backgroundColor,
  );
};
export const LightTheme: Story = {
  globals: { colorScheme: "light" },
  play: checkPalette,
};
export const DarkTheme: Story = {
  globals: { colorScheme: "dark" },
  play: checkPalette,
};
export const CallDetails: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", {
        name: "Sample_01 · barcode01 · geneB D94G · Mixed",
      }),
    );
    await expect(canvas.getByText("37%")).toBeVisible();
    await expect(canvas.getByText("401")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Select Sample_02 · barcode02" }),
    );
    await expect(canvas.getByText("0%")).toBeVisible();
    await expect(canvas.getByText("484")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Sample_01 · barcode01 · geneC G190A · Failed",
      }),
    );
    await expect(canvas.getByText("0")).toBeVisible();
    await expect(canvas.getAllByText("Not reported").length).toBeGreaterThan(1);
  },
};
export const MultipleGenes: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    const genes = canvas.getByRole("combobox", { name: "Genes" });
    await userEvent.click(genes);
    await userEvent.click(body.getByRole("option", { name: "geneA" }));
    await userEvent.click(genes);
    await userEvent.click(body.getByRole("option", { name: "geneC" }));
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getByText("6 variants · 12 samples")).toBeVisible();
    await expect(canvas.queryByText("geneB · D94G")).not.toBeInTheDocument();
    await expect(canvas.getByText("geneC · M184V")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Clear genes" }));
    await expect(canvas.getByText("8 variants · 12 samples")).toBeVisible();
    await expect(canvas.getByText("geneB · D94G")).toBeVisible();
  },
};
export const OneSample: Story = {
  args: { samples: mockVariantSamples.slice(0, 1) },
};
export const Empty: Story = { args: { samples: [] } };
export const MissingCalls: Story = {
  args: { samples: [{ ...mockVariantSamples[0], calls: {} }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("button", {
        name: /Sample_01.*geneA A123G.*Not reported/,
      }),
    ).toBeVisible();
    await expect(canvas.getByText("Positive control")).toBeVisible();
    await expect(await canvas.findByText("PC")).toBeVisible();
  },
};
export const ControlBadges: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Positive control")).toBeVisible();
    await expect(await canvas.findByText("PC")).toBeVisible();
    await expect(canvas.getByText("NC")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Select Sample_02 · barcode02" }),
    );
    await expect(canvas.getByText("Negative control")).toBeVisible();
    await expect(
      canvas.queryByText("Positive control"),
    ).not.toBeInTheDocument();
    await userEvent.click(
      canvas.getByRole("button", { name: "Select Sample_03 · barcode03" }),
    );
    await expect(
      canvas.queryByText("Negative control"),
    ).not.toBeInTheDocument();
  },
};
export const KeyboardSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cellName = "Sample_02 · barcode02 · geneA L210F · Mutant";
    const cell = await canvas.findByRole("button", { name: cellName });
    cell.focus();
    await userEvent.keyboard("{Enter}");
    await expect(
      canvas.getByRole("button", { name: cellName }),
    ).toHaveAttribute("aria-pressed", "true");
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: cellName })).toHaveFocus(),
    );
    await expect(canvas.getByText("Negative control")).toBeVisible();
    const sample = canvas.getByRole("button", {
      name: "Select Sample_03 · barcode03",
    });
    sample.focus();
    await userEvent.keyboard(" ");
    await expect(
      canvas.getByRole("button", { name: "Select Sample_03 · barcode03" }),
    ).toHaveAttribute("aria-pressed", "true");
    await waitFor(() =>
      expect(
        canvas.getByRole("button", { name: "Select Sample_03 · barcode03" }),
      ).toHaveFocus(),
    );
  },
};
export const CellTooltip: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = "Sample_01 · barcode01 · geneA A123G · Mutant";
    const cell = await canvas.findByRole("button", { name: label });
    await userEvent.hover(cell);
    const tooltip = await within(document.body).findByRole("tooltip");
    await expect(tooltip).toHaveTextContent(label);
    const next = canvas.getByRole("button", {
      name: "Sample_01 · barcode01 · geneA L210F · Wildtype",
    });
    await userEvent.hover(next);
    await expect(tooltip).toHaveTextContent(
      "Sample_01 · barcode01 · geneA L210F · Wildtype",
    );
    await userEvent.unhover(next);
    await waitFor(() => expect(tooltip).not.toBeVisible());
  },
};
const checkWsafView = async ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  const canvas = within(canvasElement);
  const switcher = canvas.getByRole("radiogroup", { name: "Variant display" });
  const aaCall = within(switcher).getByRole("radio", { name: "AA Call" });
  const wsaf = within(switcher).getByRole("radio", { name: "WSAF" });
  await expect(aaCall).toBeChecked();
  const original = await canvas.findByRole("button", {
    name: "Sample_01 · barcode01 · geneA A123G · Mutant",
  });
  await userEvent.click(original);
  await userEvent.click(wsaf);
  await expect(wsaf).toBeChecked();
  const legend = within(
    canvas.getByRole("group", { name: "WSAF color scale" }),
  );
  for (const label of ["0%", "50%", "100%", "Not reported"]) {
    await expect(legend.getByText(label)).toBeVisible();
  }
  const cases = [
    ["A123G", "Mutant", "0%", "rgb(94, 79, 162)"],
    ["L210F", "Wildtype", "50%", "rgb(255, 255, 191)"],
    ["S315T", "Absent", "100%", "rgb(158, 1, 66)"],
    ["D94G", "Mixed", "Not reported", "rgb(233, 236, 239)"],
  ] as const;
  for (const [change, status, value, color] of cases) {
    const gene = change === "D94G" ? "geneB" : "geneA";
    const cell = canvas.getByRole("button", {
      name: `Sample_01 · barcode01 · ${gene} ${change} · ${status} · WSAF: ${value}`,
    });
    await expect(getComputedStyle(cell.querySelector("rect")!).fill).toBe(
      color,
    );
    await expect(cell.querySelector("[data-symbol]")).toBeNull();
  }
  const missingCall = canvas.getByRole("button", {
    name: "Missing sample · barcode02 · geneA A123G · Not reported · WSAF: Not reported",
  });
  const missingWsaf = canvas.getByRole("button", {
    name: "Sample_01 · barcode01 · geneB D94G · Mixed · WSAF: Not reported",
  });
  await expect(getComputedStyle(missingCall.querySelector("rect")!).fill).toBe(
    getComputedStyle(missingWsaf.querySelector("rect")!).fill,
  );
  const selected = canvas.getByRole("button", {
    name: "Sample_01 · barcode01 · geneA A123G · Mutant · WSAF: 0%",
  });
  await expect(selected).toHaveAttribute("aria-pressed", "true");
  await userEvent.hover(selected);
  await expect(
    await within(document.body).findByRole("tooltip"),
  ).toHaveTextContent("WSAF: 0%");
  const half = canvas.getByRole("button", {
    name: "Sample_01 · barcode01 · geneA L210F · Wildtype · WSAF: 50%",
  });
  half.focus();
  await userEvent.keyboard("{Enter}");
  await expect(half).toHaveAttribute("aria-pressed", "true");
  await expect(canvas.getAllByText("50%")).toHaveLength(2);
  await userEvent.click(canvas.getByRole("combobox", { name: "Genes" }));
  await userEvent.click(
    within(document.body).getByRole("option", { name: "geneA" }),
  );
  await userEvent.keyboard("{Escape}");
  await expect(canvas.getByText("3 variants · 2 samples")).toBeVisible();
  await expect(half).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(aaCall);
  await expect(
    canvas.getByRole("button", {
      name: "Sample_01 · barcode01 · geneA L210F · Wildtype",
    }),
  ).toHaveAttribute("aria-pressed", "true");
};
const wsafSamples = [
  {
    ...mockVariantSamples[0],
    calls: {
      ...mockVariantSamples[0].calls,
      [mockVariants[0].id]: { status: "mutant" as const, wsaf: 0, depth: 320 },
      [mockVariants[1].id]: { status: "wt" as const, wsaf: 0.5, depth: 347 },
      [mockVariants[2].id]: { status: "absent" as const, wsaf: 1, depth: 374 },
      [mockVariants[3].id]: {
        status: "mixed" as const,
        wsaf: null,
        depth: 401,
      },
    },
  },
  { ...mockVariantSamples[1], sampleId: "Missing sample", calls: {} },
];
export const WsafLightTheme: Story = {
  args: { samples: wsafSamples },
  globals: { colorScheme: "light" },
  play: checkWsafView,
};
export const WsafDarkTheme: Story = {
  args: { samples: wsafSamples },
  globals: { colorScheme: "dark" },
  play: checkWsafView,
};
export const LongSampleLabel: Story = {
  args: {
    samples: [
      {
        ...mockVariantSamples[0],
        sampleId: "Reference control with a long sample identifier",
      },
    ],
  },
};
export const ManySamples: Story = {
  args: {
    samples: Array.from({ length: 48 }, (_, i) => ({
      ...mockVariantSamples[i % mockVariantSamples.length],
      barcode: `barcode${i + 1}`,
      sampleId: `Sample_${i + 1}`,
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = (
      await canvas.findByTestId("variants-chart-scroll-area")
    ).querySelector<HTMLElement>(".mantine-ScrollArea-viewport");
    if (!viewport) throw new Error("Missing chart viewport");
    await canvas.findByRole("button", { name: "Select Sample_48 · barcode48" });
    await expect(viewport.scrollWidth).toBeGreaterThan(viewport.clientWidth);
    viewport.scrollLeft = viewport.scrollWidth;
    await waitFor(() => expect(viewport.scrollLeft).toBeGreaterThan(0));
    const sample = canvas.getByRole("button", {
      name: "Select Sample_48 · barcode48",
    });
    await userEvent.click(sample);
    await expect(
      canvas.getByRole("button", { name: "Select Sample_48 · barcode48" }),
    ).toHaveAttribute("aria-pressed", "true");
  },
};

export const ManyVariants: Story = {
  args: {
    variants: Array.from({ length: 50 }, (_, i) => ({
      id: `variant-${i + 1}`,
      gene: "geneA",
      change: `A${i + 1}G`,
    })),
    samples: mockVariantSamples.slice(0, 3),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const viewport = (
      await canvas.findByTestId("variants-chart-scroll-area")
    ).querySelector<HTMLElement>(".mantine-ScrollArea-viewport");
    if (!viewport) throw new Error("Missing chart viewport");
    const first = await canvas.findByRole("button", {
      name: "Sample_01 · barcode01 · geneA A1G · Not reported",
    });
    const nextRow = canvas.getByRole("button", {
      name: "Sample_01 · barcode01 · geneA A2G · Not reported",
    });
    const nextSample = canvas.getByRole("button", {
      name: "Sample_02 · barcode02 · geneA A1G · Not reported",
    });
    const rect = (element: HTMLElement) =>
      element.querySelector("rect")!.getBoundingClientRect();
    await expect(Math.round(rect(nextRow).top - rect(first).top)).toBe(24);
    await expect(Math.round(rect(nextSample).left - rect(first).left)).toBe(28);
    await expect(viewport.clientHeight).toBe(480);
    await expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);

    viewport.scrollTop = viewport.scrollHeight;
    await waitFor(() => expect(viewport.scrollTop).toBeGreaterThan(0));
    const last = canvas.getByRole("button", {
      name: "Sample_01 · barcode01 · geneA A50G · Not reported",
    });
    await userEvent.click(last);
    await expect(
      canvas.getByRole("button", {
        name: "Sample_01 · barcode01 · geneA A50G · Not reported",
      }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      canvas.getByRole("button", {
        name: "Select Sample_01 · barcode01",
      }),
    ).toBeVisible();
  },
};

export const RealisticRun: Story = {
  args: {
    variants: Array.from({ length: 82 }, (_, i) => ({
      id: `variant-${i + 1}`,
      gene: "geneA",
      change: `A${i + 1}G`,
    })),
    samples: Array.from({ length: 48 }, (_, i) => ({
      ...mockVariantSamples[i % mockVariantSamples.length],
      barcode: `barcode${String(i + 1).padStart(2, "0")}`,
      sampleId: `Sample_${String(i + 1).padStart(2, "0")}`,
    })),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const loader = canvas.queryByRole("status", {
      name: "Loading amino-acid changes",
    });
    if (loader) await expect(loader).toBeVisible();
    const cell = await canvas.findByRole("button", {
      name: "Sample_02 · barcode02 · geneA A1G · Not reported",
    });
    const otherRow = canvas.getByRole("button", {
      name: "Sample_01 · barcode01 · geneA A2G · Not reported",
    });
    await userEvent.click(cell);
    await expect(cell).toHaveAttribute("aria-pressed", "true");
    await expect(
      canvas.getByRole("button", {
        name: "Sample_01 · barcode01 · geneA A2G · Not reported",
      }),
    ).toBe(otherRow);
    await expect(canvas.getByText("Sample_02 · barcode02")).toBeVisible();
  },
};
