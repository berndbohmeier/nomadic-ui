import { describe, expect, it } from "vitest";
import type { OverviewBarcode } from "./summarizeSequencingOverview";
import {
  controlVisualizationData,
  sampleVisualizationData,
} from "./visualizationData";

function item(
  barcode: string,
  type: OverviewBarcode["sampleType"],
  status: OverviewBarcode["status"],
  statuses: OverviewBarcode["amplicons"][number]["status"][] = [],
): OverviewBarcode {
  return {
    barcode,
    sampleId: barcode,
    sampleType: type,
    status,
    passedCount: 0,
    amplicons: statuses.map((value) => ({
      status: value,
      row: {
        barcode,
        name: "amp",
        chrom: "chr",
        start: 0,
        end: 1,
        length: 1,
        mean_cov: 0,
        cov_gr100_per: 0,
        total_cov: 0,
        cov_gr100: 0,
        n_reads: 0,
      },
    })),
  };
}

describe("overview visualization data", () => {
  it("counts overall sample statuses including unavailable samples", () => {
    const samples = [
      item("mixed", "sample", "gathering", [
        "complete",
        "complete",
        "gathering",
      ]),
      item("missing", "sample", "unavailable"),
      item("empty", "sample", "noData", ["noData"]),
      item("complete", "sample", "complete", ["complete"]),
    ];
    const result = sampleVisualizationData(samples);
    expect(result.counts).toEqual({
      complete: 1,
      gathering: 1,
      noData: 1,
      unavailable: 1,
    });
  });

  it("handles empty selection", () => {
    expect(sampleVisualizationData([])).toEqual({
      counts: { complete: 0, gathering: 0, noData: 0, unavailable: 0 },
    });
    expect(controlVisualizationData([])).toEqual({
      positiveTotal: 0,
      passed: 0,
      allPositivePassed: false,
      negativeTotal: 0,
      negativePassed: 0,
      contaminated: 0,
    });
  });

  it("only marks all positive controls passed when every selected positive passes", () => {
    const passed = item("pos", "positive", "passed");
    const unavailable = item("unknown", "positive", "unavailable");
    const negative = item("neg", "negative", "contaminated");
    expect(controlVisualizationData([passed, negative])).toEqual({
      positiveTotal: 1,
      passed: 1,
      allPositivePassed: true,
      negativeTotal: 1,
      negativePassed: 0,
      contaminated: 1,
    });
    expect(
      controlVisualizationData([passed, unavailable, negative]),
    ).toMatchObject({
      positiveTotal: 2,
      passed: 1,
      allPositivePassed: false,
      contaminated: 1,
    });
    expect(
      controlVisualizationData([item("neg", "negative", "passed")]),
    ).toMatchObject({
      negativeTotal: 1,
      negativePassed: 1,
      contaminated: 0,
      allPositivePassed: false,
    });
  });

  it("counts passed, contaminated and unavailable negative controls separately", () => {
    expect(
      controlVisualizationData([
        item("passed", "negative", "passed"),
        item("contaminated", "negative", "contaminated"),
        item("unavailable", "negative", "unavailable"),
      ]),
    ).toMatchObject({
      negativeTotal: 3,
      negativePassed: 1,
      contaminated: 1,
    });
  });
});
