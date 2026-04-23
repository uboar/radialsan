use crate::input_listener;
use crate::input_listener::InputListener;
use crate::menu_selection::MenuSelectionContext;
use crate::settings::Settings;
use serde::Serialize;
use std::sync::{Arc, Mutex};
use tauri::Emitter;
use tauri::Manager;
use tauri::State;

pub struct AppState {
    pub settings: Mutex<Settings>,
    pub runtime_status: Mutex<RuntimeStatus>,
    pub input_listener: Mutex<Option<Arc<InputListener>>>,
    pub menu_selection: Mutex<Option<MenuSelectionContext>>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStatus {
    pub input_monitoring_available: bool,
    pub active_window_monitoring_available: bool,
    pub input_monitoring_detail: Option<String>,
    pub active_window_monitoring_detail: Option<String>,
}

impl Default for RuntimeStatus {
    fn default() -> Self {
        Self {
            input_monitoring_available: true,
            active_window_monitoring_available: true,
            input_monitoring_detail: None,
            active_window_monitoring_detail: None,
        }
    }
}

fn update_runtime_status<F>(app_handle: &tauri::AppHandle, update: F)
where
    F: FnOnce(&mut RuntimeStatus),
{
    let state = app_handle.state::<AppState>();
    let mut status = state.runtime_status.lock().unwrap();
    let previous = status.clone();
    update(&mut status);

    if *status != previous {
        let snapshot = status.clone();
        drop(status);
        let _ = app_handle.emit("radialsan://runtime-status", snapshot);
    }
}

pub fn set_input_monitoring_unavailable(app_handle: &tauri::AppHandle, detail: impl Into<String>) {
    let detail = detail.into();
    update_runtime_status(app_handle, move |status| {
        status.input_monitoring_available = false;
        status.input_monitoring_detail = Some(detail);
    });
}

pub fn clear_input_monitoring_issue(app_handle: &tauri::AppHandle) {
    update_runtime_status(app_handle, |status| {
        status.input_monitoring_available = true;
        status.input_monitoring_detail = None;
    });
}

pub fn set_active_window_monitoring_unavailable(
    app_handle: &tauri::AppHandle,
    detail: impl Into<String>,
) {
    let detail = detail.into();
    update_runtime_status(app_handle, move |status| {
        status.active_window_monitoring_available = false;
        status.active_window_monitoring_detail = Some(detail);
    });
}

pub fn clear_active_window_monitoring_issue(app_handle: &tauri::AppHandle) {
    update_runtime_status(app_handle, |status| {
        status.active_window_monitoring_available = true;
        status.active_window_monitoring_detail = None;
    });
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppState>) -> Settings {
    state.settings.lock().unwrap().clone()
}

#[tauri::command]
pub fn get_runtime_status(state: State<'_, AppState>) -> RuntimeStatus {
    state.runtime_status.lock().unwrap().clone()
}

#[tauri::command]
pub fn save_settings(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    settings: Settings,
) -> Result<(), String> {
    // Create backup before saving
    if let Ok(app_data_dir) = app_handle.path().app_data_dir() {
        let _ = Settings::backup(&app_data_dir); // Don't fail save if backup fails
    }

    // Persist to disk
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    settings.save(&app_data_dir).map_err(|e| e.to_string())?;

    {
        let mut current = state.settings.lock().map_err(|e| e.to_string())?;
        *current = settings.clone();
    }

    let listener = {
        let input_listener = state.input_listener.lock().map_err(|e| e.to_string())?;
        input_listener.as_ref().cloned()
    };

    if let Some(listener) = listener {
        let active_profile =
            crate::profiles::get_active_profile_for_current_window(&app_handle, &settings);
        let bindings = crate::profiles::build_bindings_for_profile(active_profile);
        listener.update_runtime_settings(
            bindings,
            settings.global.menu_activation.quick_tap_threshold_ms,
        );
    }

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

        crate::actions::execute_action(action_type, &params).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn set_active_menu_context(
    state: State<'_, AppState>,
    menu_id: String,
    origin_x: f64,
    origin_y: f64,
    slice_count: usize,
    dead_zone_radius: f64,
) -> Result<(), String> {
    let mut selection = state.menu_selection.lock().map_err(|e| e.to_string())?;
    *selection = Some(MenuSelectionContext::new(
        menu_id,
        origin_x,
        origin_y,
        slice_count,
        dead_zone_radius,
    ));
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

#[tauri::command]
pub fn start_key_detection(app_handle: tauri::AppHandle) -> Result<(), String> {
    input_listener::detect_next_key(app_handle);
    Ok(())
}
