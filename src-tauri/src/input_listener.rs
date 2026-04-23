use rdev::EventType;
use std::collections::HashSet;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Instant;

#[derive(Clone, Debug)]
pub struct HotkeyBinding {
    pub menu_id: String,
    pub hotkey: HotkeyCombo,
}

#[derive(Clone, Debug, PartialEq, Eq, Hash)]
pub struct HotkeyCombo {
    pub key: rdev::Key,
    pub modifiers: Vec<ModifierKey>,
}

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, PartialOrd, Ord)]
pub enum ModifierKey {
    Ctrl,
    Shift,
    Alt,
    Meta,
}

#[derive(Debug, Clone)]
pub enum InputEvent {
    ShowMenu {
        menu_id: String,
        cursor_x: f64,
        cursor_y: f64,
    },
    HideMenu {
        selected: bool,
    },
    MouseMove {
        x: f64,
        y: f64,
    },
}

struct ActiveMenu {
    menu_id: String,
    pressed_at: Instant,
    trigger_key: rdev::Key,
}

pub struct InputListenerState {
    bindings: Vec<HotkeyBinding>,
    active_modifiers: HashSet<ModifierKey>,
    active_menu: Option<ActiveMenu>,
    quick_tap_threshold_ms: u64,
    last_mouse_x: f64,
    last_mouse_y: f64,
}

/// Parse a hotkey string like "CapsLock", "Ctrl+Space", "Ctrl+Shift+A"
pub fn parse_hotkey(s: &str) -> Result<HotkeyCombo, String> {
    let parts: Vec<&str> = s.split('+').collect();
    if parts.is_empty() {
        return Err(format!("Empty hotkey string: {}", s));
    }

    let mut modifiers: Vec<ModifierKey> = Vec::new();
    let key_str = parts.last().unwrap();

    // Parse all but the last part as modifiers
    for part in &parts[..parts.len() - 1] {
        let modifier = parse_modifier(part)
            .ok_or_else(|| format!("Unknown modifier: {}", part))?;
        if !modifiers.contains(&modifier) {
            modifiers.push(modifier);
        }
    }

    // Sort modifiers for consistent comparison
    modifiers.sort();

    let key = parse_key(key_str)
        .ok_or_else(|| format!("Unknown key: {}", key_str))?;

    Ok(HotkeyCombo { key, modifiers })
}

fn parse_modifier(s: &str) -> Option<ModifierKey> {
    match s.to_lowercase().as_str() {
        "ctrl" | "control" => Some(ModifierKey::Ctrl),
        "shift" => Some(ModifierKey::Shift),
        "alt" => Some(ModifierKey::Alt),
        "meta" | "super" | "win" | "cmd" | "command" => Some(ModifierKey::Meta),
        _ => None,
    }
}

