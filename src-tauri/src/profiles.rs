use crate::commands::AppState;
use crate::input_listener::{parse_hotkey, HotkeyBinding, InputListener};
use crate::settings::Settings;
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

/// Start the active window monitoring loop.
/// Polls the foreground window every 500ms, checks against profile match rules,
/// and updates hotkey bindings when the active profile changes.
pub fn start_profile_monitor(app_handle: AppHandle, listener: Arc<InputListener>) {
    std::thread::spawn(move || {
        let mut current_profile_id = String::new();

        loop {
            std::thread::sleep(Duration::from_millis(500));

            // Get active window info
            let (window_title, process_name) = get_active_window_info();

            // Get active profile from settings
            let state = app_handle.state::<AppState>();
            let settings = state.settings.lock().unwrap();
            let active_profile = settings.get_active_profile(&window_title, &process_name);

            if active_profile.id != current_profile_id {
                current_profile_id = active_profile.id.clone();

                // Build new bindings
                let bindings = build_bindings_for_profile(active_profile, &settings);

                // Update input listener
                listener.update_bindings(bindings);

                // Notify frontend
                let _ = app_handle.emit(
                    "radialsan://profile-changed",
                    serde_json::json!({
                        "profileId": current_profile_id,
                        "profileName": active_profile.name,
                    }),
                );

                log::info!(
                    "Profile switched to: {} ({})",
                    active_profile.name,
                    current_profile_id
                );
            }
        }
    });
}

/// Get the active window's title and process name.
fn get_active_window_info() -> (String, String) {
    match get_active_window_xwin() {
        Some((title, process)) => (title, process),
        None => (String::new(), String::new()),
    }
}

fn get_active_window_xwin() -> Option<(String, String)> {
    match x_win::get_active_window() {
        Ok(info) => Some((info.title, info.info.name)),
        Err(e) => {
            log::debug!("Failed to get active window: {}", e);
            None
        }
    }
}

/// Build hotkey bindings for a specific profile.
fn build_bindings_for_profile(
    profile: &crate::settings::Profile,
    _settings: &Settings,
) -> Vec<HotkeyBinding> {
    profile
        .pie_keys
        .iter()
        .filter_map(|pk| {
            let hotkey = parse_hotkey(&pk.hotkey).ok()?;
            Some(HotkeyBinding {
                menu_id: pk.menu_id.clone(),
                hotkey,
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_bindings_for_profile() {
        let profile = crate::settings::Profile {
            id: "test".to_string(),
            name: "Test".to_string(),
            is_default: false,
            match_rules: vec![],
            pie_keys: vec![crate::settings::PieKey {
                id: "pk1".to_string(),
                hotkey: "CapsLock".to_string(),
                menu_id: "menu_1".to_string(),
            }],
        };
        let settings = Settings::default();
        let bindings = build_bindings_for_profile(&profile, &settings);
        assert_eq!(bindings.len(), 1);
        assert_eq!(bindings[0].menu_id, "menu_1");
    }

    #[test]
    fn test_build_bindings_invalid_hotkey_skipped() {
        let profile = crate::settings::Profile {
            id: "test".to_string(),
            name: "Test".to_string(),
            is_default: false,
            match_rules: vec![],
            pie_keys: vec![
                crate::settings::PieKey {
                    id: "pk1".to_string(),
                    hotkey: "InvalidKey!!!".to_string(),
                    menu_id: "menu_1".to_string(),
                },
                crate::settings::PieKey {
                    id: "pk2".to_string(),
                    hotkey: "F5".to_string(),
                    menu_id: "menu_2".to_string(),
                },
            ],
        };
        let settings = Settings::default();
        let bindings = build_bindings_for_profile(&profile, &settings);
        // Invalid hotkey should be skipped, valid one included
        assert_eq!(bindings.len(), 1);
        assert_eq!(bindings[0].menu_id, "menu_2");
    }
}
