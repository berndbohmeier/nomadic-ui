use polars::prelude::*;
use serde::Serialize;
use std::collections::HashSet;
use std::path::Path;
use std::sync::Arc;

const INTEGER_COLUMNS: [&str; 6] = [
    "start",
    "length",
    "end",
    "total_cov",
    "cov_gr100",
    "n_reads",
];
const FLOAT_COLUMNS: [&str; 2] = ["mean_cov", "cov_gr100_per"];
const MAX_SAFE_INTEGER: u64 = 9_007_199_254_740_991;

#[derive(Debug, Serialize)]
pub struct RegionCoverageRow {
    barcode: String,
    chrom: String,
    start: u64,
    length: u64,
    end: u64,
    mean_cov: f64,
    name: String,
    cov_gr100_per: f64,
    total_cov: u64,
    cov_gr100: u64,
    n_reads: u64,
}

fn options() -> CsvReadOptions {
    let mut schema = Schema::default();
    for name in ["barcode", "chrom", "name"] {
        schema.with_column(name.into(), DataType::String);
    }
    for name in INTEGER_COLUMNS {
        schema.with_column(name.into(), DataType::UInt64);
    }
    for name in FLOAT_COLUMNS {
        schema.with_column(name.into(), DataType::Float64);
    }
    CsvReadOptions::default()
        .with_has_header(true)
        .with_schema_overwrite(Some(Arc::new(schema)))
}

fn required_text<'a>(
    column: &'a StringChunked,
    index: usize,
    label: &str,
) -> Result<&'a str, String> {
    column
        .get(index)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| format!("Missing region coverage {label} on row {}", index + 2))
}

fn parse(frame: &DataFrame) -> Result<Vec<RegionCoverageRow>, String> {
    let text = |name: &str| {
        frame
            .column(name)
            .and_then(|column| column.str())
            .map_err(|error| format!("Invalid region coverage {name} column: {error}"))
    };
    let barcode_column = text("barcode")?;
    let chrom_column = text("chrom")?;
    let name_column = text("name")?;
    let integers: Vec<&UInt64Chunked> = INTEGER_COLUMNS
        .iter()
        .map(|name| {
            frame
                .column(name)
                .and_then(|column| column.u64())
                .map_err(|error| format!("Invalid region coverage {name} column: {error}"))
        })
        .collect::<Result<_, _>>()?;
    let floats: Vec<&Float64Chunked> = FLOAT_COLUMNS
        .iter()
        .map(|name| {
            frame
                .column(name)
                .and_then(|column| column.f64())
                .map_err(|error| format!("Invalid region coverage {name} column: {error}"))
        })
        .collect::<Result<_, _>>()?;

    let mut seen = HashSet::new();
    let mut result = Vec::with_capacity(frame.height());
    for index in 0..frame.height() {
        let barcode = required_text(barcode_column, index, "barcode")?;
        if barcode.eq_ignore_ascii_case("unclassified") {
            continue;
        }
        let chrom = required_text(chrom_column, index, "chrom")?;
        let name = required_text(name_column, index, "name")?;
        if !seen.insert((barcode.to_owned(), name.to_owned())) {
            return Err(format!(
                "Duplicate region coverage row for {barcode} and {name}"
            ));
        }
        let mut integer_values = [0_u64; 6];
        for (position, column) in integers.iter().enumerate() {
            let value = column.get(index).ok_or_else(|| {
                format!(
                    "Missing {} for {barcode} and {name}",
                    INTEGER_COLUMNS[position]
                )
            })?;
            if value > MAX_SAFE_INTEGER {
                return Err(format!(
                    "{} exceeds supported range for {barcode} and {name}",
                    INTEGER_COLUMNS[position]
                ));
            }
            integer_values[position] = value;
        }
        let mut float_values = [0_f64; 2];
        for (position, column) in floats.iter().enumerate() {
            let value = column
                .get(index)
                .filter(|value| value.is_finite())
                .ok_or_else(|| {
                    format!(
                        "Invalid {} for {barcode} and {name}",
                        FLOAT_COLUMNS[position]
                    )
                })?;
            float_values[position] = value;
        }
        let [start, length, end, total_cov, cov_gr100, n_reads] = integer_values;
        let [mean_cov, cov_gr100_per] = float_values;
        result.push(RegionCoverageRow {
            barcode: barcode.to_owned(),
            chrom: chrom.to_owned(),
            start,
            length,
            end,
            mean_cov,
            name: name.to_owned(),
            cov_gr100_per,
            total_cov,
            cov_gr100,
            n_reads,
        });
    }
    Ok(result)
}

pub fn load(root: &Path) -> Result<Vec<RegionCoverageRow>, String> {
    let path = root.join("summary.region_coverage.csv");
    let frame = options()
        .try_into_reader_with_file_path(Some(path.clone()))
        .and_then(|reader| reader.finish())
        .map_err(|error| format!("Could not read {}: {error}", path.display()))?;
    parse(&frame)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    const HEADER: &str =
        "barcode,chrom,start,length,end,mean_cov,name,cov_gr100_per,total_cov,cov_gr100,n_reads\n";

    fn rows(value: &str) -> DataFrame {
        options()
            .into_reader_with_file_handle(Cursor::new(format!("{HEADER}{value}").into_bytes()))
            .finish()
            .unwrap()
    }

    #[test]
    fn loads_real_experiment_and_excludes_unclassified() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../test_data/nomadic/results/2025_07_28_new_dbs");
        let data = load(&root).unwrap();
        assert_eq!(data.len(), 480);
        assert_eq!(data[0].name, "ama1-p74-384");
        assert_eq!(data[0].n_reads, 624);
        assert!(data
            .iter()
            .all(|row| !row.barcode.eq_ignore_ascii_case("unclassified")));
    }

    #[test]
    fn excludes_unclassified_case_insensitively() {
        let data = parse(&rows("unclassified,chr,1,2,3,4,a,5,6,7,8\nUnClAsSiFiEd,chr,1,2,3,4,b,5,6,7,8\nbarcode01,chr,1,2,3,4,a,5,6,7,8\n")).unwrap();
        assert_eq!(data.len(), 1);
        assert_eq!(data[0].barcode, "barcode01");
    }

    #[test]
    fn rejects_duplicate_barcode_amplicon_pairs() {
        let frame = rows("barcode01,chr,1,2,3,4,a,5,6,7,8\nbarcode01,chr,1,2,3,4,a,5,6,7,8\n");
        assert!(parse(&frame).is_err());
    }
}
