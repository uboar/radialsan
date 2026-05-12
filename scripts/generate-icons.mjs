import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const iconsDir = join(root, "src-tauri", "icons");
const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

function runTauriIcon(args) {
  execFileSync(pnpm, ["exec", "tauri", "icon", ...args], {
    cwd: root,
    stdio: "inherit",
  });
}

runTauriIcon(["assets/app-icon.svg", "-o", "src-tauri/icons"]);

// Keep the repo's existing desktop icon set. The Tauri v2 default generator
// also emits mobile/store assets that are not referenced by tauri.conf.json.
runTauriIcon(["assets/app-icon.svg", "-o", "src-tauri/icons", "--png", "256"]);

for (const name of [
  "64x64.png",
  "icon.png",
  "StoreLogo.png",
  "Square30x30Logo.png",
  "Square44x44Logo.png",
  "Square71x71Logo.png",
  "Square89x89Logo.png",
  "Square107x107Logo.png",
  "Square142x142Logo.png",
  "Square150x150Logo.png",
  "Square284x284Logo.png",
  "Square310x310Logo.png",
  "android",
  "ios",
]) {
  rmSync(join(iconsDir, name), { force: true, recursive: true });
}
