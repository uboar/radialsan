use serde::{Deserialize, Serialize};
use std::fmt;
use std::path::Path;

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

#[derive(Debug)]
pub enum SettingsError {
    Io(std::io::Error),
    Json(serde_json::Error),
    InvalidSettings(String),
}

impl fmt::Display for SettingsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            SettingsError::Io(e) => write!(f, "IO error: {}", e),
            SettingsError::Json(e) => write!(f, "JSON error: {}", e),
            SettingsError::InvalidSettings(msg) => write!(f, "Invalid settings: {}", msg),
        }
    }
}

impl From<std::io::Error> for SettingsError {
    fn from(e: std::io::Error) -> Self {
        SettingsError::Io(e)
    }
}

impl From<serde_json::Error> for SettingsError {
    fn from(e: serde_json::Error) -> Self {
        SettingsError::Json(e)
    }
}

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ActivationMode {
    HoldRelease,
    ClickSelect,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum SubmenuOpenMode {
    OnHover,
    OnThreshold,
    OnClick,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum MatchField {
    ProcessName,
    WindowTitle,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum MatchMode {
    Contains,
    Exact,
    Regex,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ActionType {
    SendKey,
    SendText,
    MouseClick,
    OpenUrl,
    OpenFolder,
    OpenFile,
    RunCommand,
    RunScript,
    Clipboard,
    MediaControl,
    Submenu,
    Noop,
    Delay,
    RunLua,
}

// ---------------------------------------------------------------------------
// Core structs
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MenuActivation {
    pub mode: ActivationMode,
    pub quick_tap_threshold_ms: u64,
    pub submenu_open_mode: SubmenuOpenMode,
    pub submenu_hover_delay_ms: u64,
    pub max_submenu_depth: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Appearance {
    pub inner_radius: f64,
    pub outer_radius: f64,
    pub dead_zone_radius: f64,
    pub background_color: String,
    pub slice_fill_color: String,
    pub slice_hover_color: String,
    pub slice_border_color: String,
    pub slice_border_width: f64,
    pub label_font: String,
    pub label_size: f64,
    pub label_color: String,
    pub icon_size: f64,
    pub animation_duration_ms: u64,
    pub opacity: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalSettings {
    pub launch_at_startup: bool,
    pub show_tray_icon: bool,
    pub default_profile_id: String,
    pub menu_activation: MenuActivation,
    pub appearance: Appearance,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MatchRule {
    pub field: MatchField,
    pub match_mode: MatchMode,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PieKey {
    pub id: String,
    pub hotkey: String,
    pub menu_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub id: String,
    pub name: String,
    pub is_default: bool,
    pub match_rules: Vec<MatchRule>,
    pub pie_keys: Vec<PieKey>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceOverrides {
    pub inner_radius: Option<f64>,
    pub outer_radius: Option<f64>,
    pub dead_zone_radius: Option<f64>,
    pub background_color: Option<String>,
    pub slice_fill_color: Option<String>,
    pub slice_hover_color: Option<String>,
    pub slice_border_color: Option<String>,
    pub slice_border_width: Option<f64>,
    pub label_font: Option<String>,
    pub label_size: Option<f64>,
    pub label_color: Option<String>,
    pub icon_size: Option<f64>,
    pub animation_duration_ms: Option<u64>,
    pub opacity: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Action {
    #[serde(rename = "type")]
    pub action_type: ActionType,
    pub params: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Slice {
    pub id: String,
    pub label: String,
    pub icon: String,
    pub actions: Vec<Action>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PieMenu {
    pub id: String,
    pub name: String,
    pub appearance_overrides: Option<AppearanceOverrides>,
    pub slices: Vec<Slice>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub version: u32,
    pub global: GlobalSettings,
    pub profiles: Vec<Profile>,
    pub menus: Vec<PieMenu>,
}

// ---------------------------------------------------------------------------
// Default implementation
// ---------------------------------------------------------------------------

impl Default for Appearance {
    fn default() -> Self {
        Self {
            inner_radius: 40.0,
            outer_radius: 120.0,
            dead_zone_radius: 30.0,
            background_color: "#00000080".to_string(),
            slice_fill_color: "#1e1e2e".to_string(),
            slice_hover_color: "#313244".to_string(),
            slice_border_color: "#585b70".to_string(),
            slice_border_width: 1.0,
            label_font: "sans-serif".to_string(),
            label_size: 13.0,
            label_color: "#cdd6f4".to_string(),
            icon_size: 20.0,
            animation_duration_ms: 120,
            opacity: 1.0,
        }
    }
}

impl Default for MenuActivation {
    fn default() -> Self {
        Self {
            mode: ActivationMode::HoldRelease,
            quick_tap_threshold_ms: 200,
            submenu_open_mode: SubmenuOpenMode::OnHover,
            submenu_hover_delay_ms: 400,
            max_submenu_depth: 3,
        }
    }
}

impl Default for GlobalSettings {
    fn default() -> Self {
        Self {
            launch_at_startup: false,
            show_tray_icon: true,
            default_profile_id: "default".to_string(),
            menu_activation: MenuActivation::default(),
            appearance: Appearance::default(),
        }
    }
}

fn make_send_key_slice(id: &str, label: &str, icon: &str, key: &str) -> Slice {
    Slice {
        id: id.to_string(),
        label: label.to_string(),
        icon: icon.to_string(),
        actions: vec![Action {
            action_type: ActionType::SendKey,
            params: serde_json::json!({ "key": key }),
        }],
    }
}

impl Default for Settings {
    fn default() -> Self {
        let slices = vec![
            make_send_key_slice("slice_copy", "Copy", "copy", "ctrl+c"),
            make_send_key_slice("slice_paste", "Paste", "clipboard", "ctrl+v"),
            make_send_key_slice("slice_undo", "Undo", "undo", "ctrl+z"),
            make_send_key_slice("slice_redo", "Redo", "redo", "ctrl+shift+z"),
        ];

        let sample_menu = PieMenu {
            id: "menu_1".to_string(),
            name: "Default Menu".to_string(),
            appearance_overrides: None,
            slices,
        };

        let default_profile = Profile {
            id: "default".to_string(),
            name: "Default".to_string(),
            is_default: true,
            match_rules: vec![],
            pie_keys: vec![PieKey {
                id: "piekey_1".to_string(),
                hotkey: "CapsLock".to_string(),
                menu_id: "menu_1".to_string(),
            }],
        };

        Self {
            version: 1,
            global: GlobalSettings::default(),
            profiles: vec![default_profile],
            menus: vec![sample_menu],
        }
    }
}

// ---------------------------------------------------------------------------
// File I/O and query methods
// ---------------------------------------------------------------------------

const SETTINGS_FILE: &str = "settings.json";

impl Settings {
    pub fn load(app_data_dir: &Path) -> Result<Self, SettingsError> {
        let path = app_data_dir.join(SETTINGS_FILE);

        if !path.exists() {
            let settings = Settings::default();
            settings.save(app_data_dir)?;
            return Ok(settings);
        }

        let content = std::fs::read_to_string(&path)?;
        let settings: Settings = serde_json::from_str(&content)?;
        Ok(settings)
    }

    pub fn save(&self, app_data_dir: &Path) -> Result<(), SettingsError> {
        std::fs::create_dir_all(app_data_dir)?;
        let path = app_data_dir.join(SETTINGS_FILE);
        let content = serde_json::to_string_pretty(self)?;
        std::fs::write(path, content)?;
        Ok(())
    }

    /// Create a backup of the current settings file
    pub fn backup(app_data_dir: &Path) -> Result<(), SettingsError> {
        let settings_path = app_data_dir.join(SETTINGS_FILE);
        if !settings_path.exists() {
            return Ok(()); // Nothing to backup
        }

        let backup_dir = app_data_dir.join("backups");
        std::fs::create_dir_all(&backup_dir).map_err(SettingsError::Io)?;

        // Backup filename with unix timestamp
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        let backup_path = backup_dir.join(format!("settings_{}.json", timestamp));

        std::fs::copy(&settings_path, &backup_path).map_err(SettingsError::Io)?;

        // Keep only last 10 backups
        cleanup_old_backups(&backup_dir, 10)?;

        Ok(())
    }

    pub fn get_menu_by_id(&self, id: &str) -> Option<&PieMenu> {
        self.menus.iter().find(|m| m.id == id)
    }

    pub fn get_active_profile(&self, window_title: &str, process_name: &str) -> &Profile {
        // Try each non-default profile in order; return the first that matches.
        for profile in &self.profiles {
            if profile.is_default {
                continue;
            }
            if profile_matches(profile, window_title, process_name) {
                return profile;
            }
        }

        // Fall back to the profile marked as default, or the first one.
        self.profiles
            .iter()
            .find(|p| p.is_default)
            .or_else(|| self.profiles.first())
            .expect("settings must have at least one profile")
    }
}

fn cleanup_old_backups(backup_dir: &Path, max_backups: usize) -> Result<(), SettingsError> {
    let mut entries: Vec<_> = std::fs::read_dir(backup_dir)
        .map_err(SettingsError::Io)?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map_or(false, |ext| ext == "json"))
        .collect();

    // Sort by modified time (oldest first)
    entries.sort_by_key(|e| e.metadata().and_then(|m| m.modified()).ok());

    // Remove oldest if over limit
    while entries.len() > max_backups {
        if let Some(entry) = entries.first() {
            let _ = std::fs::remove_file(entry.path());
        }
        entries.remove(0);
    }

    Ok(())
}

fn profile_matches(profile: &Profile, window_title: &str, process_name: &str) -> bool {
    profile.match_rules.iter().all(|rule| {
        let haystack = match rule.field {
            MatchField::ProcessName => process_name,
            MatchField::WindowTitle => window_title,
        };
        match rule.match_mode {
            MatchMode::Contains => haystack.contains(&rule.value),
            MatchMode::Exact => haystack == rule.value,
            MatchMode::Regex => {
                regex::Regex::new(&rule.value)
                    .map(|re| re.is_match(haystack))
                    .unwrap_or(false)
            }
        }
    })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_dir() -> std::path::PathBuf {
        let dir = std::env::temp_dir().join(format!(
            "radialsan_test_{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .subsec_nanos()
        ));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn test_default_settings_roundtrip() {
        let settings = Settings::default();
        let json = serde_json::to_string(&settings).expect("serialize failed");
        let restored: Settings = serde_json::from_str(&json).expect("deserialize failed");

        assert_eq!(restored.version, 1);
        assert_eq!(restored.profiles.len(), 1);
        assert_eq!(restored.profiles[0].id, "default");
        assert_eq!(restored.menus.len(), 1);
        assert_eq!(restored.menus[0].id, "menu_1");
        assert_eq!(restored.menus[0].slices.len(), 4);
        assert_eq!(restored.profiles[0].pie_keys[0].hotkey, "CapsLock");
    }

    #[test]
    fn test_load_missing_file_creates_default() {
        let dir = temp_dir();
        let settings = Settings::load(&dir).expect("load failed");

        // Default should be created and persisted
        assert_eq!(settings.version, 1);
        assert!(dir.join("settings.json").exists());

        // Loading again should return the same
        let settings2 = Settings::load(&dir).expect("second load failed");
        assert_eq!(settings2.version, settings.version);
        assert_eq!(settings2.profiles.len(), settings.profiles.len());

        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn test_profile_matching_contains() {
        let mut settings = Settings::default();

        let app_profile = Profile {
            id: "vscode".to_string(),
            name: "VSCode".to_string(),
            is_default: false,
            match_rules: vec![MatchRule {
                field: MatchField::ProcessName,
                match_mode: MatchMode::Contains,
                value: "code".to_string(),
            }],
            pie_keys: vec![],
        };
        settings.profiles.insert(0, app_profile);

        let matched = settings.get_active_profile("main.rs - VSCode", "code");
        assert_eq!(matched.id, "vscode");

        // Should fall back for a non-matching process
        let fallback = settings.get_active_profile("Untitled", "firefox");
        assert_eq!(fallback.id, "default");
    }

    #[test]
    fn test_profile_matching_regex() {
        let mut settings = Settings::default();

        let browser_profile = Profile {
            id: "browsers".to_string(),
            name: "Browsers".to_string(),
            is_default: false,
            match_rules: vec![MatchRule {
                field: MatchField::ProcessName,
                match_mode: MatchMode::Regex,
                value: r"^(firefox|chrome|safari)$".to_string(),
            }],
            pie_keys: vec![],
        };
        settings.profiles.insert(0, browser_profile);

        let matched = settings.get_active_profile("GitHub", "firefox");
        assert_eq!(matched.id, "browsers");

        let matched2 = settings.get_active_profile("Google", "chrome");
        assert_eq!(matched2.id, "browsers");

        let no_match = settings.get_active_profile("Finder", "Finder");
        assert_eq!(no_match.id, "default");
    }

    #[test]
    fn test_profile_matching_fallback_to_default() {
        let settings = Settings::default();
        // Default settings has only the default profile, so always returns it.
        let profile = settings.get_active_profile("anything", "anything");
        assert_eq!(profile.id, "default");
        assert!(profile.is_default);
    }

    #[test]
    fn test_get_menu_by_id() {
        let settings = Settings::default();

        let menu = settings.get_menu_by_id("menu_1");
        assert!(menu.is_some());
        assert_eq!(menu.unwrap().name, "Default Menu");

        let missing = settings.get_menu_by_id("nonexistent");
        assert!(missing.is_none());
    }
}
