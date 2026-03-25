// Placeholder: system tray setup and management

pub struct TrayManager;

impl TrayManager {
    pub fn new() -> Self {
        Self
    }

    /// Build and register the system tray icon with menu.
    pub fn setup(&self) {
        // TODO: implement system tray with tauri::tray API
        log::info!("TrayManager setup (placeholder)");
    }
}

impl Default for TrayManager {
    fn default() -> Self {
        Self::new()
    }
}