fn parse_key(s: &str) -> Option<rdev::Key> {
    match s.to_lowercase().as_str() {
        // Letters A-Z
        "a" => Some(rdev::Key::KeyA),
        "b" => Some(rdev::Key::KeyB),
        "c" => Some(rdev::Key::KeyC),
        "d" => Some(rdev::Key::KeyD),
        "e" => Some(rdev::Key::KeyE),
        "f" => Some(rdev::Key::KeyF),
        "g" => Some(rdev::Key::KeyG),
        "h" => Some(rdev::Key::KeyH),
        "i" => Some(rdev::Key::KeyI),
        "j" => Some(rdev::Key::KeyJ),
        "k" => Some(rdev::Key::KeyK),
        "l" => Some(rdev::Key::KeyL),
        "m" => Some(rdev::Key::KeyM),
        "n" => Some(rdev::Key::KeyN),
        "o" => Some(rdev::Key::KeyO),
        "p" => Some(rdev::Key::KeyP),
        "q" => Some(rdev::Key::KeyQ),
        "r" => Some(rdev::Key::KeyR),
        "s" => Some(rdev::Key::KeyS),
        "t" => Some(rdev::Key::KeyT),
        "u" => Some(rdev::Key::KeyU),
        "v" => Some(rdev::Key::KeyV),
        "w" => Some(rdev::Key::KeyW),
        "x" => Some(rdev::Key::KeyX),
        "y" => Some(rdev::Key::KeyY),
        "z" => Some(rdev::Key::KeyZ),

        // Numbers 0-9
        "0" => Some(rdev::Key::Num0),
        "1" => Some(rdev::Key::Num1),
        "2" => Some(rdev::Key::Num2),
        "3" => Some(rdev::Key::Num3),
        "4" => Some(rdev::Key::Num4),
        "5" => Some(rdev::Key::Num5),
        "6" => Some(rdev::Key::Num6),
        "7" => Some(rdev::Key::Num7),
        "8" => Some(rdev::Key::Num8),
        "9" => Some(rdev::Key::Num9),

        // Function keys F1-F12
        "f1" => Some(rdev::Key::F1),
        "f2" => Some(rdev::Key::F2),
        "f3" => Some(rdev::Key::F3),
        "f4" => Some(rdev::Key::F4),
        "f5" => Some(rdev::Key::F5),
        "f6" => Some(rdev::Key::F6),
        "f7" => Some(rdev::Key::F7),
        "f8" => Some(rdev::Key::F8),
        "f9" => Some(rdev::Key::F9),
        "f10" => Some(rdev::Key::F10),
        "f11" => Some(rdev::Key::F11),
        "f12" => Some(rdev::Key::F12),

        // Special keys
        "space" => Some(rdev::Key::Space),
        "tab" => Some(rdev::Key::Tab),
        "capslock" => Some(rdev::Key::CapsLock),
        "escape" | "esc" => Some(rdev::Key::Escape),
        "return" | "enter" => Some(rdev::Key::Return),
        "backspace" => Some(rdev::Key::Backspace),
        "delete" | "del" => Some(rdev::Key::Delete),

        // Arrow keys
        "up" => Some(rdev::Key::UpArrow),
        "down" => Some(rdev::Key::DownArrow),
        "left" => Some(rdev::Key::LeftArrow),
        "right" => Some(rdev::Key::RightArrow),

        // Mouse buttons (rdev does not have dedicated key variants for extra mouse buttons;
        // we use Key::Unknown with arbitrary sentinel values as a workaround. The listener
        // handles ButtonPress/ButtonRelease events separately in a real implementation.)
        "mouse4" => Some(rdev::Key::Unknown(200)),
        "mouse5" => Some(rdev::Key::Unknown(201)),

        // Modifier keys themselves as trigger keys
        "ctrl" | "control" => Some(rdev::Key::ControlLeft),
        "shift" => Some(rdev::Key::ShiftLeft),
        "alt" => Some(rdev::Key::Alt),
        "meta" | "super" | "win" | "cmd" | "command" => Some(rdev::Key::MetaLeft),

        _ => None,
    }
}

fn key_to_modifier(key: &rdev::Key) -> Option<ModifierKey> {
    match key {
        rdev::Key::ControlLeft | rdev::Key::ControlRight => Some(ModifierKey::Ctrl),
        rdev::Key::ShiftLeft | rdev::Key::ShiftRight => Some(ModifierKey::Shift),
        rdev::Key::Alt | rdev::Key::AltGr => Some(ModifierKey::Alt),
        rdev::Key::MetaLeft | rdev::Key::MetaRight => Some(ModifierKey::Meta),
        _ => None,
    }
}

fn find_matching_binding<'a>(
    state: &'a InputListenerState,
    key: &rdev::Key,
) -> Option<&'a HotkeyBinding> {
    state.bindings.iter().find(|binding| {
        if &binding.hotkey.key != key {
            return false;
        }
        // Build a sorted vec of active modifiers to compare
        let mut active_sorted: Vec<ModifierKey> = state.active_modifiers.iter().copied().collect();
        active_sorted.sort();
        active_sorted == binding.hotkey.modifiers
    })
}

