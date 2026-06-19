import { useState, useMemo } from "react";
import { convertFileSrc } from "@tauri-apps/api/core";

export default function GameCard({ game, isRunning, onLaunch, onStop, onEdit, onRemove }) {
    const [coverLoaded, setCoverLoaded] = useState(true);
    const [_coverError, setCoverError] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const coverSrc = useMemo(() => {
        if (!game.cover_image) return null;

        if (game.cover_image.startsWith("asset://") || game.cover_image.startsWith("http://asset.localhost/")) {
            return game.cover_image;
        }

        return convertFileSrc(game.cover_image);
    }, [game.cover_image]);

    const typeEmoji = { native: "🐧", appimage: "📦", wine: "🍷" }[game.game_type] ?? "🎮";
    const typeLabel = { native: "Linux", appimage: "AppImage", wine: "Windows" }[game.game_type] ?? "?";

    function handleDelete(e) {
        e.stopPropagation();

        if (confirming) {
            onRemove();
        } else {
            setConfirming(true);
            setTimeout(() => setConfirming(false), 2200);
        }
    }

    function handlePlayClick(e) {
        e.stopPropagation();

        if (isRunning) {
            onStop?.(game);
        } else {
            onLaunch?.(game);
        }
    }

    return (
        <div className="game-card">
            {/* Art */}
            <div className="game-card__art">
                {coverSrc ? (
                    <img
                        className={`game-card__cover${coverLoaded ? " loaded" : ""}`}
                        key={coverSrc}
                        src={coverSrc}
                        alt={game.name}
                        onLoad={() => setCoverLoaded(true)}
                        onError={() => setCoverError(true)}
                    />
                ) : (
                    <div className="game-card__placeholder">
                        <span className="game-card__placeholder-icon">{typeEmoji}</span>
                        <span className="game-card__placeholder-name">{game.name}</span>
                    </div>
                )}

                {/* Hover overlay */}
                <div className="game-card__overlay">
                    <button
                        className="game-card__play"
                        title={isRunning ? "Stop" : "Launch"}
                        onClick={(e) => {
                            handlePlayClick(e);
                        }}
                    >
                        {isRunning ? <StopIcon /> : <PlayIcon />}
                    </button>
                </div>

                {/* Top-right actions */}
                <div className="game-card__actions">
                    <button
                        className="game-card__action"
                        title="Edit"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                    >
                        <EditIcon />
                    </button>
                    <button
                        className={`game-card__action game-card__action--del${confirming ? " confirming" : ""}`}
                        title={confirming ? "Click again to confirm" : "Remove"}
                        onClick={handleDelete}
                    >
                        {confirming ? <TrashConfirmIcon /> : <TrashIcon />}
                    </button>
                </div>
            </div>

            {/* Info */}
            <div className="game-card__info">
                <span className="game-card__name">{game.name}</span>

                <div className="game-card__tags">
                    <span className={`tag tag--${game.game_type}`}>{typeLabel}</span>

                    {game.allow_network_access && (
                        <span className="tag tag--network" title="Game has network access">
                            Network
                        </span>
                    )}
                    {!game.prevent_privilege_escalation && (
                        <span className="tag tag--isolated" title="Could potentially escalate privileges">
                            Escalation
                        </span>
                    )}
                    {game.allow_gpu_acceleration && (
                        <span className="tag tag--isolated" title="Game has access to your GPU.">
                            GPU
                        </span>
                    )}
                    {!game.isolate_hardware && (
                        <span className="tag tag--isolated" title="idk">
                            Unrestricted
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

function PlayIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5.5 3.5l10 5.5-10 5.5V3.5z" fill="currentColor" />
        </svg>
    );
}

function StopIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="5" y="5" width="8" height="8" fill="currentColor" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
                d="M8.5 1.5l2 2L3.5 10.5H1.5v-2L8.5 1.5z"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
                d="M1.5 3h9M4.5 3V2h3v1M2.5 3l.75 7.5h5.5L9.5 3"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function TrashConfirmIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
                d="M2 6l2.8 3L10 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
