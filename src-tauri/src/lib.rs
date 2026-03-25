pub mod actions;
pub mod commands;
pub mod input_listener;
pub mod lua_engine;
pub mod profiles;
pub mod settings;
pub mod tray;

use commands::AppState;
use input_listener::{HotkeyBinding, InputEvent, InputListener};
use settings::Settings;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};

pub fn run() {
    env_logger::init();

    let settings = Settings::default();
    let quick_tap_ms = settings.global.menu_activation.quick_tap_threshold_ms;

    // Build hotkey bindings from the default profile
    let bindings = build_bindings_from_settings(&settings);

    let app_state = AppState {
        settings: Mutex::new(settings),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::save_settings,
            commands::execute_slice_actions,
            commands::get_default_settings,
            commands::get_auto_launch_enabled,
            commands::set_auto_launch_enabled,
            commands::start_key_detection,
        ])
        .setup(move |app| {
            // Set up system tray
            tray::setup_tray(app.handle())?;

            // Hide main window close button → minimize to tray
            if let Some(main_window) = app.get_webview_window("main") {
                let main_window_clone = main_window.clone();
                main_window.on_window_event(move |event| {
                    if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        let _ = main_window_clone.hide();
                    }
                });
            }

            // Start input listener and bridge events to frontend
            let listener = Arc::new(InputListener::new(quick_tap_ms));
            listener.update_bindings(bindings.clone());

            let app_handle = app.handle().clone();
            let rx = listener.start();

            // Start profile monitor (polls active window and switches bindings)
            profiles::start_profile_monitor(app.handle().clone(), Arc::clone(&listener));

            std::thread::spawn(move || {
                bridge_input_events(rx, &app_handle);
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Build hotkey bindings from settings (default profile for now).
fn build_bindings_from_settings(settings: &Settings) -> Vec<HotkeyBinding> {
    let default_profile = settings
        .profiles
        .iter()
        .find(|p| p.is_default)
        .or_else(|| settings.profiles.first());

    let Some(profile) = default_profile else {
        return Vec::new();
    };

    profile
        .pie_keys
        .iter()
        .filter_map(|pk| {
            let hotkey = input_listener::parse_hotkey(&pk.hotkey).ok()?;
            Some(HotkeyBinding {
                menu_id: pk.menu_id.clone(),
                hotkey,
            })
        })
        .collect()
}

/// Bridge InputEvents from the rdev listener thread to Tauri frontend events.
fn bridge_input_events(
    rx: std::sync::mpsc::Receiver<InputEvent>,
    app_handle: &tauri::AppHandle,
) {
    while let Ok(event) = rx.recv() {
        match event {
            InputEvent::ShowMenu {
                menu_id,
                cursor_x,
                cursor_y,
            } => {
                // Look up menu config from settings
                let state = app_handle.state::<AppState>();
                let settings = state.settings.lock().unwrap();
                let menu = settings.get_menu_by_id(&menu_id);

                if let Some(menu) = menu {
                    let slices: Vec<serde_json::Value> = menu
                        .slices
                        .iter()
                        .map(|s| {
                            serde_json::json!({
                                "label": s.label,
                                "icon": s.icon,
                            })
                        })
                        .collect();

                    let actions: Vec<serde_json::Value> = menu
                        .slices
                        .iter()
                        .map(|s| serde_json::to_value(&s.actions).unwrap_or_default())
                        .collect();

                    let appearance = &settings.global.appearance;
                    let payload = serde_json::json!({
                        "menuId": menu_id,
                        "cursorX": cursor_x,
                        "cursorY": cursor_y,
                        "slices": slices,
                        "actions": actions,
                        "config": {
                            "innerRadius": appearance.inner_radius,
                            "outerRadius": appearance.outer_radius,
                            "deadZoneRadius": appearance.dead_zone_radius,
                            "backgroundColor": appearance.background_color,
                            "sliceFillColor": appearance.slice_fill_color,
                            "sliceHoverColor": appearance.slice_hover_color,
                            "sliceBorderColor": appearance.slice_border_color,
                            "sliceBorderWidth": appearance.slice_border_width,
                            "labelFont": appearance.label_font,
                            "labelSize": appearance.label_size,
                            "labelColor": appearance.label_color,
                            "iconSize": appearance.icon_size,
                            "opacity": appearance.opacity,
                        }
                    });

                    // Show overlay window
                    if let Some(overlay) = app_handle.get_webview_window("overlay") {
                        let _ = overlay.set_ignore_cursor_events(false);
                        let _ = overlay.show();
                        let _ = overlay.set_focus();
                    }

                    let _ = app_handle.emit("radialsan://show-menu", payload);
                }
            }
            InputEvent::HideMenu { selected } => {
                let _ = app_handle.emit(
                    "radialsan://hide-menu",
                    serde_json::json!({ "selected": selected }),
                );

                // Hide overlay window
                if let Some(overlay) = app_handle.get_webview_window("overlay") {
                    let _ = overlay.hide();
                    let _ = overlay.set_ignore_cursor_events(true);
                }
            }
            InputEvent::MouseMove { x, y } => {
                let _ = app_handle.emit(
                    "radialsan://mouse-move",
                    serde_json::json!({ "x": x, "y": y }),
                );
            }
        }
    }
}
