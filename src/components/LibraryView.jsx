import { useState, useMemo, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import GameCard from "./GameCard";

const FILTERS = [
    { id: "all", label: "All" },
    { id: "native", label: "Native" },
    { id: "appimage", label: "AppImage" },
    { id: "wine", label: "Wine" },
];

export default function LibraryView({ games, onAdd, onEdit, onRemove, onLaunch, onStop }) {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [running, setRunning] = useState({});

    const visible = useMemo(() => {
        return games.filter((g) => {
            const matchType = filter === "all" || g.game_type === filter;
            const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
            return matchType && matchSearch;
        });
    }, [games, filter, search]);

    useEffect(() => {
        const t = setInterval(async () => {
            const updates = {};

            for (const g of games) {
                updates[g.id] = await invoke("is_game_running", { id: g.id });
            }

            setRunning(updates);
        }, 1000);

        return () => clearInterval(t);
    }, [games]);

    return (
        <div className="library">
            {/* Header */}
            <div className="library__header">
                <div className="library__header-top">
                    <h1 className="library__title">
                        Library
                        <span>
                            {games.length} game{games.length !== 1 ? "s" : ""}
                        </span>
                    </h1>
                    <button className="btn btn--primary" onClick={onAdd}>
                        <PlusIcon /> Add Game
                    </button>
                </div>

                <div className="library__toolbar">
                    <div className="search">
                        <SearchIcon className="search__icon" />
                        <input
                            type="text"
                            placeholder="Search games…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="filters">
                        {FILTERS.map((f) => (
                            <button
                                key={f.id}
                                className={`filter-btn${filter === f.id ? " filter-btn--active" : ""}`}
                                onClick={() => setFilter(f.id)}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            {visible.length === 0 ? (
                <EmptyState hasGames={games.length > 0} filtered={!!(search || filter !== "all")} onAdd={onAdd} />
            ) : (
                <div className="game-grid">
                    <div className="game-grid__inner">
                        {visible.map((g) => (
                            <GameCard
                                key={g.id}
                                game={g}
                                isRunning={!!running[g.id]}
                                onLaunch={() => onLaunch(g)}
                                onStop={() => onStop(g)}
                                onEdit={() => onEdit(g)}
                                onRemove={() => onRemove(g.id)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function EmptyState({ filtered, onAdd }) {
    if (filtered) {
        return (
            <div className="empty">
                <h2 className="empty__title">No games found</h2>
                <p className="empty__desc">Try a different search term or filter.</p>
            </div>
        );
    }

    return (
        <div className="empty">
            <h2 className="empty__title">Your library is empty</h2>

            <p className="empty__desc">
                Add your first game to get started. Bubblewrap can launch native Linux games, AppImages, and Windows
                games.
            </p>

            <button className="btn btn--primary" onClick={onAdd} style={{ marginTop: 8 }}>
                <PlusIcon /> Add Your First Game
            </button>
        </div>
    );
}

function PlusIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
    );
}

function SearchIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
    );
}
