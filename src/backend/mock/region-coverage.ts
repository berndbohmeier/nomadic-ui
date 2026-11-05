import type { RegionCoverageRow } from "../contract";
import { metadataData } from "./read-mapping";

const AMPLICONS = [
  ["Pf3D7_11_v3", 1_294_074, 826, "ama1-p74-384"],
  ["Pf3D7_07_v3", 403_260, 692, "crt-p14-125"],
  ["Pf3D7_03_v3", 221_190, 1_273, "csp-p19-398"],
  ["Pf3D7_04_v3", 747_913, 1_405, "dhfr-p1-410"],
  ["Pf3D7_08_v3", 549_323, 1_327, "dhps-p317-707"],
  ["Pf3D7_08_v3", 1_373_965, 1_296, "hrp2-p14-306"],
  ["Pf3D7_13_v3", 2_840_450, 1_216, "hrp3-p14-276"],
  ["Pf3D7_13_v3", 1_724_567, 1_286, "kelch13-p383-727"],
  ["Pf3D7_05_v3", 960_788, 935, "mdr1-p968-1278"],
  ["Pf3D7_05_v3", 958_022, 604, "mdr1-p46-245"],
] as const;

/** Deterministic in-memory equivalent of the native region coverage CSV. */
export const regionCoverageData: RegionCoverageRow[] = metadataData.flatMap(
  ({ barcode }, barcodeIndex) =>
    AMPLICONS.map(([chrom, start, length, name], ampliconIndex) => {
      const n_reads =
        barcodeIndex >= 45
          ? (barcodeIndex + ampliconIndex) % 4
          : (barcodeIndex * 97 + ampliconIndex * 181) % 2_200;
      const mean_cov = n_reads * 0.52;
      const cov_gr100 = mean_cov >= 100 ? Math.round(length * 0.97) : 0;
      return {
        barcode,
        chrom,
        start,
        length,
        end: start + length,
        mean_cov,
        name,
        cov_gr100_per: (cov_gr100 / length) * 100,
        total_cov: Math.round(mean_cov * length),
        cov_gr100,
        n_reads,
      };
    }),
);
