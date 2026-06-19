use super::storage::load_settings;
use crate::models::*;

use once_cell::sync::Lazy;

use nix::sys::signal::{kill, Signal};
use nix::unistd::Pid;

use std::process::{Child, Command};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use std::fs;

// Process tracking for running games if it wasn't obvious.
static RUNNING_GAMES: Lazy<Mutex<HashMap<String, Child>>> =
    Lazy::new(|| Mutex::new(HashMap::new()));

fn expand_tilde(path: &str) -> PathBuf {
    if path == "~" {
        return dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
    }

    if let Some(rest) = path.strip_prefix("~/") {
        return dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(rest);
    }

    PathBuf::from(path)
}

fn game_sandbox_path(game: &Game, settings: &AppSettings) -> PathBuf {
    expand_tilde(&settings.sandbox_root_path).join(&game.id)
}

fn apply_hardening(cmd: &mut Command, game: &Game) {
    if game.prevent_privilege_escalation {
        // Prevents the sandboxed process from gaining root-like privileges.
        cmd.arg("--noroot");

        // Prevents the process from using setuid/setgid-style privilege elevation paths,
        //  and reduce the chance of privilege escalation through helper binaries.
        cmd.arg("--nonewprivs");
    }

    if game.seccomp {
        // Enables syscall filtering to block dangerous kernel interfaces.
        cmd.arg("--seccomp");

        if game.seccomp_block_secondary {
            // Tightens seccomp further by blocking some secondary syscall mechanisms.
            //  This is far more restrictive, and may hurt compatibility in some cases.
            cmd.arg("--seccomp.block-secondary");
        }
    }

    if !game.allow_network_access {
        // Completely disable network access inside the sandbox.
        cmd.arg("--net=none");
    } else if game.strict_protocol_filter {
        // Limits networking to common socket families only.
        //  unix = local sockets, inet = IPv4, inet6 = IPv6.
        cmd.arg("--protocol=unix,inet,inet6");
    }

    if !game.allow_gpu_acceleration {
        // Disables direct 3D/GPU acceleration access.
        //  This may reduce graphics capability, but limits GPU-based attack surfaces.
        cmd.arg("--no3d");
    }

    if !game.allow_sensitive_device_access {
        // Mounts a restricted /dev tree so the game only sees a minimal set of devices.
        cmd.arg("--private-dev");

        // Hides optical drive devices.
        cmd.arg("--nodvd");

        // Hides TV tuner devices.
        cmd.arg("--notv");

        // Hide U2F / security key devices.
        cmd.arg("--nou2f");
    }

    if !game.allow_audio {
        // Hides sound devices.
        cmd.arg("--nosound");
    }

    if !game.allow_camera {
        // Hides video capture devices such as webcams and capture cards.
        cmd.arg("--novideo");
    }

    if game.drop_all_caps {
        // Strips all Linux capabilities from the process.
        //  This removes a large class of kernel-level privileges.
        cmd.arg("--caps.drop=all");
    }

    if game.memory_deny_write_execute {
        // Prevents memory pages from being both writable and executable.
        //  Helps reduce exploit techniques such as runtime code injection.
        cmd.arg("--memory-deny-write-execute");
    }

    if game.hide_machine_id {
        // Gives the sandbox its own machine-id instead of exposing the host's.
        //  Helps reduce host fingerprinting and identity leakage.
        cmd.arg("--machine-id");
    }

    if game.private_tmp {
        // Gives the sandbox a private temporary directory.
        //  Keeps temp files isolated from the host and other apps.
        cmd.arg("--private-tmp");
    }

    if game.private_cache {
        // Gives the sandbox its own empty cache directory.
        //  Prevents access to host cache data and keeps sandbox artefacts isolated.
        cmd.arg("--private-cache");
    }

    // Replaces /etc with a restricted version.
    //  Prevents reading sensitive system configurations or injecting malicious configurations.
    cmd.arg("--private-etc");

    // Prevents creation/use of additional Linux namespaces.
    cmd.arg("--restrict-namespaces");

    // Disables D-Bus access entirely (blocks desktop IPC messaging system).
    //  Prevents sandboxed apps from talking to system services via DBus.
    cmd.arg("--nodbus");

    // Limits number of processes to prevent fork bombs and runaway spawning.
    cmd.arg("--rlimit-nproc=150");

    if game.nogroups {
        // Drops supplementary group membership inside the sandbox.
        //  Reduces access inherited through host group permissions.
        cmd.arg("--nogroups");
    }
}

#[tauri::command]
pub async fn launch_game(game: Game) -> Result<(), String> {
    let settings = load_settings();
    let sandbox_dir = game_sandbox_path(&game, &settings);
    fs::create_dir_all(&sandbox_dir).map_err(|e| e.to_string())?;

    let mut cmd: Command;

    match game.game_type {
        GameType::Native | GameType::AppImage => {
            cmd = Command::new("firejail");

            if game.game_type == GameType::AppImage {
                cmd.arg("--appimage");
            }

            apply_hardening(&mut cmd, &game);

            if let Some(ref profile) = game.firejail_profile {
                cmd.arg(format!("--profile={}", profile));
            }

            cmd.arg(format!("--private={}", sandbox_dir.to_string_lossy()));
            cmd.arg(&game.executable_path);
        },

        GameType::Wine => {
            cmd = Command::new("firejail");

            let wine = game.wine_exe.as_deref()
                .filter(|s| !s.is_empty())
                .unwrap_or(&settings.wine_default_path);

            apply_hardening(&mut cmd, &game);

            if let Some(ref profile) = game.firejail_profile {
                cmd.arg(format!("--profile={}", profile));
            }

            cmd.arg(format!("--private={}", sandbox_dir.to_string_lossy()));

            cmd.env("WINEDLLOVERRIDES", "winemenubuilder.exe=d;mshtml=d;jscript=d;vbscript=d;wshom.ocx=d;oleacc=d");
            cmd.env("WINEDEBUG", "-all");
            cmd.env("BROWSER", "/bin/false");
            cmd.env("WINE_BROWSER", "/bin/false");
            cmd.env("WINE_DISABLE_MAKE_LINKS", "1");
            cmd.env("WINEARCH", "win64");

            cmd.arg(wine);
            cmd.arg(&game.executable_path);
        },
    }

    if let Some(ref args) = game.launch_args {
        for arg in args.split_whitespace() {
            cmd.arg(arg);
        }
    }

    let child = cmd.spawn().map_err(|e| format!("Failed to launch: {}", e))?;

    RUNNING_GAMES.lock().unwrap().insert(game.id.clone(), child);

    Ok(())
}

#[tauri::command]
pub fn stop_game(id: String) -> Result<(), String> {
    let mut map = RUNNING_GAMES.lock().unwrap();

    if let Some(child) = map.remove(&id) {
        let pid = Pid::from_raw(child.id() as i32);
        kill(pid, Signal::SIGTERM).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn is_game_running(id: String) -> bool {
    let mut map = RUNNING_GAMES.lock().unwrap();

    let should_remove = match map.get_mut(&id) {
        Some(child) => match child.try_wait() {
            Ok(None) => return true, // still running
            Ok(Some(_)) => true,     // exited
            Err(_) => true,          // probably gone
        },
        None => return false,
    };

    if should_remove {
        map.remove(&id);
    }

    false
}