fn handle_event(
    state: &Arc<Mutex<InputListenerState>>,
    tx: &std::sync::mpsc::Sender<InputEvent>,
    event: rdev::Event,
) {
    // Skip processing while key detection mode is active
    if DETECTING_KEY.load(Ordering::SeqCst) {
        return;
    }

    let mut state = state.lock().unwrap();

    match event.event_type {
        EventType::KeyPress(key) => {
            // Update modifier state
            if let Some(modifier) = key_to_modifier(&key) {
                state.active_modifiers.insert(modifier);
            }

            // Check if key + active modifiers match any binding
            if state.active_menu.is_none() {
                if let Some(binding) = find_matching_binding(&state, &key) {
                    state.active_menu = Some(ActiveMenu {
                        menu_id: binding.menu_id.clone(),
                        pressed_at: Instant::now(),
                        trigger_key: key,
                    });
                    let menu_id = state.active_menu.as_ref().unwrap().menu_id.clone();
                    let cursor_x = state.last_mouse_x;
                    let cursor_y = state.last_mouse_y;
                    let _ = tx.send(InputEvent::ShowMenu {
                        menu_id,
                        cursor_x,
                        cursor_y,
                    });
                }
            }
        }
        EventType::KeyRelease(key) => {
            // Update modifier state
            if let Some(modifier) = key_to_modifier(&key) {
                state.active_modifiers.remove(&modifier);
            }

            // Check if released key matches active menu trigger
            if let Some(ref active) = state.active_menu {
                if active.trigger_key == key {
                    let elapsed = active.pressed_at.elapsed().as_millis() as u64;
                    let selected = elapsed >= state.quick_tap_threshold_ms;
                    let _ = tx.send(InputEvent::HideMenu { selected });
                    state.active_menu = None;
                }
            }
        }
        EventType::MouseMove { x, y } => {
            state.last_mouse_x = x;
            state.last_mouse_y = y;
            if state.active_menu.is_some() {
                let _ = tx.send(InputEvent::MouseMove { x, y });
            }
        }
        _ => {}
    }
}

pub struct InputListener {
    state: Arc<Mutex<InputListenerState>>,
}

impl InputListener {
    pub fn new(quick_tap_threshold_ms: u64) -> Self {
        Self {
            state: Arc::new(Mutex::new(InputListenerState {
                bindings: Vec::new(),
                active_modifiers: HashSet::new(),
                active_menu: None,
                quick_tap_threshold_ms,
                last_mouse_x: 0.0,
                last_mouse_y: 0.0,
            })),
        }
    }

    pub fn update_bindings(&self, bindings: Vec<HotkeyBinding>) {
        let mut state = self.state.lock().unwrap();
        state.bindings = bindings;
    }

    /// Start the input listener.
    /// Returns a Receiver for InputEvents.
    ///
    /// On macOS, uses a native CGEventTap implementation.
    /// On other platforms, uses rdev.
    pub fn start(&self) -> Result<std::sync::mpsc::Receiver<InputEvent>, String> {
        let (tx, rx) = std::sync::mpsc::channel();
        let state = Arc::clone(&self.state);

        #[cfg(target_os = "macos")]
        {
            match crate::macos_input::listen() {
                Ok((native_rx, handle)) => {
                    std::thread::spawn(move || {
                        // Keep the handle alive for the lifetime of this thread
                        let _handle = handle;
                        while let Ok(event) = native_rx.recv() {
                            handle_event(&state, &tx, event);
                        }
                    });
                }
                Err(e) => {
                    return Err(e);
                }
            }
        }

        #[cfg(not(target_os = "macos"))]
        {
            std::thread::spawn(move || {
                let callback = move |event: rdev::Event| {
                    handle_event(&state, &tx, event);
                };
                if let Err(e) = rdev::listen(callback) {
                    eprintln!("rdev listen error: {:?}", e);
                }
            });
        }

        Ok(rx)
    }
}

