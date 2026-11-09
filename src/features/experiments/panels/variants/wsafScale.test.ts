import { describe, expect, it } from "vitest";
import {
  spectralReversed,
  wsafColor,
  wsafGradient,
  wsafMissingColor,
} from "./wsafScale";

describe("WSAF color scale", () => {
  it("uses every Plotly Spectral_r stop from 0 to 1", () => {
    spectralReversed.forEach((color, index) => {
      expect(wsafColor(index / 10)).toBe(color);
      expect(wsafGradient).toContain(color);
    });
  });

  it("interpolates between stops and distinguishes missing from zero", () => {
    expect(wsafColor(0.05)).toBe("#486cb0");
    expect(wsafColor(0)).toBe("#5e4fa2");
    expect(wsafColor(0.5)).toBe("#ffffbf");
    expect(wsafColor(1)).toBe("#9e0142");
    expect(wsafColor(null)).toBe(wsafMissingColor);
  });
});
