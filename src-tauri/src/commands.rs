use tauri::Manager;
use tauri::State;
use std::sync::Mutex;
use crate::settings::Settings;

pub struct AppState {
    pub settings: Mutex<Settings>,
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Settings {
    state.settings.lock().unwrap().clone()
}

#[tauri::command]
pub fn save_settings(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    settings: Settings,
) -> Result<(), String> {
    let mut current = state.settings.lock().map_err(|e| e.to_string())?;

    // Create backup before saving
    if let Ok(app_data_dir) = app_handle.path().app_data_dir() {
        let _ = Settings::backup(&app_data_dir); // Don't fail save if backup fails
    }

    *current = settings.clone();

    // Persist to disk
    let app_data_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    settings.save(&app_data_dir).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn execute_slice_actions(actions_json: Vec<serde_json::Value>) -> Result<(), String> {
    for action_val in &actions_json {
        let action_type = action_val
            .get("type")
            .and_then(|v| v.as_str())
            .ok_or("missing 'type' field in action")?;
        let params = action_val
            .get("params")
            .cloned()
            .unwrap_or(serde_json::Value::Null);

        crate::actions::execute_action(action_type, &params)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn get_default_settings() -> Result<String, String> {
    let settings = crate::settings::Settings::default();
    serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())
}

fn create_auto_launch() -> Result<auto_launch::AutoLaunch, String> {
    let app_name = "radialsan";
    let app_path = std::env::current_exe()
        .map_err(|e| e.to_string())?
        .to_string_lossy()
        .to_string();

    // macOS API takes an extra `use_launch_agent: bool` parameter
    #[cfg(target_os = "macos")]
    let auto = auto_launch::AutoLaunch::new(app_name, &app_path, true, &[] as &[&str]);
    #[cfg(not(target_os = "macos"))]
    let auto = auto_launch::AutoLaunch::new(app_name, &app_path, &[] as &[&str]);

    Ok(auto)
}

#[tauri::command]
pub fn get_auto_launch_enabled(_app_handle: tauri::AppHandle) -> Result<bool, String> {
    let auto = create_auto_launch()?;
    auto.is_enabled().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_auto_launch_enabled(_app_handle: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    let auto = create_auto_launch()?;
    if enabled {
        auto.enable().map_err(|e| e.to_string())
    } else {
        auto.disable().map_err(|e| e.to_string())
    }
}
