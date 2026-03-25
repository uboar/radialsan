use mlua::prelude::*;
use std::path::Path;

/// Execute a Lua script string with the radialsan API available.
pub fn execute_lua_script(script: &str) -> Result<(), LuaEngineError> {
    let lua = Lua::new();
    register_api(&lua)?;
    lua.load(script).exec().map_err(LuaEngineError::Lua)?;
    Ok(())
}

/// Execute a Lua script file with the radialsan API available.
pub fn execute_lua_file(path: &Path) -> Result<(), LuaEngineError> {
    let script = std::fs::read_to_string(path)
        .map_err(|e| LuaEngineError::Io(e))?;
    execute_lua_script(&script)
}

/// Register the radialsan API functions in the Lua environment.
fn register_api(lua: &Lua) -> Result<(), LuaEngineError> {
    let globals = lua.globals();

    // Create 'radialsan' table
    let rs = lua.create_table().map_err(LuaEngineError::Lua)?;

    // radialsan.send_key(keys: string)
    let send_key = lua.create_function(|_, keys: String| {
        let params = serde_json::json!({ "keys": keys });
        crate::actions::execute_action("sendKey", &params)
            .map_err(|e| mlua::Error::RuntimeError(e.to_string()))?;
        Ok(())
    }).map_err(LuaEngineError::Lua)?;
    rs.set("send_key", send_key).map_err(LuaEngineError::Lua)?;

    // radialsan.send_text(text: string)
    let send_text = lua.create_function(|_, text: String| {
        let params = serde_json::json!({ "text": text });
        crate::actions::execute_action("sendText", &params)
            .map_err(|e| mlua::Error::RuntimeError(e.to_string()))?;
        Ok(())
    }).map_err(LuaEngineError::Lua)?;
    rs.set("send_text", send_text).map_err(LuaEngineError::Lua)?;

    // radialsan.delay(ms: integer)
    let delay = lua.create_function(|_, ms: u64| {
        std::thread::sleep(std::time::Duration::from_millis(ms));
        Ok(())
    }).map_err(LuaEngineError::Lua)?;
    rs.set("delay", delay).map_err(LuaEngineError::Lua)?;

    // radialsan.open_url(url: string)
    let open_url = lua.create_function(|_, url: String| {
        open::that(&url)
            .map_err(|e| mlua::Error::RuntimeError(e.to_string()))?;
        Ok(())
    }).map_err(LuaEngineError::Lua)?;
    rs.set("open_url", open_url).map_err(LuaEngineError::Lua)?;

    // radialsan.open_file(path: string)
    let open_file = lua.create_function(|_, path: String| {
        open::that(&path)
            .map_err(|e| mlua::Error::RuntimeError(e.to_string()))?;
        Ok(())
    }).map_err(LuaEngineError::Lua)?;
    rs.set("open_file", open_file).map_err(LuaEngineError::Lua)?;

    // radialsan.run_command(command: string)
    let run_cmd = lua.create_function(|_, command: String| {
        #[cfg(unix)]
        {
            std::process::Command::new("sh")
                .arg("-c")
                .arg(&command)
                .spawn()
                .map_err(|e| mlua::Error::RuntimeError(e.to_string()))?;
        }
        #[cfg(windows)]
        {
            std::process::Command::new("cmd")
                .arg("/C")
                .arg(&command)
                .spawn()
                .map_err(|e| mlua::Error::RuntimeError(e.to_string()))?;
        }
        Ok(())
    }).map_err(LuaEngineError::Lua)?;
    rs.set("run_command", run_cmd).map_err(LuaEngineError::Lua)?;

    // radialsan.mouse_click(button: string?, clicks: integer?)
    let mouse_click = lua.create_function(|_, (button, clicks): (Option<String>, Option<u64>)| {
        let params = serde_json::json!({
            "button": button.unwrap_or_else(|| "left".to_string()),
            "clicks": clicks.unwrap_or(1),
        });
        crate::actions::execute_action("mouseClick", &params)
            .map_err(|e| mlua::Error::RuntimeError(e.to_string()))?;
        Ok(())
    }).map_err(LuaEngineError::Lua)?;
    rs.set("mouse_click", mouse_click).map_err(LuaEngineError::Lua)?;

    // radialsan.clipboard(action: string) -- "copy", "cut", "paste"
    let clipboard = lua.create_function(|_, action: String| {
        let params = serde_json::json!({ "action": action });
        crate::actions::execute_action("clipboard", &params)
            .map_err(|e| mlua::Error::RuntimeError(e.to_string()))?;
        Ok(())
    }).map_err(LuaEngineError::Lua)?;
    rs.set("clipboard", clipboard).map_err(LuaEngineError::Lua)?;

    // radialsan.log(message: string)
    let log_fn = lua.create_function(|_, msg: String| {
        log::info!("[Lua] {}", msg);
        Ok(())
    }).map_err(LuaEngineError::Lua)?;
    rs.set("log", log_fn).map_err(LuaEngineError::Lua)?;

    globals.set("radialsan", rs).map_err(LuaEngineError::Lua)?;

    Ok(())
}

#[derive(Debug)]
pub enum LuaEngineError {
    Lua(mlua::Error),
    Io(std::io::Error),
}

impl std::fmt::Display for LuaEngineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LuaEngineError::Lua(e) => write!(f, "Lua error: {}", e),
            LuaEngineError::Io(e) => write!(f, "IO error: {}", e),
        }
    }
}

impl std::error::Error for LuaEngineError {}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_execute_simple_script() {
        let result = execute_lua_script("local x = 1 + 1");
        assert!(result.is_ok());
    }

    #[test]
    fn test_execute_with_api_available() {
        // Just verify the API table is created without calling OS-level functions
        let result = execute_lua_script(r#"
            assert(type(radialsan) == "table")
            assert(type(radialsan.send_key) == "function")
            assert(type(radialsan.send_text) == "function")
            assert(type(radialsan.delay) == "function")
            assert(type(radialsan.open_url) == "function")
            assert(type(radialsan.open_file) == "function")
            assert(type(radialsan.run_command) == "function")
            assert(type(radialsan.mouse_click) == "function")
            assert(type(radialsan.clipboard) == "function")
            assert(type(radialsan.log) == "function")
        "#);
        assert!(result.is_ok(), "API registration failed: {:?}", result.err());
    }

    #[test]
    fn test_execute_syntax_error() {
        let result = execute_lua_script("this is not valid lua!!!");
        assert!(result.is_err());
    }

    #[test]
    fn test_execute_runtime_error() {
        let result = execute_lua_script("error('test error')");
        assert!(result.is_err());
    }

    #[test]
    fn test_execute_log() {
        // log should not error
        let result = execute_lua_script(r#"radialsan.log("test message")"#);
        assert!(result.is_ok());
    }

    #[test]
    fn test_execute_delay_small() {
        let result = execute_lua_script("radialsan.delay(1)");
        assert!(result.is_ok());
    }

    #[test]
    fn test_execute_file_not_found() {
        let result = execute_lua_file(std::path::Path::new("/nonexistent/script.lua"));
        assert!(result.is_err());
    }
}
