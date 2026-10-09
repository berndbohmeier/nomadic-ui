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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![validate_workspace])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
