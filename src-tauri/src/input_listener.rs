// Placeholder: global input listener using rdev
// Will listen for hotkey triggers and emit Tauri events to the frontend

pub struct InputListener;

impl InputListener {
    pub fn new() -> Self {
        Self
    }

    /// Start listening for global input events in a background thread.
    pub fn start(&self) {
        // TODO: implement rdev event listener
        log::info!("InputListener started (placeholder)");
    }
}

impl Default for InputListener {
    fn default() -> Self {
        Self::new()
    }
}
