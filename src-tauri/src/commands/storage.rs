use crate::models::*;

use serde::{Deserialize, Serialize};

use std::time::{SystemTime, UNIX_EPOCH};
use std::path::PathBuf;
use std::fs;

pub fn data_dir() -> PathBuf {
    let mut path = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("bubblewrap-launcher");
    fs::create_dir_all(&path).ok();

    path
}

pub fn games_path() -> PathBuf {
    data_dir().join("games.json")
}

pub fn settings_path() -> PathBuf {
    data_dir().join("settings.json")
}

pub fn load_games() -> GameStore {
    let path = games_path();

    if path.exists() {
        let raw = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&raw).unwrap_or_default()
    } else {
        GameStore::default()
    }
}

pub fn load_settings() -> AppSettings {
    let path = settings_path();

    if path.exists() {
        let raw = fs::read_to_string(&path).unwrap_or_default();
        serde_json::from_str(&raw).unwrap_or_default()
    } else {
        AppSettings::default()
    }
}

pub fn persist_games(store: &GameStore) -> Result<(), String> {
    let json = serde_json::to_string_pretty(store).map_err(|e| e.to_string())?;
    fs::write(games_path(), json).map_err(|e| e.to_string())
}

pub fn now_secs() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct GameStore {
    pub games: Vec<Game>,
}