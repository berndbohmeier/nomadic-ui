mod metadata;
mod read_mapping;
mod region_coverage;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct WorkspaceInfo {
    valid: bool,
    has_metadata: bool,
    has_beds: bool,
}

#[tauri::command]
fn validate_workspace(path: String) -> WorkspaceInfo {
    let root = std::path::Path::new(&path);
    WorkspaceInfo {
        valid: root.join("results").is_dir(),
        has_metadata: root.join("metadata").is_dir(),
        has_beds: root.join("beds").is_dir(),
    }
}

#[tauri::command]
fn list_experiments(path: String) -> Result<Vec<String>, String> {
    let results = std::path::Path::new(&path).join("results");
    let mut names = Vec::new();
    for entry in std::fs::read_dir(&results).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.path().is_dir() {
            names.push(entry.file_name().to_string_lossy().into_owned());
        }
    }
    names.sort();
    Ok(names)
}

#[derive(serde::Deserialize, serde::Serialize, Default)]
#[serde(rename_all = "camelCase", default)]
struct ExperimentSettings {
    #[serde(alias = "start_date")]
    start_date: Option<String>,
    caller: Option<String>,
    #[serde(alias = "fastq_dir")]
    fastq_dir: Option<String>,
    #[serde(alias = "metadata_csv")]
    metadata_csv: Option<String>,
    #[serde(alias = "region_bed")]
    region_bed: Option<String>,
    #[serde(alias = "reference_name")]
    reference_name: Option<String>,
    #[serde(alias = "n_barcodes")]
    n_barcodes: Option<u32>,
    #[serde(alias = "n_regions")]
    n_regions: Option<u32>,
    #[serde(alias = "minknow_dir")]
    minknow_dir: Option<String>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ExperimentInfo {
    path: String,
    name: String,
    settings: Option<ExperimentSettings>,
    files: Vec<String>,
}

fn read_experiment(root: &std::path::Path) -> Result<ExperimentInfo, String> {
    if !root.is_dir() {
        return Err(format!("Not a directory: {}", root.display()));
    }
    let mut files = Vec::new();
    for entry in std::fs::read_dir(root).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if entry.path().is_file() {
            files.push(entry.file_name().to_string_lossy().into_owned());
        }
    }
    files.sort();

    let settings_path = root.join("metadata").join("settings.json");
    let settings = if settings_path.is_file() {
        let text = std::fs::read_to_string(&settings_path).map_err(|e| e.to_string())?;
        Some(serde_json::from_str(&text).map_err(|e| format!("Invalid settings.json: {e}"))?)
    } else {
        None
    };

    Ok(ExperimentInfo {
        path: root.to_string_lossy().into_owned(),
        name: root
            .file_name()
            .map(|n| n.to_string_lossy().into_owned())
            .unwrap_or_default(),
        settings,
        files,
    })
}

#[tauri::command]
fn load_experiment(path: String) -> Result<ExperimentInfo, String> {
    read_experiment(std::path::Path::new(&path))
}

#[tauri::command]
async fn load_read_mapping(path: String) -> Result<Vec<read_mapping::ReadMappingCounts>, String> {
    tauri::async_runtime::spawn_blocking(move || read_mapping::load(std::path::Path::new(&path)))
        .await
        .map_err(|error| format!("Read mapping task failed: {error}"))?
}

#[tauri::command]
async fn load_region_coverage(
    path: String,
) -> Result<Vec<region_coverage::RegionCoverageRow>, String> {
    tauri::async_runtime::spawn_blocking(move || region_coverage::load(std::path::Path::new(&path)))
        .await
        .map_err(|error| format!("Region coverage task failed: {error}"))?
}

#[tauri::command]
async fn load_metadata(path: String) -> Result<Vec<metadata::BarcodeMetadata>, String> {
    tauri::async_runtime::spawn_blocking(move || metadata::load(std::path::Path::new(&path)))
        .await
        .map_err(|error| format!("Metadata task failed: {error}"))?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn loads_test_experiment() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../test_data/nomadic/results/2025_07_28_new_dbs");
        let info = read_experiment(&root).unwrap();
        assert_eq!(info.name, "2025_07_28_new_dbs");
        assert!(info.files.contains(&"summary.read_mapping.csv".to_string()));
        let settings = info.settings.unwrap();
        assert_eq!(settings.n_barcodes, Some(48));
        assert_eq!(settings.reference_name.as_deref(), Some("Pf3D7"));
    }

    #[test]
    fn read_mapping_command_loads_test_experiment() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../test_data/nomadic/results/2025_07_28_new_dbs");
        let rows =
            tauri::async_runtime::block_on(load_read_mapping(root.to_string_lossy().into_owned()))
                .unwrap();
        assert_eq!(rows.len(), 48);
        assert_eq!(serde_json::to_value(&rows[0]).unwrap()["n_primary"], 7871);
    }

    #[test]
    fn metadata_command_loads_test_experiment() {
        let root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../test_data/nomadic/results/2025_07_28_new_dbs");
        let rows =
            tauri::async_runtime::block_on(load_metadata(root.to_string_lossy().into_owned()))
                .unwrap();
        assert_eq!(rows.len(), 48);
        assert_eq!(
            serde_json::to_value(&rows[0]).unwrap()["sampleId"],
            "3D7_100_N"
        );
    }

    #[test]
    fn rejects_missing_dir() {
        assert!(read_experiment(std::path::Path::new("/definitely/not/here")).is_err());
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            validate_workspace,
            list_experiments,
            load_experiment,
            load_read_mapping,
            load_region_coverage,
            load_metadata
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
