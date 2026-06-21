mod commands;
mod models;
mod utility;

pub fn run() {
    // Tauri doesn't support Wayland due to problems upstream, this will allow it to run on Wayland.
    std::env::set_var("__GL_THREADED_OPTIMIZATIONS", "0");
    std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_games,
            commands::add_game,
            commands::update_game,
            commands::remove_game,
            commands::get_settings,
            commands::save_settings,
            commands::launch_game,
            commands::stop_game,
            commands::is_game_running,
            commands::search_steamgriddb_games,
            commands::get_steamgriddb_grids,
            commands::download_cover,
            commands::open_dialog
        ])
        .run(tauri::generate_context!())
        .expect("error while running bubblewrap");
}
