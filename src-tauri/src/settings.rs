use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ActionType {
    LaunchApp,
    OpenUrl,
    Keystroke,
    ShellCommand,
    TextExpand,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Action {
    pub id: String,
    pub label: String,
    pub icon: Option<String>,
    pub action_type: ActionType,
    pub payload: String,
}

impl Action {
    pub fn new(label: &str, action_type: ActionType, payload: &str) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            label: label.to_string(),
            icon: None,
            action_type,
            payload: payload.to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PieMenuConfig {
    pub id: String,
    pub name: String,
    pub trigger_key: String,
    pub actions: Vec<Action>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub menus: Vec<PieMenuConfig>,
    pub dead_zone_radius: f64,
    pub activation_delay_ms: u64,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            menus: vec![],
            dead_zone_radius: 30.0,
            activation_delay_ms: 150,
        }
    }
}
