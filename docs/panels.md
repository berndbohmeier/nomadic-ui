# Panels

## Sequencing overview

The sequencing overview displays the latest coverage snapshot for selected samples
and controls. It evaluates only amplicons present in `summary.region_coverage.csv`;
missing amplicons are not counted, and a barcode without coverage rows is shown as
unavailable. The file's `cov_gr100_per` values are percentages, not fractions.
The source-code thresholds are grouped in `OVERVIEW_THRESHOLDS` in
[`summarizeSequencingOverview.ts`](src/features/experiments/panels/sequencing-overview/summarizeSequencingOverview.ts).
All completion, contamination and passing thresholds use strict comparisons.
An amplicon has no data when its mean coverage is below 5; a sample has no data
when more than 80% of its available amplicons have no data. Positive controls
have no data when all available amplicons have mean coverage below 5.
A passing negative control indicates only that its reported coverage does not
exceed the contamination threshold; it does not confirm the control was processed.
The negative-control summary counts passed controls out of all selected negative
controls, including unavailable controls. It is green only if all passed and red
if any are contaminated; otherwise it is neutral.
The sample donut counts overall sample statuses; samples without coverage rows
appear as unavailable.
