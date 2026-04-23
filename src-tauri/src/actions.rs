use std::fmt;

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

#[derive(Debug)]
pub enum ActionError {
    InvalidParams(String),
    ExecutionFailed(String),
    UnsupportedAction(String),
}

impl fmt::Display for ActionError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ActionError::InvalidParams(msg) => write!(f, "Invalid params: {}", msg),
            ActionError::ExecutionFailed(msg) => write!(f, "Execution failed: {}", msg),
            ActionError::UnsupportedAction(msg) => write!(f, "Unsupported action: {}", msg),
        }
    }
}

impl std::error::Error for ActionError {}

// ---------------------------------------------------------------------------
// Key string parser
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, PartialEq)]
pub struct ParsedKey {
    pub modifiers: Vec<ModifierAction>,
    pub key: KeyAction,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ModifierAction {
    Ctrl,
    Shift,
    Alt,
    Meta,
}

#[derive(Debug, Clone, PartialEq)]
pub enum KeyAction {
    Character(char),
    Special(SpecialKey),
}

#[derive(Debug, Clone, PartialEq)]
pub enum SpecialKey {
    F1,
    F2,
    F3,
    F4,
    F5,
    F6,
    F7,
    F8,
    F9,
    F10,
    F11,
    F12,
    Enter,
    Tab,
    Escape,
    Backspace,
    Delete,
    Space,
    Up,
    Down,
    Left,
    Right,
    Home,
    End,
    PageUp,
    PageDown,
}

pub fn parse_key_string(s: &str) -> Result<ParsedKey, ActionError> {
    if s.is_empty() {
        return Err(ActionError::InvalidParams("key string is empty".into()));
    }

    let parts: Vec<&str> = s.split('+').collect();
    if parts.is_empty() {
        return Err(ActionError::InvalidParams("key string is empty".into()));
    }

    // Last part is the key, everything before is modifiers
    let (modifier_parts, key_part) = parts.split_at(parts.len() - 1);
    let key_str = key_part[0];

    let mut modifiers = Vec::new();
    for part in modifier_parts {
        let m = match part.to_lowercase().as_str() {
            "ctrl" | "control" => ModifierAction::Ctrl,
            "shift" => ModifierAction::Shift,
            "alt" => ModifierAction::Alt,
            "meta" | "cmd" | "super" | "win" => ModifierAction::Meta,
            other => {
                return Err(ActionError::InvalidParams(format!(
                    "unknown modifier: {}",
                    other
                )))
            }
        };
        modifiers.push(m);
    }

    let key = parse_key_part(key_str)?;

    Ok(ParsedKey { modifiers, key })
}

fn parse_key_part(s: &str) -> Result<KeyAction, ActionError> {
    // Try special keys first (case-insensitive)
    let special = match s.to_lowercase().as_str() {
        "enter" | "return" => Some(SpecialKey::Enter),
        "tab" => Some(SpecialKey::Tab),
        "escape" | "esc" => Some(SpecialKey::Escape),
        "backspace" => Some(SpecialKey::Backspace),
        "delete" | "del" => Some(SpecialKey::Delete),
        "space" => Some(SpecialKey::Space),
        "up" => Some(SpecialKey::Up),
        "down" => Some(SpecialKey::Down),
        "left" => Some(SpecialKey::Left),
        "right" => Some(SpecialKey::Right),
        "home" => Some(SpecialKey::Home),
        "end" => Some(SpecialKey::End),
        "pageup" | "pgup" => Some(SpecialKey::PageUp),
        "pagedown" | "pgdn" | "pgdown" => Some(SpecialKey::PageDown),
        "f1" => Some(SpecialKey::F1),
        "f2" => Some(SpecialKey::F2),
        "f3" => Some(SpecialKey::F3),
        "f4" => Some(SpecialKey::F4),
        "f5" => Some(SpecialKey::F5),
        "f6" => Some(SpecialKey::F6),
        "f7" => Some(SpecialKey::F7),
        "f8" => Some(SpecialKey::F8),
        "f9" => Some(SpecialKey::F9),
        "f10" => Some(SpecialKey::F10),
        "f11" => Some(SpecialKey::F11),
        "f12" => Some(SpecialKey::F12),
        _ => None,
    };

    if let Some(sk) = special {
        return Ok(KeyAction::Special(sk));
    }

    // Try as a single character (lowercased for case-insensitivity)
    let s_lower = s.to_lowercase();
    let mut chars = s_lower.chars();
    if let Some(c) = chars.next() {
        if chars.next().is_none() {
            return Ok(KeyAction::Character(c));
        }
    }

    Err(ActionError::InvalidParams(format!(
        "unknown key: {}",
        s
    )))
}

// ---------------------------------------------------------------------------
// Enigo helpers
// ---------------------------------------------------------------------------

fn modifier_to_enigo(m: &ModifierAction) -> enigo::Key {
    match m {
        ModifierAction::Ctrl => enigo::Key::Control,
        ModifierAction::Shift => enigo::Key::Shift,
        ModifierAction::Alt => enigo::Key::Alt,
        ModifierAction::Meta => enigo::Key::Meta,
    }
}

fn key_action_to_enigo(k: &KeyAction) -> Result<enigo::Key, ActionError> {
    match k {
        KeyAction::Character(c) => Ok(enigo::Key::Unicode(*c)),
        KeyAction::Special(s) => match s {
            SpecialKey::Enter => Ok(enigo::Key::Return),
            SpecialKey::Tab => Ok(enigo::Key::Tab),
            SpecialKey::Escape => Ok(enigo::Key::Escape),
            SpecialKey::Backspace => Ok(enigo::Key::Backspace),
            SpecialKey::Delete => Ok(enigo::Key::Delete),
            SpecialKey::Space => Ok(enigo::Key::Space),
            SpecialKey::Up => Ok(enigo::Key::UpArrow),
            SpecialKey::Down => Ok(enigo::Key::DownArrow),
            SpecialKey::Left => Ok(enigo::Key::LeftArrow),
            SpecialKey::Right => Ok(enigo::Key::RightArrow),
            SpecialKey::Home => Ok(enigo::Key::Home),
            SpecialKey::End => Ok(enigo::Key::End),
            SpecialKey::PageUp => Ok(enigo::Key::PageUp),
            SpecialKey::PageDown => Ok(enigo::Key::PageDown),
            SpecialKey::F1 => Ok(enigo::Key::F1),
            SpecialKey::F2 => Ok(enigo::Key::F2),
            SpecialKey::F3 => Ok(enigo::Key::F3),
            SpecialKey::F4 => Ok(enigo::Key::F4),
            SpecialKey::F5 => Ok(enigo::Key::F5),
            SpecialKey::F6 => Ok(enigo::Key::F6),
            SpecialKey::F7 => Ok(enigo::Key::F7),
            SpecialKey::F8 => Ok(enigo::Key::F8),
            SpecialKey::F9 => Ok(enigo::Key::F9),
            SpecialKey::F10 => Ok(enigo::Key::F10),
            SpecialKey::F11 => Ok(enigo::Key::F11),
            SpecialKey::F12 => Ok(enigo::Key::F12),
        },
    }
}

// ---------------------------------------------------------------------------
// Action executor
// ---------------------------------------------------------------------------

pub fn execute_action(action_type: &str, params: &serde_json::Value) -> Result<(), ActionError> {
    match action_type {
        "sendKey" => execute_send_key(params),
        "sendText" => execute_send_text(params),
        "mouseClick" => execute_mouse_click(params),
        "openUrl" => execute_open_url(params),
        "openFolder" => execute_open_folder(params),
        "openFile" => execute_open_file(params),
        "runCommand" => execute_run_command(params),
        "runScript" => execute_run_script(params),
        "clipboard" => execute_clipboard(params),
        "mediaControl" => execute_media_control(params),
        "noop" => Ok(()),
        "delay" => execute_delay(params),
        "submenu" => Ok(()), // Handled by frontend
        "runLua" => execute_run_lua(params),
        other => Err(ActionError::UnsupportedAction(other.to_string())),
    }
}

// ---------------------------------------------------------------------------
// Individual action implementations
// ---------------------------------------------------------------------------

fn execute_send_key(params: &serde_json::Value) -> Result<(), ActionError> {
    let keys = params
        .get("keys")
        .or_else(|| params.get("key"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| ActionError::InvalidParams("missing 'keys' field".into()))?;

    let parsed = parse_key_string(keys)?;
    let mut enigo = enigo::Enigo::new(&enigo::Settings::default())
        .map_err(|e| ActionError::ExecutionFailed(format!("Failed to create enigo: {}", e)))?;

    use enigo::{Direction, Keyboard};

    // Press modifiers
    for m in &parsed.modifiers {
        let key = modifier_to_enigo(m);
        enigo
            .key(key, Direction::Press)
            .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;
    }

    // Press+release main key
    let main_key = key_action_to_enigo(&parsed.key)?;
    enigo
        .key(main_key, Direction::Click)
        .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;

    // Release modifiers in reverse
    for m in parsed.modifiers.iter().rev() {
        let key = modifier_to_enigo(m);
        enigo
            .key(key, Direction::Release)
            .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;
    }

    Ok(())
}

fn execute_send_text(params: &serde_json::Value) -> Result<(), ActionError> {
    let text = params
        .get("text")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ActionError::InvalidParams("missing 'text'".into()))?;
    let mut enigo = enigo::Enigo::new(&enigo::Settings::default())
        .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;
    use enigo::Keyboard;
    enigo
        .text(text)
        .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;
    Ok(())
}

fn execute_open_url(params: &serde_json::Value) -> Result<(), ActionError> {
    let url = params
        .get("url")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ActionError::InvalidParams("missing 'url' field".into()))?;
    open::that(url).map_err(|e| ActionError::ExecutionFailed(e.to_string()))
}

