import { describe, expect, it } from "vitest";
import { joinPath } from "./joinPath";

describe("joinPath", () => {
  it("joins segments", () => {
    expect(joinPath("/ws", "results", "exp")).toBe("/ws/results/exp");
  });
  it("collapses separators at the seams", () => {
    expect(joinPath("/ws/", "/results/", "exp")).toBe("/ws/results/exp");
    expect(joinPath("C:\\ws\\", "results")).toBe("C:\\ws/results");
  });
  it("returns the base for no segments", () => {
    expect(joinPath("/ws")).toBe("/ws");
  });
});
