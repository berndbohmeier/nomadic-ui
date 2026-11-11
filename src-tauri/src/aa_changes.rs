use polars::prelude::*;
use serde::Serialize;
use std::collections::HashSet;
use std::path::Path;
use std::sync::Arc;

const MAX_SAFE_INTEGER: u64 = 9_007_199_254_740_991;

#[derive(Debug, Serialize)]
pub struct AaChangeRow {
    barcode: String,
    gene: String,
    aa_change: String,
    aa_call: String,
    aa_depth: Option<u64>,
    aa_wsaf: Option<f64>,
}

fn options(legacy: bool) -> CsvReadOptions {
    let mut schema = Schema::default();
    for name in [
        "barcode",
        if legacy { "amplicon" } else { "gene" },
        "aa_change",
        if legacy { "gt" } else { "aa_call" },
    ] {
        schema.with_column(name.into(), DataType::String);
    }
    if legacy {
        schema.with_column("mut_type".into(), DataType::String);
    }
    schema.with_column(
        if legacy { "dp" } else { "aa_dp" }.into(),
        if legacy {
            DataType::String
        } else {
            DataType::UInt64
        },
    );
    schema.with_column(
        if legacy { "wsaf" } else { "aa_wsaf" }.into(),
        DataType::Float64,
    );
    let options = CsvReadOptions::default()
        .with_has_header(true)
        .with_schema_overwrite(Some(Arc::new(schema)));
    if legacy {
        options.map_parse_options(|parse| {
            parse.with_null_values(Some(NullValues::Named(vec![("wsaf".into(), ".".into())])))
        })
    } else {
        options
    }
}

fn legacy_call(value: &str, row: usize) -> Result<&'static str, String> {
    if value == "./." {
        return Ok("failed");
    }
    let (a, b) = value
        .split_once('/')
        .filter(|(a, b)| {
            !a.is_empty()
                && !b.is_empty()
                && a.bytes().all(|byte| byte.is_ascii_digit())
                && b.bytes().all(|byte| byte.is_ascii_digit())
        })
        .ok_or_else(|| format!("Invalid amino-acid call {value} on row {row}"))?;
    let a = a.trim_start_matches('0');
    let b = b.trim_start_matches('0');
    Ok(if a != b {
        "mixed"
    } else if a.is_empty() {
        "wt"
    } else {
        "mutant"
    })
}

fn legacy_depth(value: Option<&str>, row: usize) -> Result<Option<u64>, String> {
    let value = match value.map(str::trim) {
        None | Some("" | ".") => return Ok(None),
        Some(value) => value,
    };
    let (integer, fraction) = value.split_once('.').unwrap_or((value, ""));
    if integer.is_empty()
        || !integer.bytes().all(|byte| byte.is_ascii_digit())
        || !fraction.bytes().all(|byte| byte == b'0')
    {
        return Err(format!("Invalid amino-acid dp on row {row}: {value}"));
    }
    let depth = integer
        .parse::<u64>()
        .map_err(|_| format!("Invalid amino-acid dp on row {row}: {value}"))?;
    if depth > MAX_SAFE_INTEGER {
        return Err(format!(
            "Amino-acid depth exceeds supported range on row {row}"
        ));
    }
    Ok(Some(depth))
}

