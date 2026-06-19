import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import TitleBar from "./components/TitleBar";
import Sidebar from "./components/Sidebar";
import LibraryView from "./components/LibraryView";
import Settings from "./components/Settings";
import AddGameModal from "./components/AddGameModal";

import { appDefaults } from "./utility/configSchema.js";

export default function App() {
    const [games, setGames] = useState([]);
    const [settings, setSettings] = useState(appDefaults());
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState("library");
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);

    const [toast, setToast] = useState(null);
    const [toastClosing, setToastClosing] = useState(false);

    const bootstrap = useCallback(async () => {
        try {
            const [games, settings] = await Promise.all([invoke("get_games"), invoke("get_settings")]);

            setGames(games);
            setSettings(settings);
        } catch (e) {
            notify(`Failed to load: ${e}`, "err");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        bootstrap().then((_) => console.log("loaded :3"));
    }, [bootstrap]);

    /* Notifications */
    function notify(message, type = "ok") {
        setToast({ message, type });
        setToastClosing(false);

        setTimeout(() => {
            setToastClosing(true);

            setTimeout(() => {
                setToast(null);
                setToastClosing(false);
            }, 220);
        }, 3200);
    }

    /* Game CRUD */
    async function handleAdd(gameData) {
        try {
            console.log(gameData);
            const created = await invoke("add_game", { game: gameData });
            setGames((prev) => [...prev, created]);
            closeModal();
            notify(`"${created.name}" added to library`);
        } catch (e) {
            notify(`Failed to add: ${e}`, "err");
        }
    }

    async function handleUpdate(gameData) {
        try {
            const updated = await invoke("update_game", { game: gameData });
            setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
            closeModal();
            notify(`Updated "${updated.name}"`);
        } catch (e) {
            notify(`Failed to update: ${e}`, "err");
        }
    }

    async function handleRemove(id) {
        const name = games.find((g) => g.id === id)?.name ?? "Game";
        try {
            await invoke("remove_game", { id });
            setGames((prev) => prev.filter((g) => g.id !== id));
            notify(`"${name}" removed`);
        } catch (e) {
            notify(`Failed to remove: ${e}`, "err");
        }
    }

    async function handleLaunch(game) {
        try {
            await invoke("launch_game", { game });
            if (settings.minimize_on_launch) {
                await getCurrentWindow().minimize();
            }
            notify(`Launched "${game.name}"`);
        } catch (e) {
            notify(`Failed to launch "${game.name}": ${e}`, "err");
        }
    }

    async function handleStop(game) {
        try {
            await invoke("stop_game", { id: game.id });
            notify(`Stopped "${game.name}"`);
        } catch (e) {
            notify(`Failed to stop "${game.name}": ${e}`, "err");
        }
    }

    /* Settings */
    async function handleSaveSettings(newSettings) {
        try {
            await invoke("save_settings", { settings: newSettings });
            setSettings(newSettings);
            notify("Settings saved");
        } catch (e) {
            notify(`Failed to save settings: ${e}`, "err");
        }
    }

    /* Modal Helpers */
    function openAdd() {
        setEditing(null);
        setModalOpen(true);
    }

    function openEdit(game) {
        setEditing(game);
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditing(null);
    }

    /* Rendering */
    return (
        <div className="app">
            <TitleBar />

            <div className="app-body">
                <Sidebar view={view} onViewChange={setView} gameCount={games.length} />

                <main className="main-content">
                    {loading ? (
                        <div className="loading">
                            <div className="spinner" />
                            <span>Loading library…</span>
                        </div>
                    ) : view === "library" ? (
                        <LibraryView
                            games={games}
                            onAdd={openAdd}
                            onEdit={openEdit}
                            onRemove={handleRemove}
                            onLaunch={handleLaunch}
                            onStop={handleStop}
                        />
                    ) : (
                        <Settings settings={settings} onSave={handleSaveSettings} />
                    )}
                </main>
            </div>

            {modalOpen && (
                <AddGameModal
                    editingGame={editing}
                    settings={settings}
                    onSubmit={editing ? handleUpdate : handleAdd}
                    onClose={closeModal}
                />
            )}

            {toast && (
                <div className={`toast toast--${toast.type} ${toastClosing ? "toast--exit" : ""}`}>
                    {toast.type === "ok" ? "✓" : "✗"} {toast.message}
                </div>
            )}
        </div>
    );
}
