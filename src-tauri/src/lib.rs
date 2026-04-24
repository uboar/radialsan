pub mod actions;
pub mod commands;
pub mod input_listener;
pub mod lua_engine;
#[cfg(target_os = "macos")]
pub mod macos_input;
pub mod menu_selection;
pub mod profiles;
pub mod settings;
pub mod tray;

use commands::{AppState, RuntimeStatus};
use input_listener::{HotkeyBinding, InputEvent, InputListener};
use settings::Settings;
use std::path::Path;
use std::sync::{Arc, Mutex};
use tauri::{Emitter, Manager};

struct OverlayPlacement {
    position: tauri::LogicalPosition<f64>,
    size: tauri::LogicalSize<f64>,
    cursor_x: f64,
    cursor_y: f64,
}

fn overlay_placement_for_point(
    overlay: &tauri::WebviewWindow,
    cursor_x: f64,
    cursor_y: f64,
) -> Option<OverlayPlacement> {
    let monitor = overlay
        .monitor_from_point(cursor_x, cursor_y)
        .ok()
        .flatten()
        .or_else(|| overlay.current_monitor().ok().flatten())
        .or_else(|| overlay.primary_monitor().ok().flatten())?;

    let position = monitor.position();
    let size = monitor.size();
    let scale = monitor.scale_factor();

    Some(OverlayPlacement {
        position: tauri::LogicalPosition::new(position.x as f64 / scale, position.y as f64 / scale),
        size: tauri::LogicalSize::new(size.width as f64 / scale, size.height as f64 / scale),
        cursor_x: (cursor_x - position.x as f64) / scale,
        cursor_y: (cursor_y - position.y as f64) / scale,
    })
}

fn apply_overlay_placement(
    overlay: &tauri::WebviewWindow,
    placement: &OverlayPlacement,
) -> tauri::Result<()> {
    overlay.set_position(tauri::Position::Logical(placement.position))?;
    overlay.set_size(tauri::Size::Logical(placement.size))?;
    Ok(())
}

fn global_to_overlay_coordinates(
    overlay: &tauri::WebviewWindow,
    x: f64,
    y: f64,
) -> Option<(f64, f64)> {
    let monitor = overlay
        .current_monitor()
        .ok()
        .flatten()
        .or_else(|| overlay.monitor_from_point(x, y).ok().flatten())
        .or_else(|| overlay.primary_monitor().ok().flatten())?;

    let position = monitor.position();
    let scale = monitor.scale_factor();

    Some((
        (x - position.x as f64) / scale,
        (y - position.y as f64) / scale,
    ))
}

fn load_initial_settings(app_data_dir: &Path) -> Settings {
    match Settings::load(app_data_dir) {
        Ok(settings) => settings,
        Err(error) => {
            log::error!(
                "Failed to load settings from {}: {}",
                app_data_dir.display(),
                error
            );
            Settings::default()
        }
    }
}

