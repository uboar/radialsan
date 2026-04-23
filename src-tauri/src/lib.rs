pub mod actions;
pub mod commands;
pub mod input_listener;
pub mod lua_engine;
#[cfg(target_os = "macos")]
pub mod macos_input;
pub mod profiles;
pub mod settings;
pub mod tray;

use commands::{AppState, RuntimeStatus};
use input_listener::{HotkeyBinding, InputEvent, InputListener};
use settings::Settings;
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
        position: tauri::LogicalPosition::new(
            position.x as f64 / scale,
            position.y as f64 / scale,
        ),
        size: tauri::LogicalSize::new(
            size.width as f64 / scale,
            size.height as f64 / scale,
        ),
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

pub fn run() {
    env_logger::init();

    let settings = Settings::default();
    let quick_tap_ms = settings.global.menu_activation.quick_tap_threshold_ms;

    // Build hotkey bindings from the default profile
    let bindings = build_bindings_from_settings(&settings);

    let app_state = AppState {
        settings: Mutex::new(settings),
        runtime_status: Mutex::new(RuntimeStatus::default()),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::get_settings,
            commands::get_runtime_status,
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

            // Size overlay window to cover the monitor containing the cursor.
            if let Some(overlay) = app.get_webview_window("overlay") {
                if let Ok(cursor) = app.handle().cursor_position() {
                    if let Some(placement) = overlay_placement_for_point(&overlay, cursor.x, cursor.y) {
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
            let listener = Arc::new(InputListener::new(quick_tap_ms));
            listener.update_bindings(bindings.clone());

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
fn bridge_input_events(
    rx: std::sync::mpsc::Receiver<InputEvent>,
    app_handle: &tauri::AppHandle,
) {
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
                        serde_json::json!({
                            "menuId": menu_id,
                            "cursorX": event_cursor_x,
                            "cursorY": event_cursor_y,
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
                        })
                    })
                };

                if let Some(payload) = payload {
                    let cursor_position = app_handle
                        .cursor_position()
                        .map(|cursor| (cursor.x, cursor.y))
                        .unwrap_or((event_cursor_x, event_cursor_y));

                    // Window operations must run on the main thread on macOS
                    let ah = app_handle.clone();
                    let _ = app_handle.run_on_main_thread(move || {
                        let mut payload = payload;
                        if let Some(overlay) = ah.get_webview_window("overlay") {
                            if let Some(placement) =
                                overlay_placement_for_point(&overlay, cursor_position.0, cursor_position.1)
                            {
                                let _ = apply_overlay_placement(&overlay, &placement);
                                if let Some(object) = payload.as_object_mut() {
                                    object.insert("cursorX".into(), serde_json::json!(placement.cursor_x));
                                    object.insert("cursorY".into(), serde_json::json!(placement.cursor_y));
                                }
                            }

                            let _ = overlay.set_ignore_cursor_events(true);
                            let _ = overlay.show();
                        }
                        let _ = ah.emit("radialsan://show-menu", payload);
                    });
                }
            }
            InputEvent::HideMenu { selected } => {
                // Window operations must run on the main thread on macOS
                let ah = app_handle.clone();
                let _ = app_handle.run_on_main_thread(move || {
                    let _ = ah.emit(
                        "radialsan://hide-menu",
                        serde_json::json!({ "selected": selected }),
                    );
                    if let Some(overlay) = ah.get_webview_window("overlay") {
                        let _ = overlay.hide();
                    }
                });
            }
            InputEvent::MouseMove { x, y } => {
                let (x, y) = app_handle
                    .get_webview_window("overlay")
                    .and_then(|overlay| global_to_overlay_coordinates(&overlay, x, y))
                    .unwrap_or((x, y));
                let _ = app_handle.emit(
                    "radialsan://mouse-move",
                    serde_json::json!({ "x": x, "y": y }),
                );
            }
        }
    }
}
