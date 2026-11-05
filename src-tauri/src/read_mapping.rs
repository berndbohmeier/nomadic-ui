use polars::prelude::*;
use serde::Serialize;
use std::collections::HashSet;
use std::path::Path;
use std::sync::Arc;

const COUNT_COLUMNS: [&str; 6] = [
    "n_total",
    "n_mapped",
    "n_primary",
    "n_secondary",
    "n_supplementary",
    "n_unmapped",
];

#[derive(Debug, Serialize)]
pub struct ReadMappingCounts {
    barcode: String,
    n_total: u64,
    n_mapped: u64,
    n_primary: u64,
    n_secondary: u64,
    n_supplementary: u64,
    n_unmapped: u64,
}

fn mapping_options() -> CsvReadOptions {
    let mut schema = Schema::default();
    schema.with_column("barcode".into(), DataType::String);
    for name in COUNT_COLUMNS {
        schema.with_column(name.into(), DataType::UInt64);
    }
    CsvReadOptions::default()
        .with_has_header(true)
        .with_schema_overwrite(Some(Arc::new(schema)))
}

fn read_csv(path: &Path, options: CsvReadOptions) -> Result<DataFrame, String> {
    options
        .try_into_reader_with_file_path(Some(path.to_path_buf()))
        .and_then(|reader| reader.finish())
        .map_err(|error| format!("Could not read {}: {error}", path.display()))
}

fn parse_mapping(frame: &DataFrame) -> Result<Vec<ReadMappingCounts>, String> {
    let barcodes = frame
        .column("barcode")
        .and_then(|column| column.str())
        .map_err(|error| format!("Invalid read mapping barcode column: {error}"))?;
    let columns: Vec<&UInt64Chunked> = COUNT_COLUMNS
        .iter()
        .map(|name| {
            frame
                .column(name)
                .and_then(|column| column.u64())
                .map_err(|error| format!("Invalid read count column {name}: {error}"))
        })
        .collect::<Result<_, _>>()?;
    let mut seen = HashSet::new();
    let mut result = Vec::with_capacity(frame.height());

    for index in 0..frame.height() {
        let barcode = barcodes
            .get(index)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| format!("Missing read mapping barcode on row {}", index + 2))?;
        let mut values = [0_u64; 6];
        for (column_index, column) in columns.iter().enumerate() {
            values[column_index] = column
                .get(index)
                .ok_or_else(|| format!("Missing {} for {barcode}", COUNT_COLUMNS[column_index]))?;
            // The frontend uses JavaScript numbers: never silently round a count.
            if values[column_index] > 9_007_199_254_740_991 {
                return Err(format!("Read count exceeds supported range for {barcode}"));
            }
        }
        let [n_total, n_mapped, n_primary, n_secondary, n_supplementary, n_unmapped] = values;
        if n_primary + n_secondary + n_supplementary != n_mapped || n_mapped + n_unmapped != n_total
        {
            return Err(format!("Inconsistent read counts for {barcode}"));
        }
        if !seen.insert(barcode.to_owned()) {
            return Err(format!("Duplicate read mapping barcode: {barcode}"));
        }
        result.push(ReadMappingCounts {
            barcode: barcode.to_owned(),
            n_total,
            n_mapped,
            n_primary,
            n_secondary,
            n_supplementary,
            n_unmapped,
        });
    }
    Ok(result)
}

pub fn load(root: &Path) -> Result<Vec<ReadMappingCounts>, String> {
    let mapping = read_csv(&root.join("summary.read_mapping.csv"), mapping_options())?;
    parse_mapping(&mapping)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    const HEADER: &str =
        "n_total,n_mapped,n_primary,n_secondary,n_supplementary,n_unmapped,barcode\n";

    fn mapping(rows: &str) -> Result<DataFrame, PolarsError> {
        mapping_options()
            .into_reader_with_file_handle(Cursor::new(format!("{HEADER}{rows}").into_bytes()))
            .finish()
    }

    #[test]
    fn loads_real_experiment_without_metadata() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../test_data/nomadic/results/2025_07_28_new_dbs");
        let rows = load(&root).unwrap();
        assert_eq!(rows[0].barcode, "barcode01");
        assert_eq!(rows[0].n_primary, 7871);
        let json = serde_json::to_value(&rows[0]).unwrap();
        assert_eq!(json["n_primary"], 7871);
        assert!(json.get("sampleId").is_none());
    }

    #[test]
    fn rejects_invalid_counts() {
        assert!(parse_mapping(&mapping("10,8,,1,1,2,barcode01\n").unwrap()).is_err());
        assert!(mapping("10,8,-1,1,1,2,barcode01\n").is_err());
        assert!(parse_mapping(&mapping("10,8,8,1,1,2,barcode01\n").unwrap()).is_err());
    }

    #[test]
    fn preserves_unclassified_counts_for_run_wide_summaries() {
        let frame =
            mapping("100,80,60,10,10,20,barcode01\n1000,200,150,30,20,800,unclassified\n").unwrap();
        let rows = parse_mapping(&frame).unwrap();
        let unclassified = rows
            .iter()
            .find(|row| row.barcode == "unclassified")
            .unwrap();
        assert_eq!(unclassified.n_total, 1000);
        assert_eq!(unclassified.n_mapped, 200);
        assert_eq!(rows.iter().map(|row| row.n_total).sum::<u64>(), 1100);
    }

    #[test]
    fn rejects_duplicate_barcodes() {
        let frame = mapping("0,0,0,0,0,0,barcode01\n0,0,0,0,0,0,barcode01\n").unwrap();
        assert!(parse_mapping(&frame).is_err());
    }
}