pub fn run() {
    env_logger::init();

    let app_state = AppState {
        settings: Mutex::new(Settings::default()),
        runtime_status: Mutex::new(RuntimeStatus::default()),
        input_listener: Mutex::new(None),
        menu_selection: Mutex::new(None),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::get_runtime_status,
            commands::get_window_candidates,
            commands::save_settings,
            commands::execute_slice_actions,
            commands::set_active_menu_context,
            commands::get_default_settings,
            commands::get_auto_launch_enabled,
            commands::set_auto_launch_enabled,
            commands::start_key_detection,
        ])
        .setup(move |app| {
            let settings = match app.path().app_data_dir() {
                Ok(app_data_dir) => load_initial_settings(&app_data_dir),
                Err(error) => {
                    log::error!("Failed to resolve app data directory: {}", error);
                    Settings::default()
                }
            };

            {
                let state = app.state::<AppState>();
                *state.settings.lock().unwrap() = settings.clone();
            }

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

            // Size overlay window to cover the monitor containing the cursor.
            if let Some(overlay) = app.get_webview_window("overlay") {
                if let Ok(cursor) = app.handle().cursor_position() {
                    if let Some(placement) =
                        overlay_placement_for_point(&overlay, cursor.x, cursor.y)
                    {
                        let _ = apply_overlay_placement(&overlay, &placement);
                    }
                }

                let _ = overlay.set_ignore_cursor_events(true);

                #[cfg(target_os = "macos")]
                {
                    let _ = overlay.set_visible_on_all_workspaces(true);
                    let _ = overlay.set_focusable(false);
                }
            }

            // Start input listener and bridge events to frontend
            let quick_tap_ms = settings.global.menu_activation.quick_tap_threshold_ms;
            let suppress_trigger_key_input =
                settings.global.menu_activation.suppress_trigger_key_input;
            let bindings = build_bindings_from_settings(&settings);
            let listener = Arc::new(InputListener::new(quick_tap_ms, suppress_trigger_key_input));
            listener.update_bindings(bindings);

            {
                let state = app.state::<AppState>();
                *state.input_listener.lock().unwrap() = Some(Arc::clone(&listener));
            }

            match listener.start() {
                Ok(rx) => {
                    commands::clear_input_monitoring_issue(app.handle());

                    let app_handle = app.handle().clone();
                    std::thread::spawn(move || {
                        bridge_input_events(rx, &app_handle);
                    });
                }
                Err(e) => {
                    eprintln!("input listener error: {}", e);
                    commands::set_input_monitoring_unavailable(app.handle(), e);
                }
            }

            // Start profile monitor (polls active window and switches bindings)
            profiles::start_profile_monitor(app.handle().clone(), Arc::clone(&listener));

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
fn bridge_input_events(rx: std::sync::mpsc::Receiver<InputEvent>, app_handle: &tauri::AppHandle) {
    while let Ok(event) = rx.recv() {
        match event {
            InputEvent::ShowMenu {
                menu_id,
                cursor_x: event_cursor_x,
                cursor_y: event_cursor_y,
            } => {
                // Build the payload on this thread (while holding the lock briefly)
                let state = app_handle.state::<AppState>();
                let payload = {
                    let settings = state.settings.lock().unwrap();
                    let menu = settings.get_menu_by_id(&menu_id);
                    menu.map(|menu| {
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
                        let slice_count = menu.slices.len();
                        let dead_zone_radius = appearance.dead_zone_radius;
                        let payload = serde_json::json!({
                            "menuId": menu_id.clone(),
                            "cursorX": event_cursor_x,
                            "cursorY": event_cursor_y,
                            // Selection uses input-listener coordinates so raw movement deltas
                            // stay in one coordinate system across display scale factors.
                            "backendOriginX": event_cursor_x,
                            "backendOriginY": event_cursor_y,
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

                        (payload, slice_count, dead_zone_radius)
                    })
                };

                if let Some((payload, slice_count, dead_zone_radius)) = payload {
                    let cursor_position = app_handle
                        .cursor_position()
                        .map(|cursor| (cursor.x, cursor.y))
                        .unwrap_or((event_cursor_x, event_cursor_y));

                    // Window operations must run on the main thread on macOS
                    let ah = app_handle.clone();
                    let _ = app_handle.run_on_main_thread(move || {
                        let mut payload = payload;
                        if let Some(overlay) = ah.get_webview_window("overlay") {
                            if let Some(placement) = overlay_placement_for_point(
                                &overlay,
                                cursor_position.0,
                                cursor_position.1,
                            ) {
                                let _ = apply_overlay_placement(&overlay, &placement);
                                if let Some(object) = payload.as_object_mut() {
                                    object.insert(
                                        "cursorX".into(),
                                        serde_json::json!(placement.cursor_x),
                                    );
                                    object.insert(
                                        "cursorY".into(),
                                        serde_json::json!(placement.cursor_y),
                                    );
                                }
                            }

                            let _ = overlay.set_ignore_cursor_events(true);
                            let _ = overlay.show();
                        }
                        {
                            let state = ah.state::<AppState>();
                            let mut selection = state.menu_selection.lock().unwrap();
                            *selection = Some(crate::menu_selection::MenuSelectionContext::new(
                                menu_id,
                                event_cursor_x,
                                event_cursor_y,
                                slice_count,
                                dead_zone_radius,
                            ));
                        }
                        let _ = ah.emit("radialsan://show-menu", payload);
                    });
                }
            }
            InputEvent::HideMenu { selected } => {
                let selection_snapshot = {
                    let state = app_handle.state::<AppState>();
                    let mut selection = state.menu_selection.lock().unwrap();
                    let snapshot = selection.as_ref().map(|context| context.snapshot());
                    *selection = None;
                    snapshot
                };

                // Window operations must run on the main thread on macOS
                let ah = app_handle.clone();
                let _ = app_handle.run_on_main_thread(move || {
                    let mut payload = serde_json::json!({ "selected": selected });
                    if let Some(snapshot) = selection_snapshot {
                        if let Some(object) = payload.as_object_mut() {
                            object.insert("menuId".into(), serde_json::json!(snapshot.menu_id));
                            object.insert(
                                "selectedIndex".into(),
                                serde_json::json!(snapshot.selected_index),
                            );
                        }
                    }
                    let _ = ah.emit("radialsan://hide-menu", payload);
                    if let Some(overlay) = ah.get_webview_window("overlay") {
                        let _ = overlay.hide();
                    }
                });
            }
            InputEvent::MouseMove { x, y } => {
                let raw_x = x;
                let raw_y = y;
                // Use Tauri coordinates for drawing, but raw input coordinates for selection.
                let frontend_cursor = app_handle
                    .cursor_position()
                    .map(|cursor| (cursor.x, cursor.y))
                    .unwrap_or((raw_x, raw_y));
                let (overlay_x, overlay_y) = app_handle
                    .get_webview_window("overlay")
                    .and_then(|overlay| {
                        global_to_overlay_coordinates(
                            &overlay,
                            frontend_cursor.0,
                            frontend_cursor.1,
                        )
                    })
                    .unwrap_or(frontend_cursor);
                let selection_snapshot = {
                    let state = app_handle.state::<AppState>();
                    let mut selection = state.menu_selection.lock().unwrap();
                    selection.as_mut().map(|context| {
                        context.update_cursor(raw_x, raw_y);
                        context.snapshot()
                    })
                };
                let mut payload = serde_json::json!({
                    "x": overlay_x,
                    "y": overlay_y,
                    "rawX": raw_x,
                    "rawY": raw_y,
                });
                if let Some(snapshot) = selection_snapshot {
                    if let Some(object) = payload.as_object_mut() {
                        object.insert("menuId".into(), serde_json::json!(snapshot.menu_id));
                        object.insert(
                            "selectedIndex".into(),
                            serde_json::json!(snapshot.selected_index),
                        );
                    }
                }
                let _ = app_handle.emit("radialsan://mouse-move", payload);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    fn make_temp_dir(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("radialsan_{}_{}", name, uuid::Uuid::new_v4()))
    }

    #[test]
    fn test_load_initial_settings_uses_saved_settings() {
        let dir = make_temp_dir("load_saved_settings");
        fs::create_dir_all(&dir).unwrap();

        let mut settings = Settings::default();
        settings.global.theme = settings::AppTheme::Light;
        settings.global.menu_activation.quick_tap_threshold_ms = 350;
        settings.save(&dir).unwrap();

        let loaded = load_initial_settings(&dir);

        assert_eq!(loaded.global.theme, settings::AppTheme::Light);
        assert_eq!(loaded.global.menu_activation.quick_tap_threshold_ms, 350);

        fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn test_load_initial_settings_falls_back_to_default_on_invalid_json() {
        let dir = make_temp_dir("load_invalid_settings");
        fs::create_dir_all(&dir).unwrap();
        fs::write(dir.join("settings.json"), "{ invalid json").unwrap();

        let loaded = load_initial_settings(&dir);
        let default_settings = Settings::default();

        assert_eq!(loaded.global.theme, default_settings.global.theme);
        assert_eq!(
            loaded.global.menu_activation.quick_tap_threshold_ms,
            default_settings
                .global
                .menu_activation
                .quick_tap_threshold_ms
        );

        fs::remove_dir_all(&dir).unwrap();
    }
}
