# 🫧 Bubblewrap Game Launcher

A clean, fast game launcher for Linux built in [Rust](https://rust-lang.org/) with [Tauri](https://v2.tauri.app/) & [React](https://react.dev/).

It manages Linux, Windows (Wine/Proton), and AppImage games with sandboxing via [Firejail](https://github.com/netblue30/firejail).

## Status

> [!WARNING]
> Early development / unstable.
>
> Features and architecture may change frequently.

## Roadmap

See the full development roadmap here:

👉 [ROADMAP.md](./ROADMAP.md) 

### High-level milestones.

- **v0.2.x** → Library improvements + better game management UX.
- **v0.3.x** → Game detection + sandbox improvements.
- **v0.4.x** → Automation + configuration systems.
- **v0.5.x** → UX polish + personalisation features.
- **v1.0.0** → Stable release with full virtualisation, CLI, and snapshot/rollback system.

## Installation

> Not yet packaged for release.

## Development

### Prerequisites

| Tool     | Purpose                  |
|----------|--------------------------|
| Rust     | For building from source |
| Node.js  | For building from source |
| Firejail | Sandbox isolation        |
| Wine     | Windows game support     |

### Setup

Clone the repository:

```bash
git clone https://github.com/RareHyperIonYT/bubblewrap-launcher/
cd bubblewrap-launcher
```

Install dependencies:

```bash
npm install
```

Start the development build:

```bash
npm run tauri dev
```

This will:
- Start the React frontend.
- Start the Tauri backend.
- Open the desktop application window.

### Buildings

Create a production build:

```bash
npm run tauri build
```

Output will be generated in:
```
src-tauri/target/release/bundle
```