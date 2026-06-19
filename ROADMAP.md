# Roadmap

Bubblewrap is a Linux game launcher focused on speed, sandboxing, and a clean user experience.

This roadmap outlines the major milestones planned for this project.

> *Current Version:* `0.1.0`

## Pre-release development (v0.X)

### v0.2.0 : Library & UX Foundation

- Sandbox configuration presets based on game type and security level
- Manual sandbox controls for advanced users
- Library organisation system:
    - folders
    - collections
    - tags
    - favourites
    - pinned games
- Smart filtering (platform, favourites, tags)
- Library sorting (recently played, most played, A–Z, Z–A, manual)
- Drag-and-drop game import
- Desktop shortcut creation

### v0.3.0 : Game Discovery & Sandbox Architecture

- Auto-detect games from common installation locations
- Introduce sandbox backend abstraction layer
- Begin migration path from Firejail → Bubblewrap
- Implement initial Bubblewrap sandbox backend
- Improve UI transparency for sandbox behavior
- Library statistics & usage tracking (locally)

### v0.4.0 : Automation & Extensibility

- Rule-based sandbox configuration selection
- Custom launch hook system
- Custom sandbox preset creation
- Backup scheduling for:
    - settings
    - saves
    - metadata
- Self-hosted cloud sync hooks (user-managed sync)

### v0.5.0 : Personalization & Polish

- Per-game controller profiles
- Improved theming system for launcher
- Accessibility improvements
- Performance optimisations and UI polish pass

## Release development (vX.0)

### v1.0.0 : Stable Platform Release

#### Core Platform Stability

- Fully stable Bubblewrap-based sandbox backend
- Reliable game detection, import, and execution pipeline
- Stable configuration system.

#### Security & Isolation Model

- Consistent sandbox security profiles across all supported games
- Verified isolation behaviour with predictable rules
- Standardized permission and resource control system
- Documented security model and guarantees

#### Developer & Power User Tools

- CLI tool for launching sandboxed games directly
- Fully scriptable sandbox configuration system
- Export/import of configurations and presets

#### Ecosystem Features

- Mod manager integration framework (extensible, not hardcoded)
- Snapshot & rollback system for game environments
- Hardware compatibility detection system

#### UX & Platform Readiness

- Fully consistent UI/UX across all workflows
- Documentation complete (user, and developer)
