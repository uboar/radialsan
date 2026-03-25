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
pub fn save_settings(state: State<'_, AppState>, settings: Settings) {
    *state.settings.lock().unwrap() = settings;
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
