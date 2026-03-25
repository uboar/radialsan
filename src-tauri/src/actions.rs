// Placeholder: action execution engine
// Executes actions such as launching apps, opening URLs, sending keystrokes, etc.

use crate::settings::{Action, ActionType};

pub struct ActionExecutor;

impl ActionExecutor {
    pub fn new() -> Self {
        Self
    }

    /// Execute a single action.
    pub fn execute(&self, action: &Action) -> Result<(), String> {
        match action.action_type {
            ActionType::LaunchApp => {
                log::info!("LaunchApp: {}", action.payload);
                // TODO: implement with std::process::Command
                Ok(())
            }
            ActionType::OpenUrl => {
                log::info!("OpenUrl: {}", action.payload);
                open::that(&action.payload).map_err(|e| e.to_string())
            }
            ActionType::Keystroke => {
                log::info!("Keystroke: {}", action.payload);
                // TODO: implement with enigo
                Ok(())
            }
            ActionType::ShellCommand => {
                log::info!("ShellCommand: {}", action.payload);
                // TODO: implement with std::process::Command
                Ok(())
            }
            ActionType::TextExpand => {
                log::info!("TextExpand: {}", action.payload);
                // TODO: implement with enigo clipboard paste
                Ok(())
            }
        }
    }
}

impl Default for ActionExecutor {
    fn default() -> Self {
        Self::new()
    }
}