fn execute_open_folder(params: &serde_json::Value) -> Result<(), ActionError> {
    let path = params
        .get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ActionError::InvalidParams("missing 'path' field".into()))?;
    open::that(path).map_err(|e| ActionError::ExecutionFailed(e.to_string()))
}

fn execute_open_file(params: &serde_json::Value) -> Result<(), ActionError> {
    let path = params
        .get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ActionError::InvalidParams("missing 'path' field".into()))?;
    open::that(path).map_err(|e| ActionError::ExecutionFailed(e.to_string()))
}

fn execute_run_command(params: &serde_json::Value) -> Result<(), ActionError> {
    let command = params
        .get("command")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ActionError::InvalidParams("missing 'command' field".into()))?;

    #[cfg(target_os = "windows")]
    let status = std::process::Command::new("cmd")
        .args(["/C", command])
        .status()
        .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;

    #[cfg(not(target_os = "windows"))]
    let status = std::process::Command::new("sh")
        .args(["-c", command])
        .status()
        .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;

    if status.success() {
        Ok(())
    } else {
        Err(ActionError::ExecutionFailed(format!(
            "command exited with status: {}",
            status
        )))
    }
}

fn execute_clipboard(params: &serde_json::Value) -> Result<(), ActionError> {
    let operation = params
        .get("operation")
        .or_else(|| params.get("action"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| ActionError::InvalidParams("missing 'operation' field".into()))?;

    // On macOS use Cmd (Meta), on other platforms use Ctrl
    #[cfg(target_os = "macos")]
    let modifier_key = "meta";
    #[cfg(not(target_os = "macos"))]
    let modifier_key = "ctrl";

    let key_str = match operation {
        "copy" => format!("{}+c", modifier_key),
        "cut" => format!("{}+x", modifier_key),
        "paste" => format!("{}+v", modifier_key),
        other => {
            return Err(ActionError::InvalidParams(format!(
                "unknown clipboard operation: {}",
                other
            )))
        }
    };

    let key_params = serde_json::json!({ "keys": key_str });
    execute_send_key(&key_params)
}

fn execute_mouse_click(params: &serde_json::Value) -> Result<(), ActionError> {
    let button = params.get("button")
        .and_then(|v| v.as_str())
        .unwrap_or("left");
    let clicks = params.get("clicks")
        .and_then(|v| v.as_u64())
        .unwrap_or(1) as usize;
    let modifiers: Vec<String> = params.get("modifiers")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    let mut enigo = enigo::Enigo::new(&enigo::Settings::default())
        .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;

    use enigo::{Keyboard, Mouse, Direction, Button};

    // Press modifiers
    for m in &modifiers {
        let key = match m.to_lowercase().as_str() {
            "ctrl" | "control" => enigo::Key::Control,
            "shift" => enigo::Key::Shift,
            "alt" => enigo::Key::Alt,
            "meta" | "cmd" | "win" => enigo::Key::Meta,
            _ => continue,
        };
        enigo.key(key, Direction::Press)
            .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;
    }

    // Click
    let btn = match button {
        "right" => Button::Right,
        "middle" => Button::Middle,
        _ => Button::Left,
    };

    for _ in 0..clicks {
        enigo.button(btn, Direction::Click)
            .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;
    }

    // Release modifiers in reverse
    for m in modifiers.iter().rev() {
        let key = match m.to_lowercase().as_str() {
            "ctrl" | "control" => enigo::Key::Control,
            "shift" => enigo::Key::Shift,
            "alt" => enigo::Key::Alt,
            "meta" | "cmd" | "win" => enigo::Key::Meta,
            _ => continue,
        };
        enigo.key(key, Direction::Release)
            .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;
    }

    Ok(())
}

fn execute_media_control(params: &serde_json::Value) -> Result<(), ActionError> {
    let action = params.get("action")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ActionError::InvalidParams("missing 'action' field".into()))?;

    use enigo::{Keyboard, Direction, Key};

    // Key::MediaStop is not available on macOS in enigo 0.2
    #[cfg(target_os = "macos")]
    if action == "stop" {
        return Err(ActionError::UnsupportedAction(
            "mediaControl 'stop' is not supported on macOS".into(),
        ));
    }

    let key = match action {
        "play" | "pause" | "playPause" => Key::MediaPlayPause,
        "next" => Key::MediaNextTrack,
        "prev" | "previous" => Key::MediaPrevTrack,
        #[cfg(any(target_os = "windows", all(unix, not(target_os = "macos"))))]
        "stop" => Key::MediaStop,
        "volumeUp" => Key::VolumeUp,
        "volumeDown" => Key::VolumeDown,
        "mute" => Key::VolumeMute,
        other => return Err(ActionError::InvalidParams(format!("unknown media action: {}", other))),
    };

    let mut enigo = enigo::Enigo::new(&enigo::Settings::default())
        .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;

    enigo.key(key, Direction::Click)
        .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;

    Ok(())
}

