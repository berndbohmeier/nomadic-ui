use polars::prelude::*;
use serde::Serialize;
use std::collections::BTreeMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

const COUNT_COLUMNS: [&str; 6] = [
    "n_total",
    "n_mapped",
    "n_primary",
    "n_secondary",
    "n_supplementary",
    "n_unmapped",
];

#[derive(Clone, Copy, Debug, Default, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SampleType {
    #[default]
    Sample,
    Positive,
    Negative,
}

#[derive(Debug, Serialize)]
pub struct ReadMappingDatum {
    barcode: String,
    #[serde(rename = "sampleId")]
    sample_id: String,
    #[serde(rename = "sampleType")]
    sample_type: SampleType,
    n_total: u64,
    n_mapped: u64,
    n_primary: u64,
    n_secondary: u64,
    n_supplementary: u64,
    n_unmapped: u64,
}

#[derive(Default)]
struct Sample {
    id: String,
    sample_type: SampleType,
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

fn metadata_options() -> CsvReadOptions {
    // Metadata contains mixed, optional values; preserve identifiers as strings.
    CsvReadOptions::default()
        .with_has_header(true)
        .with_infer_schema_length(Some(0))
}

fn read_csv(path: &Path, options: CsvReadOptions) -> Result<DataFrame, String> {
    options
        .try_into_reader_with_file_path(Some(path.to_path_buf()))
        .and_then(|reader| reader.finish())
        .map_err(|error| format!("Could not read {}: {error}", path.display()))
}

fn read_sample_metadata(path: &Path) -> Result<DataFrame, String> {
    let mut first_columns = None;
    let mut first_error = None;

    // Probe the header with each supported separator. Polars handles quoted
    // fields here, including commas inside semicolon-delimited column names.
    for separator in [b',', b';'] {
        let options = metadata_options().map_parse_options(|parse| parse.with_separator(separator));
        match read_csv(path, options.clone().with_n_rows(Some(0))) {
            Ok(header) if header.column("barcode").is_ok() => {
                return read_csv(path, options);
            }
            Ok(header) => {
                if first_columns.is_none() {
                    first_columns = Some(
                        header
                            .get_column_names()
                            .iter()
                            .map(|name| name.as_str())
                            .collect::<Vec<_>>()
                            .join(", "),
                    );
                }
            }
            Err(error) => {
                if first_error.is_none() {
                    first_error = Some(error);
                }
            }
        }
    }

    match first_columns {
        Some(columns) => Err(format!(
            "Missing barcode column in metadata {} (read using comma or semicolon separators; columns: {columns})",
            path.display()
        )),
        None => Err(first_error.unwrap_or_else(|| format!("Could not read {}", path.display()))),
    }
}

fn parse_metadata(frame: &DataFrame) -> Result<BTreeMap<String, Sample>, String> {
    let mut samples = BTreeMap::new();
    let barcodes = frame
        .column("barcode")
        .and_then(|column| column.str())
        .map_err(|error| format!("Invalid metadata barcode column: {error}"))?;
    let ids = frame
        .column("sample_id")
        .ok()
        .map(|column| column.str())
        .transpose()
        .map_err(|error| format!("Invalid sample_id column: {error}"))?;
    let types = frame
        .column("sample_type")
        .ok()
        .map(|column| column.str())
        .transpose()
        .map_err(|error| format!("Invalid sample_type column: {error}"))?;

    for index in 0..frame.height() {
        let barcode = barcodes
            .get(index)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| format!("Missing metadata barcode on row {}", index + 2))?;
        let id = ids
            .and_then(|column| column.get(index))
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .unwrap_or(barcode)
            .to_owned();
        let kind = types
            .and_then(|column| column.get(index))
            .unwrap_or_default()
            .trim()
            .to_ascii_lowercase();
        let sample_type = match kind.as_str() {
            "pos" | "positive" | "positive_control" => SampleType::Positive,
            "neg" | "negative" | "negative_control" => SampleType::Negative,
            _ => SampleType::Sample,
        };
        if samples
            .insert(barcode.to_owned(), Sample { id, sample_type })
            .is_some()
        {
            return Err(format!("Duplicate metadata barcode: {barcode}"));
        }
    }
    Ok(samples)
}

