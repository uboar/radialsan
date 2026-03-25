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