fn parse(frame: &DataFrame, legacy: bool) -> Result<Vec<AaChangeRow>, String> {
    let text = |name: &str| {
        frame
            .column(name)
            .and_then(|column| column.str())
            .map_err(|error| format!("Invalid amino-acid {name} column: {error}"))
    };
    let barcode = text("barcode")?;
    let gene = text(if legacy { "amplicon" } else { "gene" })?;
    let change = text("aa_change")?;
    let call = text(if legacy { "gt" } else { "aa_call" })?;
    let mutation_type = if legacy {
        Some(text("mut_type")?)
    } else {
        None
    };
    let depth_name = if legacy { "dp" } else { "aa_dp" };
    let wsaf_name = if legacy { "wsaf" } else { "aa_wsaf" };
    let depth = frame
        .column(depth_name)
        .map_err(|error| format!("Invalid amino-acid {depth_name} column: {error}"))?;
    let legacy_depths = if legacy {
        Some(
            depth
                .str()
                .map_err(|error| format!("Invalid amino-acid dp column: {error}"))?,
        )
    } else {
        None
    };
    let current_depths = if legacy {
        None
    } else {
        Some(
            depth
                .u64()
                .map_err(|error| format!("Invalid amino-acid aa_dp column: {error}"))?,
        )
    };
    let wsaf = frame
        .column(wsaf_name)
        .and_then(|column| column.f64())
        .map_err(|error| format!("Invalid amino-acid {wsaf_name} column: {error}"))?;
    let required = |column: &StringChunked, index: usize, name: &str| -> Result<String, String> {
        column
            .get(index)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(str::to_owned)
            .ok_or_else(|| format!("Missing amino-acid {name} on row {}", index + 2))
    };
    let mut seen = HashSet::new();
    let mut rows = Vec::new();
    for index in 0..frame.height() {
        if mutation_type.is_some_and(|column| {
            !column
                .get(index)
                .is_some_and(|value| value.contains("missense"))
        }) {
            continue;
        }
        let barcode = required(barcode, index, "barcode")?;
        if barcode.eq_ignore_ascii_case("unclassified") {
            continue;
        }
        if legacy
            && change
                .get(index)
                .is_none_or(|value| value.trim().is_empty() || value.trim() == ".")
        {
            continue;
        }
        let gene_source = required(gene, index, if legacy { "amplicon" } else { "gene" })?;
        let gene = if legacy {
            gene_source
                .split('-')
                .next()
                .unwrap_or_default()
                .trim()
                .to_owned()
        } else {
            gene_source
        };
        if gene.is_empty() || gene == "." {
            return Err(format!("Missing amino-acid gene on row {}", index + 2));
        }
        let aa_change = required(change, index, "aa_change")?;
        if !seen.insert((barcode.clone(), gene.clone(), aa_change.clone())) {
            return Err(format!(
                "Duplicate amino-acid call for {barcode}, {gene}, {aa_change}"
            ));
        }
        let raw_call = required(call, index, if legacy { "gt" } else { "aa_call" })?;
        let aa_call = if legacy {
            legacy_call(&raw_call, index + 2)?
        } else {
            match raw_call.as_str() {
                "wt" | "failed" | "mixed" | "mutant" | "absent" | "unphased" => raw_call.as_str(),
                _ => {
                    return Err(format!(
                        "Invalid amino-acid call {raw_call} on row {}",
                        index + 2
                    ))
                }
            }
        }
        .to_owned();
        let aa_depth = match (legacy_depths, current_depths) {
            (Some(column), _) => legacy_depth(column.get(index), index + 2)?,
            (_, Some(column)) => column.get(index),
            _ => unreachable!("one depth column is always selected"),
        };
        if aa_depth.is_some_and(|value| value > MAX_SAFE_INTEGER) {
            return Err(format!(
                "Amino-acid depth exceeds supported range on row {}",
                index + 2
            ));
        }
        let mut aa_wsaf = wsaf.get(index);
        // Temporary workaround for a processing-pipeline bug that can produce WSAF above 1.
        if aa_wsaf.is_some_and(|value| value.is_finite() && value > 1.0) {
            aa_wsaf = Some(1.0);
        }
        if aa_wsaf.is_some_and(|value| !value.is_finite() || value < 0.0 || value > 1.0) {
            return Err(format!("Invalid amino-acid WSAF on row {}", index + 2));
        }
        rows.push(AaChangeRow {
            barcode,
            gene,
            aa_change,
            aa_call,
            aa_depth,
            aa_wsaf,
        });
    }
    Ok(rows)
}

