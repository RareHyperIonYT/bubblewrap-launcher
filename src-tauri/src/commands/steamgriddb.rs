use std::fs;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use super::storage::data_dir;

#[tauri::command]
pub async fn search_steamgriddb_games(name: String, api_key: String) -> Result<Vec<SteamGridDBGame>, String> {
    if api_key.is_empty() {
        return Err("No SteamGridDB API key configured".into());
    }

    #[derive(serde::Deserialize)]
    struct Response {
        success: bool,
        data: Vec<SteamGridDBGame>
    }
    
    let client = reqwest::Client::new();
    let url = format!("https://www.steamgriddb.com/api/v2/search/autocomplete/{}", urlencoding::encode(&name));

    let response = client.get(&url)
        .header("Authorization", format!("Bearer {}", api_key)).send()
        .await.map_err(|e| e.to_string())?;
    
    let body: Response = response.json().await.map_err(|e| e.to_string())?;

    if body.success {
        Ok(body.data)
    } else {
        Err("SteamGridDB search failed".into())
    }
}

#[tauri::command]
pub async fn get_steamgriddb_grids(game_id: u64, api_key: String) -> Result<Vec<SteamGridDBGrid>, String> {
    if api_key.is_empty() {
        return Err("No SteamGridDB API key configured".into());
    }

    #[derive(serde::Deserialize)]
    struct Response {
        success: bool,
        data: Vec<GridItem>,
    }

    #[derive(serde::Deserialize)]
    struct GridItem {
        id: u64,
        url: String,
        thumb: String,
        width: u32,
        height: u32,
        style: Option<String>,
    }
    
    let client = reqwest::Client::new();
    let url = format!("https://www.steamgriddb.com/api/v2/grids/game/{}?dimensions=600x900,342x482,660x930", game_id);

    let response = client.get(&url)
        .header("Authorization", format!("Bearer {}", api_key)).send()
        .await.map_err(|e| e.to_string())?;

    let body: Response = response.json().await.map_err(|e| e.to_string())?;
    
    if body.success {
        Ok(body.data
            .into_iter()
            .map(|g| SteamGridDBGrid {
                id: g.id, url: g.url, thumb: g.thumb,
                width: g.width, height: g.height,
                style: g.style,
            }).collect())
    } else {
        Err("Failed to fetch grids".into())
    }
}

#[tauri::command]
pub async fn download_cover(url: String, game_name: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    
    let bytes = client.get(&url).send()
        .await.map_err(|e| e.to_string())?.bytes()
        .await.map_err(|e| e.to_string())?;

    let covers_dir = data_dir().join("covers");
    fs::create_dir_all(&covers_dir).map_err(|e| e.to_string())?;

    let ext = if url.contains(".png") {
        "png"
    } else if url.contains(".webp") {
        "webp"
    } else {
        "jpg"
    };

    let safe: String = game_name
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '-' { c } else { '_' })
        .collect();

    let uid = &Uuid::new_v4().to_string()[..8];
    let filename = format!("{}_{}.{}", safe, uid, ext);
    let filepath = covers_dir.join(&filename);

    fs::write(&filepath, &bytes).map_err(|e| e.to_string())?;
    Ok(filepath.to_string_lossy().to_string())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SteamGridDBGame {
    pub id: u64,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SteamGridDBGrid {
    pub id: u64,
    pub url: String,
    pub thumb: String,
    pub width: u32,
    pub height: u32,
    pub style: Option<String>,
}