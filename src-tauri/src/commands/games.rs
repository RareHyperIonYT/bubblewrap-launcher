use super::storage::{load_games, now_secs, persist_games};
use crate::models::*;
use uuid::Uuid;

#[tauri::command]
pub fn get_games() -> Result<Vec<Game>, String> {
    Ok(load_games().games)
}

#[tauri::command]
pub fn add_game(mut game: Game) -> Result<Game, String> {
    let mut store = load_games();
    game.id = Uuid::new_v4().to_string();
    game.created_at = now_secs();
    game.play_time = 0;

    store.games.push(game.clone());
    persist_games(&store)?;

    Ok(game)
}

#[tauri::command]
pub fn update_game(game: Game) -> Result<Game, String> {
    let mut store = load_games();

    if let Some(idx) = store.games.iter().position(|g| g.id == game.id) {
        store.games[idx] = game.clone();
        persist_games(&store)?;
        Ok(game)
    } else {
        Err("Game not found".into())
    }
}

#[tauri::command]
pub fn remove_game(id: String) -> Result<(), String> {
    let mut store = load_games();
    store.games.retain(|g| g.id != id);
    persist_games(&store)
}
