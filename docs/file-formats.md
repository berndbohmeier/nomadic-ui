# File formats

## Amino-acid changes

The AA changes panel reads `summary.aa_changes.csv`. If that file is missing it
falls back to the legacy `summary.variants.csv`. Both files are read with
Polars and normalized to the same in-memory shape:

| Field       | Type            | Meaning                                                 |
| ----------- | --------------- | ------------------------------------------------------- |
| `barcode`   | string          | Sample barcode, e.g. `barcode01`                        |
| `gene`      | string          | Gene the change belongs to                              |
| `aa_change` | string          | Amino-acid change, e.g. `A361E`                         |
| `aa_call`   | string          | `wt`, `failed`, `mixed`, `mutant`, `absent`, `unphased` |
| `aa_depth`  | integer or null | Read depth at the position                              |
| `aa_wsaf`   | number or null  | Within-sample allele frequency, `0`–`1`                 |

### Current format: `summary.aa_changes.csv`

The file is already filtered to the changes that should be displayed, so no
mutation-type filter is applied. Required columns:

| Column      | Notes                                    |
| ----------- | ---------------------------------------- |
| `barcode`   |                                          |
| `gene`      |                                          |
| `aa_change` |                                          |
| `aa_call`   | Must be one of the calls listed above    |
| `aa_dp`     | Unsigned integer; empty means unreported |
| `aa_wsaf`   | Float; values above `1` are clamped to `1`; empty means unreported |

Additional columns such as `chrom`, `amplicon`, `aa_pos`, and `nt_change` are
ignored.

### Legacy format: `summary.variants.csv`

The legacy file contains all variant types, so it is filtered while loading.
Required columns:

| Column      | Notes                                                    |
| ----------- | -------------------------------------------------------- |
| `barcode`   |                                                          |
| `amplicon`  | Amplicon name; the gene is the part before the first `-` |
| `aa_change` | Rows with a blank or `.` value are skipped               |
| `gt`        | Genotype, see mapping below                              |
| `dp`        | Depth; see parsing rules below                           |
| `wsaf`      | Float; values above `1` are clamped to `1`; `.` or empty means unreported |
| `mut_type`  | Only rows containing `missense` are kept                 |

Other columns (`chrom`, `pos`, `ref`, `alt`, `qual`, `aa_pos`, `strand`,
`sample_id`) are ignored.

#### Filtering

- Only rows whose `mut_type` contains the substring `missense` are kept, so
  compound values such as `missense;splice_region` are included. Rows with
  `synonymous`, `intron`, `splice_region`, `.`, or an empty value are dropped.
- Rows with a blank or `.` `aa_change` are dropped because they cannot be
  placed in the amino-acid matrix.
- Filtering happens before the per-row validation, so invalid genotypes,
  depths, or duplicate keys in dropped rows do not cause an error. Column types
  are still parsed for the whole file first, so a non-numeric `wsaf` anywhere in
  the file is reported as a read error.

#### Genotype mapping

| `gt` value                          | `aa_call` |
| ----------------------------------- | --------- |
| `0/0` (any number of leading zeros) | `wt`      |
| `./.`                               | `failed`  |
| `a/b` with `a == b` and `a != 0`    | `mutant`  |
| `a/b` with `a != b`                 | `mixed`   |

Both alleles must be non-empty decimal integers; anything else is an error.

#### Depth parsing

`dp` is read as text and validated without floating-point rounding:

- Empty and `.` mean unreported depth.
- Integer values are accepted, including decimal representations whose
  fractional digits are all zero, e.g. `20.0` and `1.000`.
- Negative values, non-zero fractions such as `1.5`, non-numeric values, and
  values above `9007199254740991` (the largest integer exactly representable in
  a JavaScript number) are errors.

### Validation

For both formats:

- `barcode`, `gene`, and `aa_change` must be non-empty.
- Rows with the barcode `unclassified` are skipped.
- `aa_wsaf` must be finite and non-negative; values above `1` are clamped to `1`
  as a temporary workaround for a processing-pipeline bug.
- `aa_depth` must not exceed `9007199254740991`.
- A duplicate `(barcode, gene, aa_change)` combination is an error.
- A missing required column, an unreadable file, or an unsupported file name is
  reported as an error.

### Display

The panel shows the selected samples (excluding unclassified) and all changes
in the file. A missing call is shown as **Not reported**, not as absent; depth
and within-sample allele frequency may also be unreported.

The AA Call view shows call statuses; the WSAF view shows a continuous Plotly
Spectral_r color scale from 0% to 100%. Missing WSAF values are grey, including
cells without a reported call. Selecting a cell shows the same call details in
either view.