fn parse_mapping(frame: &DataFrame, metadata: &DataFrame) -> Result<Vec<ReadMappingDatum>, String> {
    let mut samples = parse_metadata(metadata)?;
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
    let mut result = BTreeMap::new();

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
        let sample = samples.remove(barcode).unwrap_or_else(|| Sample {
            id: barcode.to_owned(),
            sample_type: SampleType::Sample,
        });
        let row = ReadMappingDatum {
            barcode: barcode.to_owned(),
            sample_id: sample.id,
            sample_type: sample.sample_type,
            n_total,
            n_mapped,
            n_primary,
            n_secondary,
            n_supplementary,
            n_unmapped,
        };
        if result.insert(barcode.to_owned(), row).is_some() {
            return Err(format!("Duplicate read mapping barcode: {barcode}"));
        }
    }

    // Samples without sequencing reads must still be visible, including controls.
    for (barcode, sample) in samples {
        result.insert(
            barcode.clone(),
            ReadMappingDatum {
                barcode,
                sample_id: sample.id,
                sample_type: sample.sample_type,
                n_total: 0,
                n_mapped: 0,
                n_primary: 0,
                n_secondary: 0,
                n_supplementary: 0,
                n_unmapped: 0,
            },
        );
    }
    Ok(result.into_values().collect())
}

fn find_metadata_path(root: &Path) -> Result<PathBuf, String> {
    let directory = root.join("metadata");
    let preferred = directory.join("samples.csv");
    match std::fs::metadata(&preferred) {
        Ok(metadata) if metadata.is_file() => return Ok(preferred),
        Ok(_) => {}
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {}
        Err(error) => return Err(format!("Could not access {}: {error}", preferred.display())),
    }

    let entries = std::fs::read_dir(&directory).map_err(|error| {
        if error.kind() == std::io::ErrorKind::NotFound {
            "METADATA_CSV_NOT_FOUND".to_owned()
        } else {
            format!("Could not read {}: {error}", directory.display())
        }
    })?;
    let mut candidate = None;
    for entry in entries {
        let entry =
            entry.map_err(|error| format!("Could not read {}: {error}", directory.display()))?;
        if !entry.file_name().as_encoded_bytes().ends_with(b".csv") {
            continue;
        }
        let path = entry.path();
        let metadata = std::fs::metadata(&path)
            .map_err(|error| format!("Could not access {}: {error}", path.display()))?;
        if metadata.is_file() {
            if candidate.is_some() {
                return Err("METADATA_CSV_AMBIGUOUS".to_owned());
            }
            candidate = Some(path);
        }
    }
    candidate.ok_or_else(|| "METADATA_CSV_NOT_FOUND".to_owned())
}

