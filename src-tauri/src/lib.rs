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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![validate_workspace, list_experiments])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