/// Convert an rdev::Key back to its canonical string name.
/// Returns None for keys we don't support in our hotkey system.
pub fn rdev_key_to_string(key: &rdev::Key) -> Option<String> {
    match key {
        rdev::Key::KeyA => Some("A".into()),
        rdev::Key::KeyB => Some("B".into()),
        rdev::Key::KeyC => Some("C".into()),
        rdev::Key::KeyD => Some("D".into()),
        rdev::Key::KeyE => Some("E".into()),
        rdev::Key::KeyF => Some("F".into()),
        rdev::Key::KeyG => Some("G".into()),
        rdev::Key::KeyH => Some("H".into()),
        rdev::Key::KeyI => Some("I".into()),
        rdev::Key::KeyJ => Some("J".into()),
        rdev::Key::KeyK => Some("K".into()),
        rdev::Key::KeyL => Some("L".into()),
        rdev::Key::KeyM => Some("M".into()),
        rdev::Key::KeyN => Some("N".into()),
        rdev::Key::KeyO => Some("O".into()),
        rdev::Key::KeyP => Some("P".into()),
        rdev::Key::KeyQ => Some("Q".into()),
        rdev::Key::KeyR => Some("R".into()),
        rdev::Key::KeyS => Some("S".into()),
        rdev::Key::KeyT => Some("T".into()),
        rdev::Key::KeyU => Some("U".into()),
        rdev::Key::KeyV => Some("V".into()),
        rdev::Key::KeyW => Some("W".into()),
        rdev::Key::KeyX => Some("X".into()),
        rdev::Key::KeyY => Some("Y".into()),
        rdev::Key::KeyZ => Some("Z".into()),
        rdev::Key::Num0 => Some("0".into()),
        rdev::Key::Num1 => Some("1".into()),
        rdev::Key::Num2 => Some("2".into()),
        rdev::Key::Num3 => Some("3".into()),
        rdev::Key::Num4 => Some("4".into()),
        rdev::Key::Num5 => Some("5".into()),
        rdev::Key::Num6 => Some("6".into()),
        rdev::Key::Num7 => Some("7".into()),
        rdev::Key::Num8 => Some("8".into()),
        rdev::Key::Num9 => Some("9".into()),
        rdev::Key::F1 => Some("F1".into()),
        rdev::Key::F2 => Some("F2".into()),
        rdev::Key::F3 => Some("F3".into()),
        rdev::Key::F4 => Some("F4".into()),
        rdev::Key::F5 => Some("F5".into()),
        rdev::Key::F6 => Some("F6".into()),
        rdev::Key::F7 => Some("F7".into()),
        rdev::Key::F8 => Some("F8".into()),
        rdev::Key::F9 => Some("F9".into()),
        rdev::Key::F10 => Some("F10".into()),
        rdev::Key::F11 => Some("F11".into()),
        rdev::Key::F12 => Some("F12".into()),
        rdev::Key::Space => Some("Space".into()),
        rdev::Key::Tab => Some("Tab".into()),
        rdev::Key::CapsLock => Some("CapsLock".into()),
        rdev::Key::Escape => Some("Escape".into()),
        rdev::Key::Return => Some("Return".into()),
        rdev::Key::Backspace => Some("Backspace".into()),
        rdev::Key::Delete => Some("Delete".into()),
        rdev::Key::UpArrow => Some("Up".into()),
        rdev::Key::DownArrow => Some("Down".into()),
        rdev::Key::LeftArrow => Some("Left".into()),
        rdev::Key::RightArrow => Some("Right".into()),
        rdev::Key::Unknown(200) => Some("Mouse4".into()),
        rdev::Key::Unknown(201) => Some("Mouse5".into()),
        _ => None,
    }
}

/// A shared flag that, when set to true, causes the main input listener
/// to ignore events so that key detection can work without conflicts.
pub static DETECTING_KEY: AtomicBool = AtomicBool::new(false);

