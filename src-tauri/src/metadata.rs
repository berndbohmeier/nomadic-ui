use polars::prelude::*;
use serde::Serialize;
use std::collections::HashSet;
use std::path::{Path, PathBuf};

#[derive(Clone, Copy, Debug, Default, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum SampleType {
    #[default]
    Sample,
    Positive,
    Negative,
}

#[derive(Debug, Serialize)]
pub struct BarcodeMetadata {
    pub barcode: String,
    /// Empty when the metadata has no sample id for this barcode.
    #[serde(rename = "sampleId")]
    pub sample_id: String,
    #[serde(rename = "sampleType")]
    pub sample_type: SampleType,
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

/// Rows keep the order of the metadata file.
fn parse_metadata(frame: &DataFrame) -> Result<Vec<BarcodeMetadata>, String> {
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

    let mut seen = HashSet::new();
    let mut samples = Vec::with_capacity(frame.height());
    for index in 0..frame.height() {
        let barcode = barcodes
            .get(index)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .ok_or_else(|| format!("Missing metadata barcode on row {}", index + 2))?;
        if !seen.insert(barcode.to_owned()) {
            return Err(format!("Duplicate metadata barcode: {barcode}"));
        }
        let sample_id = ids
            .and_then(|column| column.get(index))
            .map(str::trim)
            .unwrap_or_default()
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
        samples.push(BarcodeMetadata {
            barcode: barcode.to_owned(),
            sample_id,
            sample_type,
        });
    }
    Ok(samples)
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

pub fn load(root: &Path) -> Result<Vec<BarcodeMetadata>, String> {
    let path = find_metadata_path(root)?;
    parse_metadata(&read_sample_metadata(&path)?)
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
            Self(root)
        }

        fn metadata_dir(&self) -> PathBuf {
            self.0.join("metadata")
        }

        fn write(&self, name: &str, content: &str) {
            std::fs::create_dir_all(self.metadata_dir()).unwrap();
            std::fs::write(self.metadata_dir().join(name), content).unwrap();
        }
    }

    impl Drop for TestExperiment {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.0);
        }
    }

    fn frame(rows: &str) -> DataFrame {
        metadata_options()
            .into_reader_with_file_handle(Cursor::new(rows.as_bytes()))
            .finish()
            .unwrap()
    }

    #[test]
    fn prefers_samples_csv_even_with_other_csv_files() {
        let experiment = TestExperiment::new();
        experiment.write("samples.csv", "barcode,sample_id\nbarcode01,Preferred\n");
        experiment.write("other.csv", "not,metadata\n");

        let rows = load(&experiment.0).unwrap();
        assert_eq!(rows[0].sample_id, "Preferred");
    }

    #[test]
    fn loads_the_only_csv_and_ignores_non_files_and_other_extensions() {
        let experiment = TestExperiment::new();
        experiment.write("custom.csv", "barcode,sample_id\nbarcode01,Fallback\n");
        experiment.write("settings.json", "{}");
        experiment.write("other.CSV", "not,metadata\n");
        std::fs::create_dir(experiment.metadata_dir().join("folder.csv")).unwrap();

        let rows = load(&experiment.0).unwrap();
        assert_eq!(rows[0].sample_id, "Fallback");
    }

    #[test]
    fn loads_semicolon_delimited_sample_metadata_in_file_order() {
        let experiment = TestExperiment::new();
        std::fs::create_dir(experiment.metadata_dir()).unwrap();
        let source = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../test_data/nomadic/metadata/2025_07_28_new_dbs.csv");
        std::fs::copy(source, experiment.metadata_dir().join("sample-info.csv")).unwrap();

        let rows = load(&experiment.0).unwrap();
        assert_eq!(rows.len(), 48);
        assert_eq!(rows[0].barcode, "barcode01");
        assert_eq!(rows[0].sample_id, "3D7_100_N");
        assert_eq!(rows[0].sample_type, SampleType::Positive);
        assert_eq!(rows[45].sample_type, SampleType::Negative);
    }

    #[test]
    fn handles_quoted_commas_in_semicolon_delimited_metadata() {
        let experiment = TestExperiment::new();
        experiment.write(
            "samples.csv",
            "sample_id;barcode;sample_type;notes\n\"Sample, one\";barcode01;positive_control;\"batch, one\"\n",
        );

        let rows = load(&experiment.0).unwrap();
        assert_eq!(rows[0].sample_id, "Sample, one");
        assert_eq!(rows[0].sample_type, SampleType::Positive);
    }

    #[test]
    fn handles_quoted_semicolons_in_comma_delimited_metadata() {
        let experiment = TestExperiment::new();
        experiment.write(
            "samples.csv",
            "sample_id,barcode,sample_type,notes\n\"Sample; one\",barcode01,negative_control,\"batch; one\"\n",
        );

        let rows = load(&experiment.0).unwrap();
        assert_eq!(rows[0].sample_id, "Sample; one");
        assert_eq!(rows[0].sample_type, SampleType::Negative);
    }

    #[test]
    fn reports_metadata_path_when_barcode_column_is_missing() {
        let experiment = TestExperiment::new();
        experiment.write("samples.csv", "sample_id;well\nSample;A1\n");

        let error = load(&experiment.0).unwrap_err();
        assert!(error.contains("Missing barcode column"));
        assert!(error.contains("samples.csv"));
    }

    #[test]
    fn errors_when_metadata_folder_or_csv_is_missing() {
        let experiment = TestExperiment::new();
        assert_eq!(load(&experiment.0).unwrap_err(), "METADATA_CSV_NOT_FOUND");
        experiment.write("settings.json", "{}");
        assert_eq!(load(&experiment.0).unwrap_err(), "METADATA_CSV_NOT_FOUND");
    }

    #[test]
    fn errors_when_multiple_csv_files_exist_without_samples_csv() {
        let experiment = TestExperiment::new();
        experiment.write("first.csv", "barcode,sample_id\n");
        experiment.write("second.csv", "barcode,sample_id\n");

        assert_eq!(load(&experiment.0).unwrap_err(), "METADATA_CSV_AMBIGUOUS");
    }

    #[test]
    fn allows_empty_or_missing_sample_ids_but_requires_barcodes() {
        let rows = parse_metadata(&frame("barcode,sample_id\nbarcode02,\nbarcode01,A\n")).unwrap();
        assert_eq!(rows[0].barcode, "barcode02");
        assert_eq!(rows[0].sample_id, "");
        assert_eq!(rows[1].sample_id, "A");

        let rows = parse_metadata(&frame("barcode\nbarcode01\n")).unwrap();
        assert_eq!(rows[0].sample_id, "");

        assert!(parse_metadata(&frame("barcode,sample_id\n,A\n")).is_err());
    }

    #[test]
    fn rejects_duplicate_barcodes() {
        let metadata = frame("barcode,sample_id\nbarcode01,A\nbarcode01,B\n");
        assert!(parse_metadata(&metadata).is_err());
    }

    #[test]
    fn serializes_camel_case_fields() {
        let rows =
            parse_metadata(&frame("barcode,sample_id,sample_type\nbarcode01,A,pos\n")).unwrap();
        let json = serde_json::to_value(&rows[0]).unwrap();
        assert_eq!(json["sampleId"], "A");
        assert_eq!(json["sampleType"], "positive");
    }
}
