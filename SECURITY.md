# Security Policy

## Project Status

> [!WARNING]
> Bubblewrap Launcher is in early, unstable development. The sandboxing model is **not yet hardened** and should not be relied on as a security boundary against hostile or utrusted software.

Sandbox isolation is a core goal of this project (see [ROADMAP.md](./ROADMAP.md)), but until the dedicated Bubblewrap-based sandbox backend lands and is verified in v1.0.0, treat any sandboxing as **best-effort process isolation**, not a hard security guarantee. Don't use this launcher to run software you don't trust at all.

## Reporting a vulnerability

This project doesn't have a dedicated security contact or private disclosure process. For now:

- Open a regular [GitHub Issue](https://github.com/RareHyperIonYT/bubblewrap-launcher/issues) describing the vulnerability.
- Tag the issue appropriately with the `Security` tag.
- Include:
    - What the issue is and where it lives.
    - Steps to reproduce.
    - Potential impact (e.g. sandbox escape, file access outside expected scope, privilege escalation).
    - Your OS and relevant tool versions (Rust, Node, Firejail, and Wine if applicable).

If the project grows a larger user base, this policy will be updated to support private disclosure.

## Supported versions

This project is pre-1.0 and has no formal support matrix yet. Only the latest commit on the default branch is considered for fixes.

| Version | Supported       |
|---------|-----------------|
| `0.1.x` | ✅ (latest only) |

## Scope

Security reports relevant to this project generally fall into:

- Sandbox/isolation bypasses.
- Unsafe handling of game files, imports, or Wine/Proton prefixes.
- Supply chain issues (e.g. dependency vulnerabilities with real-world exploitability).

General bugs, crashes, or UX issues that aren't security-relevant should go through normal issue reports as per [CONTRIBUTING.md](./CONTRIBUTING.md), not this policy.

## Disclosure expectations

This is a volunteer-driven, early-stage project. There's no guaranteed response time or bug bounty.

Reports will be reviewed and adressed on a best-effort basis as the project and its sandboxing architecture mature.