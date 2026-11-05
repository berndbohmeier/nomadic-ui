import { describe, expect, it } from "vitest";
import type { ExperimentInfo } from "../../../backend/contract";
import { getAvailablePanels } from "./registry";

const experiment = (files: string[]): ExperimentInfo => ({
  path: "/x/exp",
  name: "exp",
  settings: null,
  files,
});

const ids = (files: string[]) =>
  getAvailablePanels(experiment(files)).map((p) => p.panel.id);

describe("getAvailablePanels", () => {
  it("returns all panels when all files exist", () => {
    expect(
      ids([
        "summary.aa_changes.csv",
        "summary.region_coverage.csv",
        "summary.read_mapping.csv",
      ]),
    ).toEqual(["readMapping", "regionCoverage", "aaChange"]);
  });

  it("returns none when no files exist", () => {
    expect(ids(["other.csv"])).toEqual([]);
  });

  it("returns only panels with their file present", () => {
    expect(ids(["summary.region_coverage.csv"])).toEqual(["regionCoverage"]);
  });

  it("accepts the legacy AA changes file and reports which file matched", () => {
    const result = getAvailablePanels(experiment(["summary.variants.csv"]));
    expect(result.map((p) => [p.panel.id, p.file])).toEqual([
      ["aaChange", "summary.variants.csv"],
    ]);
  });

  it("prefers the current AA changes file over the legacy one", () => {
    const result = getAvailablePanels(
      experiment(["summary.variants.csv", "summary.aa_changes.csv"]),
    );
    expect(result[0].file).toBe("summary.aa_changes.csv");
  });

  it("skips panels failing their check", () => {
    const result = getAvailablePanels(experiment(["a.csv"]), [
      {
        id: "p",
        label: () => "k",
        sourceFiles: ["a.csv"],
        check: () => ({ ok: false, reason: "bad" }),
        Component: () => null,
      },
    ]);
    expect(result).toEqual([]);
  });
});
