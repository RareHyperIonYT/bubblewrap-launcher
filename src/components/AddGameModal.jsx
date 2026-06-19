import { useState, useEffect, useRef } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { gameDefaults } from "../utility/configSchema.js";

// TODO: Split this file up into smaller files for better management.

function blankGame(settings) {
    return {
        id: "",
        name: "",
        game_type: "native",
        executable_path: "",
        cover_image: null,

        ...gameDefaults(settings),

        wine_exe: settings?.wine_default_path ?? "wine",
        launch_args: null,
        created_at: 0,
        last_played: null,
        play_time: 0,
    };
}

export default function AddGameModal({ editingGame, settings, onSubmit, onClose }) {
    const [tab, setTab] = useState("info");
    const [form, setForm] = useState(() => (editingGame ? { ...editingGame } : blankGame(settings)));

    // The SteamGridDB state, it's an absolute mess...
    //  TODO: Clean up SteamGridDB related code.
    const [sgdbResults, setSgdbResults] = useState([]);
    const [sgdbLoading, setSgdbLoading] = useState(false);
    const [sgdbGameId, setSgdbGameId] = useState(null);
    const [sgdbGrids, setSgdbGrids] = useState([]);
    const [gridsLoading, setGridsLoading] = useState(false);
    const [selectedGrid, setSelectedGrid] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [downloadingCvr, setDownloadingCvr] = useState(false);

    // Setting the preview cover when editing an existing game.
    //  TODO: Split SteamGridDB related from the rest of the code.
    useEffect(() => {
        if (editingGame?.cover_image) {
            try {
                setCoverPreview(convertFileSrc(editingGame.cover_image));
            } catch {
                /* no-op */
            }
        }
    }, [editingGame]);

    // Reference to prevent searching again after selecting something from the SGDB dropdown.
    const justPicked = useRef(false);

    // Searching SteamGridDB with debounce. Which is 420, nice.
    useEffect(() => {
        const apiKey = settings?.steamgriddb_api_key;

        if (!apiKey || !form.name.trim() || justPicked.current) {
            setSgdbResults([]);
            return;
        }

        const t = setTimeout(async () => {
            setSgdbLoading(true);

            try {
                const results = await invoke("search_steamgriddb_games", {
                    name: form.name,
                    apiKey,
                });

                setSgdbResults(results.slice(0, 7));
            } catch {
                /* ignore */
            } finally {
                setSgdbLoading(false);
            }
        }, 420);

        return () => clearTimeout(t);
    }, [form.name]);

    // TODO: Clean up functions.
    function set(key, value) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function pickSgdbGame(sgdbGame) {
        justPicked.current = true;

        set("name", sgdbGame.name);
        setSgdbResults([]);
        setSgdbGameId(sgdbGame.id);

        setGridsLoading(true);

        try {
            const grids = await invoke("get_steamgriddb_grids", {
                gameId: sgdbGame.id,
                apiKey: settings.steamgriddb_api_key,
            });

            setSgdbGrids(grids.slice(0, 16));
            setTab("covers");
        } catch {
            /* ignore */
        } finally {
            setGridsLoading(false);
        }

        setTimeout(() => {
            justPicked.current = false;
        }, 600);
    }

    async function pickGrid(grid) {
        if (downloadingCvr) return;

        setSelectedGrid(grid.url);
        setDownloadingCvr(true);

        try {
            const localPath = await invoke("download_cover", {
                url: grid.url,
                gameName: form.name,
            });

            set("cover_image", localPath);
            setCoverPreview(convertFileSrc(localPath));
        } catch (e) {
            console.error("Cover download failed:", e);
        } finally {
            setDownloadingCvr(false);
        }
    }

    async function browseExe() {
        try {
            const map = {
                wine: ["*.exe"],
                appimage: ["*.AppImage", "*.appimage"],
                native: [],
            };

            const filter = map[form.game_type] ?? [];

            const path = await invoke("open_dialog", {
                title: "Select Executable",
                filters: filter,
            });

            // const path = await openDialog({ multiple: false, title: "Select Executable" });
            if (path) set("executable_path", path);
        } catch {
            /* no-op */
        }
    }

    async function browseCoverFile() {
        try {
            const path = await invoke("open_dialog", {
                title: "Select Cover Image",
                filters: ["*.jpg", "*.jpeg", "*.png", "*.webp"],
            });

            if (path) {
                set("cover_image", path);
                setCoverPreview(convertFileSrc(path));
            }
        } catch {
            /* no-op */
        }
    }

    function handleSubmit() {
        if (!form.name.trim() || !form.executable_path.trim()) return;
        onSubmit({
            ...form,
            name: form.name.trim(),
            launch_args: form.launch_args?.trim() || null,
            firejail_profile: form.firejail_profile?.trim() || null,
            wine_prefix: form.wine_prefix?.trim() || null,
            wine_exe: form.wine_exe?.trim() || null,
        });
    }

    const hasApiKey = !!settings?.steamgriddb_api_key;
    const canSubmit = form.name.trim() && form.executable_path.trim();

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                {/* Header */}
                <div className="modal__header">
                    <h2 className="modal__title">{editingGame ? "Edit Game" : "Add Game"}</h2>
                    <button className="btn btn--ghost btn--icon" onClick={onClose}>
                        <XIcon />
                    </button>
                </div>

                {/* Tabs */}
                <div className="modal__tabs">
                    {[
                        { id: "info", label: "Game Info" },
                        { id: "covers", label: "Cover Art" },
                        { id: "advanced", label: "Advanced" },
                    ].map((t) => (
                        <button
                            key={t.id}
                            className={`modal__tab${tab === t.id ? " modal__tab--active" : ""}`}
                            onClick={() => setTab(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Body */}
                <div className="modal__body">
                    {tab === "info" && (
                        <InfoTab
                            editingGame={editingGame}
                            form={form}
                            set={set}
                            sgdbResults={sgdbResults}
                            sgdbLoading={sgdbLoading}
                            onPickSgdb={pickSgdbGame}
                            onBrowseExe={browseExe}
                            hasApiKey={hasApiKey}
                        />
                    )}
                    {tab === "covers" && (
                        <CoversTab
                            form={form}
                            coverPreview={coverPreview}
                            sgdbGrids={sgdbGrids}
                            gridsLoading={gridsLoading}
                            downloading={downloadingCvr}
                            selectedGrid={selectedGrid}
                            onPickGrid={pickGrid}
                            onBrowseFile={browseCoverFile}
                            hasApiKey={hasApiKey}
                            hasSgdbGame={!!sgdbGameId}
                        />
                    )}
                    {tab === "advanced" && <AdvancedTab form={form} set={set} />}
                </div>

                {/* Footer */}
                <div className="modal__footer">
                    <button className="btn btn--secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button className="btn btn--primary" onClick={handleSubmit} disabled={!canSubmit}>
                        {editingGame ? "Save Changes" : "Add Game"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function InfoTab({ editingGame, form, set, sgdbResults, sgdbLoading, onPickSgdb, onBrowseExe, hasApiKey }) {
    const [nameFocused, setNameFocused] = useState(false);
    const showDropdown = nameFocused && sgdbResults.length > 0;

    return (
        <div>
            {/* Name + SGDB autocomplete */}
            <div className="form-group">
                <label className="form-label">Game Name</label>
                <div style={{ position: "relative" }}>
                    <input
                        className={`form-input ${showDropdown ? "form-input--open-dropdown" : ""}`}
                        type="text"
                        placeholder="Enter game name…"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        autoFocus={!editingGame}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                    />
                    {sgdbLoading && (
                        <span
                            style={{
                                position: "absolute",
                                right: 12,
                                top: "50%",
                                transform: "translateY(-50%)",
                            }}
                        >
                            <div className="spinner spinner--sm" />
                        </span>
                    )}
                </div>

                {/* Inline dropdown */}
                <div className={`sgdb-results ${showDropdown ? "sgdb-results--open" : ""}`}>
                    {sgdbResults.map((g) => (
                        <div key={g.id} className="sgdb-result" onMouseDown={() => onPickSgdb(g)}>
                            {g.name}
                        </div>
                    ))}
                </div>

                {!hasApiKey && (
                    <p className="sgdb-hint">
                        Add a SteamGridDB API key in Settings to enable automatic artwork lookup.
                    </p>
                )}
            </div>

            {/* Game type */}
            <div className="form-group">
                <label className="form-label">Game Type</label>
                <div className="type-grid">
                    {[
                        { id: "native", emoji: "🐧", label: "Native Linux" },
                        { id: "appimage", emoji: "📦", label: "AppImage" },
                        { id: "wine", emoji: "🍷", label: "Windows (Wine)" },
                    ].map((t) => (
                        <button
                            key={t.id}
                            className={`type-option${form.game_type === t.id ? " type-option--active" : ""}`}
                            onClick={() => set("game_type", t.id)}
                        >
                            <span className="type-option__emoji">{t.emoji}</span>
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Executable */}
            <div className="form-group">
                <label className="form-label">
                    {form.game_type === "wine" ? "Windows Executable (.exe)" : "Executable Path"}
                </label>
                <div className="form-row">
                    <input
                        className="form-input"
                        type="text"
                        placeholder={
                            form.game_type === "appimage"
                                ? "/path/to/game.AppImage"
                                : form.game_type === "wine"
                                  ? "path/to/game.exe"
                                  : "/path/to/game"
                        }
                        value={form.executable_path}
                        onChange={(e) => set("executable_path", e.target.value)}
                        readOnly
                    />
                    <button className="btn btn--secondary" onClick={onBrowseExe}>
                        Browse
                    </button>
                </div>
            </div>
        </div>
    );
}

function CoversTab({
    form,
    coverPreview,
    sgdbGrids,
    gridsLoading,
    downloading,
    selectedGrid,
    onPickGrid,
    onBrowseFile,
    hasApiKey,
    hasSgdbGame,
}) {
    return (
        <div>
            {/* Current cover preview */}
            {coverPreview && (
                <div className="cover-selected-preview">
                    <img src={coverPreview} alt="Selected cover" />
                    <div className="cover-selected-info">
                        <p>Cover art selected ✓</p>
                        <p>{form.cover_image.split(/[\\/]/).pop()}</p>
                    </div>
                </div>
            )}

            {/* Manual file pick */}
            <div className="form-group">
                <label className="form-label">Upload from disk</label>
                <button className="btn btn--secondary" style={{ width: "100%" }} onClick={onBrowseFile}>
                    <FolderIcon /> Choose image file…
                </button>
            </div>

            <div className="divider" />

            {/* SGDB grid selection */}
            <div className="form-group">
                <label className="form-label">SteamGridDB — Portrait Art</label>

                {!hasApiKey ? (
                    <p className="sgdb-hint">
                        Configure a SteamGridDB API key in Settings to browse portrait cover art.
                    </p>
                ) : !hasSgdbGame ? (
                    <p className="sgdb-hint">
                        Search for your game on the <strong>Game Info</strong> tab and select it from the dropdown to
                        populate portrait covers here.
                    </p>
                ) : gridsLoading ? (
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            color: "var(--text-secondary)",
                            fontSize: 13,
                            padding: "12px 0",
                        }}
                    >
                        <div className="spinner spinner--sm" />
                        Fetching cover art from SteamGridDB…
                    </div>
                ) : sgdbGrids.length === 0 ? (
                    <p className="sgdb-hint">No portrait covers found for this game on SteamGridDB.</p>
                ) : (
                    <>
                        <div className="cover-grid" style={{ marginTop: 8 }}>
                            {sgdbGrids.map((grid) => (
                                <button
                                    key={grid.id}
                                    className={`cover-option${selectedGrid === grid.url ? " cover-option--selected" : ""}`}
                                    onClick={() => onPickGrid(grid)}
                                    disabled={downloading}
                                    title={`${grid.width}×${grid.height}${grid.style ? " · " + grid.style : ""}`}
                                >
                                    <img src={grid.thumb || grid.url} alt="" loading="lazy" />
                                </button>
                            ))}
                        </div>
                        {downloading && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    color: "var(--text-secondary)",
                                    fontSize: 13,
                                    marginTop: 12,
                                }}
                            >
                                <div className="spinner spinner--sm" />
                                Downloading cover art…
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function AdvancedTab({ form, set }) {
    return (
        <div>
            {/* Firejail */}
            <p className="adv-section-label">Sandboxing</p>

            <div className="toggle-row">
                <div>
                    <div className="toggle-info-label">Allow network access</div>
                    <div className="toggle-info-desc">Allow this game to have network access.</div>
                </div>
                <label className="toggle">
                    <input
                        type="checkbox"
                        checked={form.allow_network_access}
                        onChange={(e) => set("allow_network_access", e.target.checked)}
                    />

                    <span className="toggle-track" />
                </label>
            </div>

            <div className="toggle-row">
                <div>
                    <div className="toggle-info-label">Allow GPU acceleration</div>
                    <div className="toggle-info-desc">Allow this game to have access to your GPU.</div>
                </div>
                <label className="toggle">
                    <input
                        type="checkbox"
                        checked={form.allow_gpu_acceleration}
                        onChange={(e) => set("allow_gpu_acceleration", e.target.checked)}
                    />

                    <span className="toggle-track" />
                </label>
            </div>

            <div className="toggle-row">
                <div>
                    <div className="toggle-info-label">Isolate hardware access</div>
                    <div className="toggle-info-desc">
                        Restrict the games access to system devices
                        <br />
                        &nbsp;such as USBs, GPUs, and input devices.
                    </div>
                </div>
                <label className="toggle">
                    <input
                        type="checkbox"
                        checked={form.isolate_hardware}
                        onChange={(e) => set("isolate_hardware", e.target.checked)}
                    />

                    <span className="toggle-track" />
                </label>
            </div>

            <div className="toggle-row">
                <div>
                    <div className="toggle-info-label">Prevent privilege escalation</div>
                    <div className="toggle-info-desc">
                        Adds protection to stop sandboxed games from
                        <br />
                        &nbsp;gaining elevated system privileges.
                    </div>
                </div>
                <label className="toggle">
                    <input
                        type="checkbox"
                        checked={form.prevent_privilege_escalation}
                        onChange={(e) => set("prevent_privilege_escalation", e.target.checked)}
                    />
                    <span className="toggle-track" />
                </label>
            </div>

            <div className="toggle-row">
                <div>
                    <div className="toggle-info-label">Restrict system calls</div>
                    <div className="toggle-info-desc">
                        Limits which kernel operations the game can use to reduce exploit risk.
                        <br />
                        &nbsp;May have a negative effect on game compatibility.
                    </div>
                </div>
                <label className="toggle">
                    <input type="checkbox" checked={form.seccomp} onChange={(e) => set("seccomp", e.target.checked)} />
                    <span className="toggle-track" />
                </label>
            </div>

            {/* Wine (only if wine type) */}
            {form.game_type === "wine" && (
                <>
                    <div className="divider" />
                    <p className="adv-section-label">Wine Settings</p>

                    <div className="form-group">
                        <label className="form-label">Wine Executable</label>
                        <input
                            className="form-input"
                            type="text"
                            placeholder="wine"
                            value={form.wine_exe || ""}
                            onChange={(e) => set("wine_exe", e.target.value || null)}
                        />
                    </div>
                </>
            )}

            {/* Launch args */}
            <div className="divider" />
            <div className="form-group">
                <label className="form-label">Extra Launch Arguments</label>
                <input
                    className="form-input"
                    type="text"
                    placeholder="-windowed -nosplash"
                    value={form.launch_args || ""}
                    onChange={(e) => set("launch_args", e.target.value || null)}
                />
            </div>
        </div>
    );
}

function XIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}

function FolderIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 3.5h4l1.5 2H13v7H1V3.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        </svg>
    );
}
