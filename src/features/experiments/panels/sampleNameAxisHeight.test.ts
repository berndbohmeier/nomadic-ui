import { describe, expect, it } from "vitest";
import { getSampleNameAxisHeight } from "./sampleNameAxisHeight";

describe("getSampleNameAxisHeight", () => {
  it("fits the widest sample name with the label offset and padding", () => {
    expect(
      getSampleNameAxisHeight(["short", "long"], (sampleName) =>
        sampleName === "long" ? 80.4 : 30,
      ),
    ).toBe(139);
  });

  it("retains only the space needed for the barcode labels when names are empty", () => {
    expect(getSampleNameAxisHeight(["", ""], () => 0)).toBe(58);
  });
});
