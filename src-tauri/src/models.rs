use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum GameType {
    Native, AppImage, Wine,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Game {
    pub id: String,
    pub name: String,
    pub game_type: GameType,
    pub executable_path: String,
    pub cover_image: Option<String>,
    pub firejail_profile: Option<String>,

    pub allow_network_access: bool,
    pub strict_protocol_filter: bool,
    pub allow_gpu_acceleration: bool,
    pub allow_audio: bool,
    pub allow_camera: bool,
    pub allow_sensitive_device_access: bool,

    pub private_tmp: bool,
    pub private_cache: bool,
    pub hide_machine_id: bool,
    pub nogroups: bool,

    pub prevent_privilege_escalation: bool,
    pub drop_all_caps: bool,
    pub memory_deny_write_execute: bool,
    pub seccomp: bool,
    pub seccomp_block_secondary: bool,

    pub wine_exe: Option<String>,
    pub launch_args: Option<String>,
    pub created_at: u64,
    pub last_played: Option<u64>,
    pub play_time: u64
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppSettings {
    pub steamgriddb_api_key: Option<String>,
    pub wine_default_path: String,
    pub firejail_default_profile: Option<String>,

    pub allow_network_access_default: bool,
    pub strict_protocol_filter_default: bool,
    pub allow_gpu_acceleration_default: bool,
    pub allow_audio_default: bool,
    pub allow_camera_default: bool,
    pub allow_sensitive_device_access_default: bool,

    pub private_tmp_default: bool,
    pub private_cache_default: bool,
    pub hide_machine_id_default: bool,
    pub nogroups_default: bool,

    pub prevent_privilege_escalation_default: bool,
    pub drop_all_caps_default: bool,
    pub memory_deny_write_execute_default: bool,
    pub seccomp_default: bool,
    pub seccomp_block_secondary_default: bool,

    pub minimize_on_launch: bool,
    pub sandbox_root_path: String
}

impl Default for AppSettings {
    fn default() -> Self {
        AppSettings {
            steamgriddb_api_key: None,
            wine_default_path: "wine".to_string(),
            firejail_default_profile: None,

            allow_network_access_default: true,
            strict_protocol_filter_default: true,
            allow_gpu_acceleration_default: true,
            allow_audio_default: true,
            allow_camera_default: false,
            allow_sensitive_device_access_default: false,

            private_tmp_default: true,
            private_cache_default: true,
            hide_machine_id_default: true,
            nogroups_default: true,

            prevent_privilege_escalation_default: true,
            drop_all_caps_default: true,
            memory_deny_write_execute_default: false,
            seccomp_default: true,
            seccomp_block_secondary_default: false,

            minimize_on_launch: false,
            sandbox_root_path: "~/.local/share/bubblewrap-launcher/sandboxes".to_string()
        }
    }
}