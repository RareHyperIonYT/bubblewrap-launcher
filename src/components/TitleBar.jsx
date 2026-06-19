import { getCurrentWindow } from "@tauri-apps/api/window";

const appWindow = getCurrentWindow();

export default function TitleBar() {
    return (
        <div className="titlebar" data-tauri-drag-region>
            <div className="titlebar__brand" data-tauri-drag-region>
                <span className="titlebar__icon">
                    <BubbleIcon />
                </span>
                <span className="titlebar__name">Bubblewrap</span>
                <span className="titlebar__sub">Game Launcher</span>
            </div>

            <div className="titlebar__controls">
                <button className="titlebar__btn" title="Minimize" onClick={() => appWindow.minimize()}>
                    <MinimizeIcon />
                </button>
                <button className="titlebar__btn" title="Maximize" onClick={() => appWindow.toggleMaximize()}>
                    <MaximizeIcon />
                </button>
                <button className="titlebar__btn titlebar__btn--close" title="Close" onClick={() => appWindow.close()}>
                    <CloseIcon />
                </button>
            </div>
        </div>
    );
}

function BubbleIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <circle cx="7.5" cy="7.5" r="4.5" fill="currentColor" opacity="0.90" />
            <circle cx="16" cy="6.5" r="2.8" fill="currentColor" opacity="0.65" />
            <circle cx="5.5" cy="16.5" r="2.2" fill="currentColor" opacity="0.45" />
            <circle cx="14.5" cy="15" r="4" fill="currentColor" opacity="0.78" />
        </svg>
    );
}

function MinimizeIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1.5 5.5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

function MaximizeIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <rect x="1" y="1" width="9" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}