fn execute_run_script(params: &serde_json::Value) -> Result<(), ActionError> {
    let interpreter = params.get("interpreter")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ActionError::InvalidParams("missing 'interpreter' field".into()))?;
    let script_path = params.get("scriptPath")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ActionError::InvalidParams("missing 'scriptPath' field".into()))?;
    let args: Vec<String> = params.get("args")
        .and_then(|v| serde_json::from_value(v.clone()).ok())
        .unwrap_or_default();

    std::process::Command::new(interpreter)
        .arg(script_path)
        .args(&args)
        .spawn()
        .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;

    Ok(())
}

fn execute_run_lua(params: &serde_json::Value) -> Result<(), ActionError> {
    // Option 1: inline script
    if let Some(script) = params.get("script").and_then(|v| v.as_str()) {
        crate::lua_engine::execute_lua_script(script)
            .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;
        return Ok(());
    }

    // Option 2: script file path
    if let Some(path) = params.get("scriptPath").and_then(|v| v.as_str()) {
        crate::lua_engine::execute_lua_file(std::path::Path::new(path))
            .map_err(|e| ActionError::ExecutionFailed(e.to_string()))?;
        return Ok(());
    }

    Err(ActionError::InvalidParams("runLua requires 'script' or 'scriptPath'".into()))
}