pub fn load(root: &Path) -> Result<Vec<ReadMappingDatum>, String> {
    let mapping = read_csv(&root.join("summary.read_mapping.csv"), mapping_options())?;
    let metadata_path = find_metadata_path(root)?;
    let metadata = read_sample_metadata(&metadata_path)?;
    parse_mapping(&mapping, &metadata)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;
    use std::sync::atomic::{AtomicUsize, Ordering};

    struct TestExperiment(PathBuf);

    impl TestExperiment {
        fn new() -> Self {
            static NEXT_ID: AtomicUsize = AtomicUsize::new(0);
            let root = std::env::temp_dir().join(format!(
                "nomadic-metadata-test-{}-{}",
                std::process::id(),
                NEXT_ID.fetch_add(1, Ordering::Relaxed)
            ));
            std::fs::create_dir(&root).unwrap();
            std::fs::write(
                root.join("summary.read_mapping.csv"),
                format!("{HEADER}10,8,6,1,1,2,barcode01\n"),
            )
            .unwrap();
            Self(root)
        }

        fn metadata_dir(&self) -> PathBuf {
            self.0.join("metadata")
        }
    }

    impl Drop for TestExperiment {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    const HEADER: &str =
        "n_total,n_mapped,n_primary,n_secondary,n_supplementary,n_unmapped,barcode\n";

    fn mapping(rows: &str) -> Result<DataFrame, PolarsError> {
        mapping_options()
            .into_reader_with_file_handle(Cursor::new(format!("{HEADER}{rows}").into_bytes()))
            .finish()
    }

    fn metadata(rows: &str) -> DataFrame {
        metadata_options()
            .into_reader_with_file_handle(Cursor::new(rows.as_bytes()))
            .finish()
            .unwrap()
    }

    #[test]
    fn prefers_samples_csv_even_with_other_csv_files() {
        let experiment = TestExperiment::new();
        std::fs::create_dir(experiment.metadata_dir()).unwrap();
        std::fs::write(
            experiment.metadata_dir().join("samples.csv"),
            "barcode,sample_id\nbarcode01,Preferred\n",
        )
        .unwrap();
        std::fs::write(
            experiment.metadata_dir().join("other.csv"),
            "not,metadata\n",
        )
        .unwrap();

        let rows = load(&experiment.0).unwrap();
        assert_eq!(rows[0].sample_id, "Preferred");
    }

    #[test]
    fn loads_the_only_csv_and_ignores_non_files_and_other_extensions() {
        let experiment = TestExperiment::new();
        std::fs::create_dir(experiment.metadata_dir()).unwrap();
        std::fs::write(
            experiment.metadata_dir().join("custom.csv"),
            "barcode,sample_id\nbarcode01,Fallback\n",
        )
        .unwrap();
        std::fs::write(experiment.metadata_dir().join("settings.json"), "{}").unwrap();
        std::fs::write(
            experiment.metadata_dir().join("other.CSV"),
            "not,metadata\n",
        )
        .unwrap();
        std::fs::create_dir(experiment.metadata_dir().join("folder.csv")).unwrap();

        let rows = load(&experiment.0).unwrap();
        assert_eq!(rows[0].sample_id, "Fallback");
    }

    #[test]
    fn loads_semicolon_delimited_sample_metadata() {
        let experiment = TestExperiment::new();
        std::fs::create_dir(experiment.metadata_dir()).unwrap();
        let source = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../test_data/nomadic/metadata/2025_07_28_new_dbs.csv");
        std::fs::copy(source, experiment.metadata_dir().join("sample-info.csv")).unwrap();

        let rows = load(&experiment.0).unwrap();
        assert_eq!(rows.len(), 48);
        assert_eq!(rows[0].sample_id, "3D7_100_N");
        assert_eq!(rows[0].sample_type, SampleType::Positive);
        assert_eq!(rows[0].n_primary, 6);
        assert_eq!(rows[45].sample_type, SampleType::Negative);
    }

    #[test]
    fn handles_quoted_commas_in_semicolon_delimited_metadata() {
        let experiment = TestExperiment::new();
        std::fs::create_dir(experiment.metadata_dir()).unwrap();
        std::fs::write(
            experiment.metadata_dir().join("samples.csv"),
            "sample_id;barcode;sample_type;notes\n\"Sample, one\";barcode01;positive_control;\"batch, one\"\n",
        )
        .unwrap();

        let rows = load(&experiment.0).unwrap();
        assert_eq!(rows[0].sample_id, "Sample, one");
        assert_eq!(rows[0].sample_type, SampleType::Positive);
    }

    #[test]
    fn handles_quoted_semicolons_in_comma_delimited_metadata() {
        let experiment = TestExperiment::new();
        std::fs::create_dir(experiment.metadata_dir()).unwrap();
        std::fs::write(
            experiment.metadata_dir().join("samples.csv"),
            "sample_id,barcode,sample_type,notes\n\"Sample; one\",barcode01,negative_control,\"batch; one\"\n",
        )
        .unwrap();

        let rows = load(&experiment.0).unwrap();
        assert_eq!(rows[0].sample_id, "Sample; one");
        assert_eq!(rows[0].sample_type, SampleType::Negative);
    }

    #[test]
    fn reports_metadata_path_when_barcode_column_is_missing() {
        let experiment = TestExperiment::new();
        std::fs::create_dir(experiment.metadata_dir()).unwrap();
        std::fs::write(
            experiment.metadata_dir().join("samples.csv"),
            "sample_id;well\nSample;A1\n",
        )
        .unwrap();

        let error = load(&experiment.0).unwrap_err();
        assert!(error.contains("Missing barcode column"));
        assert!(error.contains("samples.csv"));
    }

    #[test]
    fn errors_when_metadata_folder_or_csv_is_missing() {
        let experiment = TestExperiment::new();
        assert_eq!(load(&experiment.0).unwrap_err(), "METADATA_CSV_NOT_FOUND");
        std::fs::create_dir(experiment.metadata_dir()).unwrap();
        std::fs::write(experiment.metadata_dir().join("settings.json"), "{}").unwrap();
        assert_eq!(load(&experiment.0).unwrap_err(), "METADATA_CSV_NOT_FOUND");
    }

    #[test]
    fn errors_when_multiple_csv_files_exist_without_samples_csv() {
        let experiment = TestExperiment::new();
        std::fs::create_dir(experiment.metadata_dir()).unwrap();
        std::fs::write(
            experiment.metadata_dir().join("first.csv"),
            "barcode,sample_id\n",
        )
        .unwrap();
        std::fs::write(
            experiment.metadata_dir().join("second.csv"),
            "barcode,sample_id\n",
        )
        .unwrap();

        assert_eq!(load(&experiment.0).unwrap_err(), "METADATA_CSV_AMBIGUOUS");
    }

    #[test]
    fn loads_real_experiment_with_sample_names_and_controls() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../test_data/nomadic/results/2025_07_28_new_dbs");
        let rows = load(&root).unwrap();
        assert_eq!(rows.len(), 48);
        assert_eq!(rows[0].sample_id, "3D7_100_N");
        assert_eq!(rows[0].sample_type, SampleType::Positive);
        assert_eq!(rows[0].n_primary, 7871);
        assert_eq!(rows[45].sample_id, "NTC_dbs");
        assert_eq!(rows[45].sample_type, SampleType::Negative);
        assert_eq!(rows[45].n_mapped, 0);
        assert_eq!(rows[46].n_mapped, 3);
        let json = serde_json::to_value(&rows[0]).unwrap();
        assert_eq!(json["sampleId"], "3D7_100_N");
        assert_eq!(json["sampleType"], "positive");
        assert_eq!(json["n_primary"], 7871);
    }

    #[test]
    fn joins_by_barcode_preserves_quoted_names_and_adds_missing_samples() {
        let frame = mapping("10,8,6,1,1,2,barcode02\n").unwrap();
        let metadata = metadata(
            "barcode,sample_id,sample_type\nbarcode02,\"Sample, two\",pos\nbarcode01,NTC,neg\n",
        );
        let rows = parse_mapping(&frame, &metadata).unwrap();
        assert_eq!(rows[0].barcode, "barcode01");
        assert_eq!(rows[0].n_total, 0);
        assert_eq!(rows[0].sample_type, SampleType::Negative);
        assert_eq!(rows[1].sample_id, "Sample, two");
        assert_eq!(rows[1].n_primary, 6);
    }

    #[test]
    fn barcodes_missing_from_metadata_use_barcode_as_name() {
        let frame = mapping("0,0,0,0,0,0,barcode01\n").unwrap();
        let metadata = metadata("barcode,sample_id\n");
        let rows = parse_mapping(&frame, &metadata).unwrap();
        assert_eq!(rows[0].sample_id, "barcode01");
        assert_eq!(rows[0].sample_type, SampleType::Sample);
    }

    #[test]
    fn header_only_mapping_keeps_metadata_samples() {
        let frame = mapping("").unwrap();
        let metadata = metadata("barcode,sample_id\nbarcode01,Waiting sample\n");
        let rows = parse_mapping(&frame, &metadata).unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].n_total, 0);
    }

    #[test]
    fn rejects_missing_negative_and_inconsistent_counts() {
        let metadata = metadata("barcode,sample_id\n");
        assert!(parse_mapping(&mapping("10,8,,1,1,2,barcode01\n").unwrap(), &metadata).is_err());
        assert!(mapping("10,8,-1,1,1,2,barcode01\n").is_err());
        assert!(parse_mapping(&mapping("10,8,8,1,1,2,barcode01\n").unwrap(), &metadata).is_err());
    }

    #[test]
    fn preserves_unclassified_counts_for_run_wide_summaries() {
        let frame =
            mapping("100,80,60,10,10,20,barcode01\n1000,200,150,30,20,800,unclassified\n").unwrap();
        let metadata = metadata("barcode,sample_id\n");
        let rows = parse_mapping(&frame, &metadata).unwrap();
        let unclassified = rows
            .iter()
            .find(|row| row.barcode == "unclassified")
            .unwrap();
        assert_eq!(unclassified.n_total, 1000);
        assert_eq!(unclassified.n_mapped, 200);
        assert_eq!(rows.iter().map(|row| row.n_total).sum::<u64>(), 1100);
    }

    #[test]
    fn rejects_duplicate_barcodes_in_either_file() {
        let frame = mapping("0,0,0,0,0,0,barcode01\n0,0,0,0,0,0,barcode01\n").unwrap();
        let empty_metadata = metadata("barcode,sample_id\n");
        assert!(parse_mapping(&frame, &empty_metadata).is_err());
        let metadata = metadata("barcode,sample_id\nbarcode01,A\nbarcode01,B\n");
        assert!(parse_metadata(&metadata).is_err());
    }
}