pub fn load(root: &Path, file: &str) -> Result<Vec<AaChangeRow>, String> {
    let legacy = match file {
        "summary.aa_changes.csv" => false,
        "summary.variants.csv" => true,
        _ => return Err(format!("Unsupported amino-acid file: {file}")),
    };
    let path = root.join(file);
    let frame = options(legacy)
        .try_into_reader_with_file_path(Some(path.clone()))
        .and_then(|reader| reader.finish())
        .map_err(|error| format!("Could not read {}: {error}", path.display()))?;
    parse(&frame, legacy)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;

    fn frame(csv: &str, legacy: bool) -> DataFrame {
        options(legacy)
            .into_reader_with_file_handle(Cursor::new(csv.as_bytes().to_vec()))
            .finish()
            .unwrap()
    }

    #[test]
    fn loads_current_experiment() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../test_data/nomadic/results/2025_07_28_new_dbs");
        let rows = load(&root, "summary.aa_changes.csv").unwrap();
        assert_eq!(rows.len(), 3936);
        assert_eq!(rows[0].aa_call, "wt");
        assert_eq!(rows[0].aa_depth, Some(390));
        assert_eq!(rows[0].aa_wsaf, Some(0.0));
        assert!(rows
            .iter()
            .any(|row| row.aa_call == "failed" && row.aa_depth.is_none()));
    }

    #[test]
    fn loads_legacy_file_and_normalizes_all_genotypes() {
        let root = std::env::temp_dir().join(format!("nomadic-aa-legacy-{}", std::process::id()));
        std::fs::create_dir(&root).unwrap();
        let path = root.join("summary.variants.csv");
        std::fs::write(&path, "barcode,amplicon,aa_change,gt,dp,wsaf,mut_type\nbarcode01,g-p1-20,A1T,0/0,0,0,missense\nbarcode01,g-p1-20,A2T,./.,.,.,missense\nbarcode01,g-p1-20,A3T,0/1,20.0,0.5,missense\nbarcode01,g-p1-20,A4T,1/1,30,1,missense\nbarcode02,g-p1-20,A5T,./.,,,missense\nbarcode02,g-p1-20,A6T,2/2,1,1,missense\nbarcode02,g-p1-20,A7T,0/2,1,0.5,missense\nbarcode02,g-p1-20,,0/0,1,0,missense\n").unwrap();
        let rows = load(&root, "summary.variants.csv").unwrap();
        assert_eq!(
            rows.iter()
                .map(|row| row.aa_call.as_str())
                .collect::<Vec<_>>(),
            vec!["wt", "failed", "mixed", "mutant", "failed", "mutant", "mixed"]
        );
        assert!(rows.iter().all(|row| row.gene == "g"));
        assert_eq!((rows[0].aa_depth, rows[0].aa_wsaf), (Some(0), Some(0.0)));
        assert_eq!((rows[1].aa_depth, rows[1].aa_wsaf), (None, None));
        assert_eq!((rows[2].aa_depth, rows[2].aa_wsaf), (Some(20), Some(0.5)));
        assert_eq!(rows[4].aa_depth, None);
        assert_eq!(rows[4].aa_wsaf, None);
        let json = serde_json::to_value(&rows[1]).unwrap();
        assert!(json["aa_wsaf"].is_null());
        std::fs::remove_file(path).unwrap();
        std::fs::remove_dir(root).unwrap();
    }

    #[test]
    fn validates_legacy_depth_without_float_rounding() {
        for (input, expected) in [
            ("0", Some(0)),
            ("0.0", Some(0)),
            ("1.000", Some(1)),
            ("9007199254740991.0", Some(MAX_SAFE_INTEGER)),
            (".", None),
            ("", None),
        ] {
            assert_eq!(legacy_depth(Some(input), 2).unwrap(), expected);
        }
        for input in [
            "-1",
            "1.5",
            "1.0000000000000001",
            "NaN",
            "inf",
            "abc",
            "9007199254740992",
            "18446744073709551616",
            "1.0.0",
        ] {
            assert!(legacy_depth(Some(input), 3).is_err(), "{input}");
        }
        let header = "barcode,amplicon,aa_change,gt,dp,wsaf,mut_type\n";
        for value in ["-1", "1.5", "1.0000000000000001", "9007199254740992"] {
            let csv = format!("{header}barcode01,g,A1T,0/0,{value},0,missense\n");
            let error = parse(&frame(&csv, true), true).unwrap_err();
            assert!(error.contains("row 2"), "{error}");
        }
    }

    #[test]
    fn rejects_invalid_and_duplicate_calls() {
        let header = "barcode,gene,aa_change,aa_call,aa_dp,aa_wsaf\n";
        for rows in [
            "barcode01,g,A1T,unknown,1,0\n",
            "barcode01,g,A1T,wt,1,0\nbarcode01,g,A1T,wt,1,0\n",
        ] {
            assert!(parse(&frame(&format!("{header}{rows}"), false), false).is_err());
        }
        for value in ["1", "1/", "/1", "./1", "1/.", "1|1", "-1/0", "1/2/3"] {
            assert!(legacy_call(value, 2).is_err(), "{value}");
        }
        for (value, status) in [
            ("0/0", "wt"),
            ("00/0", "wt"),
            ("./.", "failed"),
            ("1/0", "mixed"),
            ("2/0", "mixed"),
            ("1/2", "mixed"),
            ("2/2", "mutant"),
            ("3/3", "mutant"),
        ] {
            assert_eq!(legacy_call(value, 2).unwrap(), status);
        }
        let invalid_gene = frame(
            "barcode,amplicon,aa_change,gt,dp,wsaf,mut_type\nbarcode01,-amp,A1T,0/0,1,0,missense\n",
            true,
        );
        assert!(parse(&invalid_gene, true).is_err());
        for value in ["-0.1", "NaN", "inf"] {
            let csv =
                format!("barcode,amplicon,aa_change,gt,dp,wsaf,mut_type\nbarcode01,g,A1T,0/0,1,{value},missense\n");
            assert!(parse(&frame(&csv, true), true).is_err(), "{value}");
        }
        let missing = frame(
            "barcode,gene,aa_change,aa_call,aa_dp\nbarcode01,g,A1T,wt,1\n",
            false,
        );
        assert!(parse(&missing, false).is_err());
        let rows = parse(
            &frame(&format!("{header}Unclassified,g,A1T,wt,1,0\n"), false),
            false,
        )
        .unwrap();
        assert!(rows.is_empty());
        assert!(load(Path::new("."), "../summary.aa_changes.csv").is_err());
    }

    #[test]
    fn clamps_wsaf_above_one_to_one() {
        let current = frame(
            "barcode,gene,aa_change,aa_call,aa_dp,aa_wsaf\nbarcode01,g,A1T,wt,1,1.1\n",
            false,
        );
        assert_eq!(parse(&current, false).unwrap()[0].aa_wsaf, Some(1.0));

        let legacy = frame(
            "barcode,amplicon,aa_change,gt,dp,wsaf,mut_type\nbarcode01,g,A1T,0/0,1,1.1,missense\n",
            true,
        );
        assert_eq!(parse(&legacy, true).unwrap()[0].aa_wsaf, Some(1.0));

        for (csv, legacy) in [
            (
                "barcode,gene,aa_change,aa_call,aa_dp,aa_wsaf\nbarcode01,g,A1T,wt,1,-0.1\n",
                false,
            ),
            (
                "barcode,amplicon,aa_change,gt,dp,wsaf,mut_type\nbarcode01,g,A1T,0/0,1,-0.1,missense\n",
                true,
            ),
        ] {
            assert!(parse(&frame(csv, legacy), legacy).is_err());
        }
    }

    #[test]
    fn legacy_keeps_only_missense_mutation_types() {
        let csv = "barcode,amplicon,aa_change,gt,dp,wsaf,mut_type\n\
barcode01,g-a,A1T,0/0,1,0,missense\n\
barcode01,g-a,A2T,0/1,2,0.5,missense;splice_region\n\
barcode01,g-a,A3T,invalid,invalid,0,synonymous\n\
barcode01,g-a,A4T,0/0,1,0,intron\n\
barcode01,g-a,A5T,0/0,1,0,.\n\
barcode01,g-a,A6T,0/0,1,0,\n\
barcode01,g-a,A1T,0/0,1,0,synonymous\n";
        let rows = parse(&frame(csv, true), true).unwrap();
        assert_eq!(
            rows.iter()
                .map(|row| row.aa_change.as_str())
                .collect::<Vec<_>>(),
            vec!["A1T", "A2T"]
        );

        let missing_column = frame(
            "barcode,amplicon,aa_change,gt,dp,wsaf\nbarcode01,g-a,A1T,0/0,1,0\n",
            true,
        );
        assert!(parse(&missing_column, true)
            .unwrap_err()
            .contains("mut_type"));

        let invalid_missense = frame(
            "barcode,amplicon,aa_change,gt,dp,wsaf,mut_type\nbarcode01,g-a,A1T,invalid,1,0,missense\n",
            true,
        );
        assert!(parse(&invalid_missense, true).is_err());
    }

    #[test]
    fn current_format_does_not_filter_mutation_type() {
        let csv = "barcode,gene,aa_change,aa_call,aa_dp,aa_wsaf,mut_type\n\
barcode01,g,A1T,wt,1,0,synonymous\n\
barcode01,g,A2T,mutant,1,1,\n";
        assert_eq!(parse(&frame(csv, false), false).unwrap().len(), 2);
    }
}
