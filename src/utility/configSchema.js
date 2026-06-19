export const CONFIG_SCHEMA = {
    general: {
        title: "General",
        fields: ["minimize_on_launch", "sandbox_root_path"],
        items: {
            minimize_on_launch: {
                type: "boolean",
                default: false,
                label: "Minimize on Launch",
                description: "Minimize the launcher window when a game is started.",
                ui_component: "toggle",
            },
            sandbox_root_path: {
                type: "string",
                default: "~/.local/share/bubblewrap-launcher/sandboxes",
                placeholder: "~/.local/share/bubblewrap-launcher/sandboxes",
                label: "Sandbox Directory",
                description: "The directory where game sandboxes are created and stored.",
                ui_component: "text-input",
            },
        },
    },

    security_defaults: {
        title: "Security Defaults",
        groups: [
            {
                title: "Network & Device Access",
                fields: [
                    "allow_network_access_default",
                    "strict_protocol_filter_default",
                    "allow_gpu_acceleration_default",
                    "allow_audio_default",
                    "allow_camera_default",
                    "allow_sensitive_device_access_default",
                ],
            },
            {
                title: "Sandboxing & Isolation",
                fields: ["private_tmp_default", "private_cache_default", "hide_machine_id_default", "nogroups_default"],
            },
            {
                title: "Hardening & Compatibility",
                fields: [
                    "prevent_privilege_escalation_default",
                    "drop_all_caps_default",
                    "memory_deny_write_execute_default",
                    "seccomp_default",
                    "seccomp_block_secondary_default",
                ],
            },
        ],
        items: {
            allow_network_access_default: {
                type: "boolean",
                default: true,
                label: "Allow network access",
                description: "Grants games access to network connectivity, allowing online features.",
                game_field: "allow_network_access",
            },
            strict_protocol_filter_default: {
                type: "boolean",
                default: true,
                label: "Enforce strict protocol filtering",
                description: "Restricts sandboxed games to a limited set of network socket protocols.",
                game_field: "strict_protocol_filter",
            },
            allow_gpu_acceleration_default: {
                type: "boolean",
                default: true,
                label: "Allow GPU acceleration",
                description: "Grants games access to GPU hardware acceleration.",
                game_field: "allow_gpu_acceleration",
            },
            allow_audio_default: {
                type: "boolean",
                default: true,
                label: "Allow system audio access",
                description: "Grants games access to system audio devices.",
                game_field: "allow_audio",
            },
            allow_camera_default: {
                type: "boolean",
                default: false,
                label: "Allow system camera access",
                description: "Grants games access to system camera devices.",
                game_field: "allow_camera",
            },
            allow_sensitive_device_access_default: {
                type: "boolean",
                default: false,
                label: "Allow sensitive device access",
                description: "Enables access to sensitive system hardware devices.",
                game_field: "allow_sensitive_device_access",
            },

            private_tmp_default: {
                type: "boolean",
                default: true,
                label: "Isolated temporary storage",
                description: "Provides sandboxed games a private /tmp directory.",
                game_field: "private_tmp",
            },
            private_cache_default: {
                type: "boolean",
                default: true,
                label: "Isolated cache storage",
                description: "Provides sandboxed games with a private .cache directory.",
                game_field: "private_cache",
            },
            hide_machine_id_default: {
                type: "boolean",
                default: true,
                label: "Hide system identity",
                description:
                    "Assigns sandboxed games a virtual machine identity by masking the host system's machine ID.",
                game_field: "hide_machine_id",
            },
            nogroups_default: {
                type: "boolean",
                default: true,
                label: "Restrict group privileges",
                description: "Removes supplementary group memberships from sandboxed games.",
                game_field: "nogroups",
            },

            prevent_privilege_escalation_default: {
                type: "boolean",
                default: true,
                label: "Prevent privilege escalation",
                description: "Prevents sandboxed games from gaining elevated privileges.",
                game_field: "prevent_privilege_escalation",
            },
            drop_all_caps_default: {
                type: "boolean",
                default: true,
                label: "Drop all capabilities",
                description: "Removes all Linux capabilities from the sandboxed process.",
                game_field: "drop_all_caps",
            },
            memory_deny_write_execute_default: {
                type: "boolean",
                default: false,
                label: "Enforce W^X Memory Policy",
                description: "Prevents memory regions from being both writable and executable.",
                game_field: "memory_deny_write_execute",
            },
            seccomp_default: {
                type: "boolean",
                default: true,
                label: "Enable syscall filtering",
                description: "Enables system call filtering to restrict access to kernel interfaces.",
                game_field: "seccomp",
            },
            seccomp_block_secondary_default: {
                type: "boolean",
                default: false,
                label: "Use stricter syscall filtering",
                description: "Applies stricter system call filtering by blocking additional secondary syscall paths.",
                game_field: "seccomp_block_secondary",
            },
        },
    },

    wine: {
        title: "Wine",
        fields: ["wine_default_path"],
        items: {
            wine_default_path: {
                type: "string",
                default: "wine",
                placeholder: "wine",
                label: "Default Wine Executable",
                description: "Path to the Wine binary. Leave as `wine` to use system default.",
                ui_component: "text-input",
            },
        },
    },

    api_keys: {
        title: "API Keys",
        fields: ["steamgriddb_api_key", "itchio_api_key"],
        items: {
            steamgriddb_api_key: {
                type: "string",
                default: null,
                placeholder: "Paste your API key…",
                label: "SteamGridDB API Key",
                description:
                    "Required for automatic portrait cover art. [Get your API key →](https://www.steamgriddb.com/profile/preferences/api)",
                ui_component: "password-input",
            },
        },
    },
};

export function appDefaults() {
    const defaults = {};

    for (const section of Object.values(CONFIG_SCHEMA)) {
        const items = getSectionItems(section);

        for (const [key, field] of Object.entries(items)) {
            defaults[key] = field.default;
        }
    }

    return defaults;
}

function getSectionItems(section) {
    const items = {};

    if (section.items) {
        Object.assign(items, section.items);
    }

    if (section.groups) {
        for (const group of section.groups) {
            if (group.items) {
                Object.assign(items, group.items);
            }
        }
    }

    return items;
}

export function gameDefaults(settings = {}) {
    const defaults = {};

    for (const section of Object.values(CONFIG_SCHEMA)) {
        const items = getSectionItems(section);

        for (const field of Object.values(items)) {
            if (!field.game_field) continue;

            defaults[field.game_field] = settings[field.game_field] ?? field.default;
        }
    }

    return defaults;
}