/// Start a temporary listener that captures the next key press and
/// emits the result as a `radialsan://key-detected` event on the given AppHandle.
/// The listener stops after detecting one key.
pub fn detect_next_key(app_handle: tauri::AppHandle) {
    DETECTING_KEY.store(true, Ordering::SeqCst);

    std::thread::spawn(move || {
        let modifiers: Arc<Mutex<HashSet<ModifierKey>>> = Arc::new(Mutex::new(HashSet::new()));
        let modifiers_clone = Arc::clone(&modifiers);

        // Channel to signal completion
        let (tx, rx) = std::sync::mpsc::channel::<String>();

        let process_event = move |event: rdev::Event| {
            match event.event_type {
                EventType::KeyPress(key) => {
                    // Track modifiers
                    if let Some(modifier) = key_to_modifier(&key) {
                        modifiers_clone.lock().unwrap().insert(modifier);
                        return;
                    }

                    // Non-modifier key pressed: build the hotkey string
                    if let Some(key_name) = rdev_key_to_string(&key) {
                        let mods = modifiers_clone.lock().unwrap();
                        let mut mod_list: Vec<ModifierKey> = mods.iter().copied().collect();
                        mod_list.sort();

                        let mut parts: Vec<String> = Vec::new();
                        for m in &mod_list {
                            parts.push(match m {
                                ModifierKey::Ctrl => "Ctrl".into(),
                                ModifierKey::Shift => "Shift".into(),
                                ModifierKey::Alt => "Alt".into(),
                                ModifierKey::Meta => "Meta".into(),
                            });
                        }
                        parts.push(key_name);
                        let hotkey_str = parts.join("+");
                        let _ = tx.send(hotkey_str);
                    }
                }
                EventType::KeyRelease(key) => {
                    if let Some(modifier) = key_to_modifier(&key) {
                        modifiers_clone.lock().unwrap().remove(&modifier);
                    }
                }
                _ => {}
            }
        };

        #[cfg(target_os = "macos")]
        let listener_handle;

        #[cfg(target_os = "macos")]
        {
            match crate::macos_input::listen() {
                Ok((native_rx, handle)) => {
                    crate::commands::clear_input_monitoring_issue(&app_handle);
                    listener_handle = Some(handle);
                    std::thread::spawn(move || {
                        while let Ok(event) = native_rx.recv() {
                            process_event(event);
                        }
                    });
                }
                Err(e) => {
                    crate::commands::set_input_monitoring_unavailable(&app_handle, e.clone());
                    use tauri::Emitter;
                    let _ = app_handle.emit(
                        "radialsan://key-detected",
                        serde_json::json!({ "hotkey": null, "error": e }),
                    );
                    DETECTING_KEY.store(false, Ordering::SeqCst);
                    return;
                }
            }
        }

        #[cfg(not(target_os = "macos"))]
        {
            std::thread::spawn(move || {
                if let Err(e) = rdev::listen(process_event) {
                    eprintln!("rdev detect_next_key listen error: {:?}", e);
                }
            });
        }

        // Wait for detection (with a 10 second timeout)
        let result = rx.recv_timeout(std::time::Duration::from_secs(10));
        DETECTING_KEY.store(false, Ordering::SeqCst);

        // Clean up the CGEventTap on macOS
        #[cfg(target_os = "macos")]
        drop(listener_handle);

        match result {
            Ok(hotkey) => {
                use tauri::Emitter;
                let _ = app_handle.emit("radialsan://key-detected", serde_json::json!({ "hotkey": hotkey }));
            }
            Err(_) => {
                use tauri::Emitter;
                let _ = app_handle.emit("radialsan://key-detected", serde_json::json!({ "hotkey": null, "timeout": true }));
            }
        }
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_hotkey_single_key() {
        let combo = parse_hotkey("CapsLock").unwrap();
        assert_eq!(combo.key, rdev::Key::CapsLock);
        assert!(combo.modifiers.is_empty());
    }

    #[test]
    fn test_parse_hotkey_with_modifier() {
        let combo = parse_hotkey("Ctrl+C").unwrap();
        assert_eq!(combo.modifiers, vec![ModifierKey::Ctrl]);
        assert_eq!(combo.key, rdev::Key::KeyC);
    }

    #[test]
    fn test_parse_hotkey_multiple_modifiers() {
        let combo = parse_hotkey("Ctrl+Shift+A").unwrap();
        assert!(combo.modifiers.contains(&ModifierKey::Ctrl));
        assert!(combo.modifiers.contains(&ModifierKey::Shift));
        assert_eq!(combo.key, rdev::Key::KeyA);
    }

    #[test]
    fn test_parse_hotkey_case_insensitive() {
        let a = parse_hotkey("ctrl+c").unwrap();
        let b = parse_hotkey("CTRL+C").unwrap();
        assert_eq!(a, b);
    }

    #[test]
    fn test_parse_hotkey_invalid() {
        assert!(parse_hotkey("NotAValidKey").is_err());
    }

    #[test]
    fn test_parse_hotkey_f_keys() {
        assert_eq!(parse_hotkey("F5").unwrap().key, rdev::Key::F5);
        assert_eq!(parse_hotkey("F12").unwrap().key, rdev::Key::F12);
    }

    #[test]
    fn test_key_to_modifier() {
        assert_eq!(
            key_to_modifier(&rdev::Key::ControlLeft),
            Some(ModifierKey::Ctrl)
        );
        assert_eq!(
            key_to_modifier(&rdev::Key::ControlRight),
            Some(ModifierKey::Ctrl)
        );
        assert_eq!(
            key_to_modifier(&rdev::Key::ShiftLeft),
            Some(ModifierKey::Shift)
        );
        assert_eq!(key_to_modifier(&rdev::Key::Alt), Some(ModifierKey::Alt));
        assert_eq!(
            key_to_modifier(&rdev::Key::MetaLeft),
            Some(ModifierKey::Meta)
        );
        assert_eq!(key_to_modifier(&rdev::Key::KeyA), None);
    }

    #[test]
    fn test_modifier_sorting() {
        let combo = parse_hotkey("Shift+Ctrl+A").unwrap();
        // Modifiers should be sorted consistently
        assert_eq!(combo.modifiers[0], ModifierKey::Ctrl);
        assert_eq!(combo.modifiers[1], ModifierKey::Shift);
    }
}