fn execute_delay(params: &serde_json::Value) -> Result<(), ActionError> {
    let ms = params
        .get("ms")
        .and_then(|v| v.as_u64())
        .ok_or_else(|| ActionError::InvalidParams("missing 'ms' field".into()))?;
    std::thread::sleep(std::time::Duration::from_millis(ms));
    Ok(())
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_key_string_simple_char() {
        let p = parse_key_string("a").unwrap();
        assert_eq!(p.key, KeyAction::Character('a'));
        assert!(p.modifiers.is_empty());
    }

    #[test]
    fn test_parse_key_string_with_ctrl() {
        let p = parse_key_string("ctrl+c").unwrap();
        assert_eq!(p.modifiers, vec![ModifierAction::Ctrl]);
        assert_eq!(p.key, KeyAction::Character('c'));
    }

    #[test]
    fn test_parse_key_string_multiple_modifiers() {
        let p = parse_key_string("ctrl+shift+a").unwrap();
        assert!(p.modifiers.contains(&ModifierAction::Ctrl));
        assert!(p.modifiers.contains(&ModifierAction::Shift));
        assert_eq!(p.key, KeyAction::Character('a'));
    }

    #[test]
    fn test_parse_key_string_f_key() {
        let p = parse_key_string("F5").unwrap();
        assert_eq!(p.key, KeyAction::Special(SpecialKey::F5));
    }

    #[test]
    fn test_parse_key_string_special_keys() {
        assert_eq!(
            parse_key_string("Enter").unwrap().key,
            KeyAction::Special(SpecialKey::Enter)
        );
        assert_eq!(
            parse_key_string("Tab").unwrap().key,
            KeyAction::Special(SpecialKey::Tab)
        );
        assert_eq!(
            parse_key_string("Escape").unwrap().key,
            KeyAction::Special(SpecialKey::Escape)
        );
        assert_eq!(
            parse_key_string("Space").unwrap().key,
            KeyAction::Special(SpecialKey::Space)
        );
    }

    #[test]
    fn test_parse_key_string_case_insensitive() {
        let a = parse_key_string("CTRL+C").unwrap();
        let b = parse_key_string("ctrl+c").unwrap();
        assert_eq!(a, b);
    }

    #[test]
    fn test_parse_key_string_invalid() {
        assert!(parse_key_string("").is_err());
    }

    #[test]
    fn test_execute_noop() {
        assert!(execute_action("noop", &serde_json::Value::Null).is_ok());
    }

    #[test]
    fn test_execute_delay() {
        let params = serde_json::json!({ "ms": 10 });
        assert!(execute_action("delay", &params).is_ok());
    }

    #[test]
    fn test_execute_unsupported() {
        assert!(execute_action("unknown_action", &serde_json::Value::Null).is_err());
    }

    #[test]
    fn test_execute_send_key_missing_params() {
        let params = serde_json::json!({});
        assert!(execute_action("sendKey", &params).is_err());
    }

    #[test]
    fn test_execute_submenu_noop() {
        // submenu is handled by frontend, rust side should just return Ok
        assert!(execute_action("submenu", &serde_json::json!({"menuId": "m1"})).is_ok());
    }

    #[test]
    fn test_execute_run_script_missing_params() {
        assert!(execute_action("runScript", &serde_json::json!({})).is_err());
        assert!(execute_action("runScript", &serde_json::json!({"interpreter": "python"})).is_err());
    }

    #[test]
    fn test_execute_media_control_invalid_action() {
        let params = serde_json::json!({"action": "invalidMedia"});
        let result = execute_action("mediaControl", &params);
        assert!(result.is_err());
    }

    #[test]
    fn test_execute_media_control_missing_action() {
        let params = serde_json::json!({});
        let result = execute_action("mediaControl", &params);
        assert!(result.is_err());
    }

    #[test]
    fn test_send_key_accepts_legacy_key_field() {
        let params = serde_json::json!({ "key": "ctrl+c" });
        let keys = params
            .get("keys")
            .or_else(|| params.get("key"))
            .and_then(|v| v.as_str());
        assert_eq!(keys, Some("ctrl+c"));
    }

    #[test]
    fn test_clipboard_accepts_legacy_action_field() {
        let params = serde_json::json!({ "action": "copy" });
        let operation = params
            .get("operation")
            .or_else(|| params.get("action"))
            .and_then(|v| v.as_str());
        assert_eq!(operation, Some("copy"));
    }
}
