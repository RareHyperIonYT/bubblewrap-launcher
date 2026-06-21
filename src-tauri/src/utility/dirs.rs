use std::env;
use std::path::PathBuf;

pub fn home_dir() -> Option<PathBuf> {
    env::var_os("HOME").map(PathBuf::from)
}

#[cfg(target_os = "linux")]
pub fn data_dir() -> Option<PathBuf> {
    if let Some(xdg) = env::var_os("XDG_DATA_HOME") {
        let path = PathBuf::from(xdg);

        if !path.as_os_str().is_empty() {
            return Some(path);
        }
    }

    home_dir().map(|home| home.join(".local/share"))
}