
use std::process::Command;

#[tauri::command]
pub async fn open_dialog(title: String, filters: Vec<String>) -> Result<Option<String>, String> {
    let desktop = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default();

    if !desktop.to_uppercase().contains("KDE") {
        // TODO: Implement proper logging for bubblewrap launcher.
        eprintln!("[WARNING] The desktop environment '{}' is currently not supported for file selection dialog. Only KDE/Plasma is supported.", desktop);
        return Ok(None);
    }

    let filter_str = filters.join(" ");

    let args = vec![
        "--title",
        title.as_str(),
        "--getopenfilename",
        "~",
        filter_str.as_str(),
    ];

    let output = Command::new("kdialog")
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(Some(
            String::from_utf8_lossy(&output.stdout).trim().to_string(),
        ))
    } else {
        // The user cancelled the selection.
        Ok(None)
    }
}
