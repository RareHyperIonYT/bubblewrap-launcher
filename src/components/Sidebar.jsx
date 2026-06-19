export default function Sidebar({ view, onViewChange, gameCount }) {
    return (
        <aside className="sidebar">
            <nav className="sidebar__nav">
                <SidebarItem
                    icon={<LibraryIcon />}
                    label="Library"
                    badge={gameCount}
                    active={view === "library"}
                    onClick={() => onViewChange("library")}
                />
                <SidebarItem
                    icon={<SettingsIcon />}
                    label="Settings"
                    active={view === "settings"}
                    onClick={() => onViewChange("settings")}
                />
            </nav>

            <div className="sidebar__footer">
                <div className="sidebar__version">Bubblewrap v0.1.0</div>{" "}
                {/* TODO: Make it so version isn't hardcoded. */}
            </div>
        </aside>
    );
}

function SidebarItem({ icon, label, badge, active, onClick }) {
    return (
        <button className={`sidebar__item${active ? " sidebar__item--active" : ""}`} onClick={onClick}>
            <span className="sidebar__icon">{icon}</span>
            <span className="sidebar__label">{label}</span>
            {badge !== undefined && <span className="sidebar__badge">{badge}</span>}
        </button>
    );
}

function LibraryIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="2" width="3.5" height="12" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="6.2" y="1" width="3.5" height="14" rx="1" fill="currentColor" />
            <rect x="11.5" y="2" width="3.5" height="12" rx="1" fill="currentColor" opacity="0.6" />
        </svg>
    );
}

function SettingsIcon() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
            <path
                d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8
           M3.4 3.4l1.28 1.28M11.32 11.32l1.28 1.28
           M3.4 12.6l1.28-1.28M11.32 4.68l1.28-1.28"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </svg>
    );
}
