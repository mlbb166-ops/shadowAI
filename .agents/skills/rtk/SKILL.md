---
name: rtk
description: Rust Token Killer (RTK) tool guide and shell output compression protocol. Optimizes command output, compresses logs, filters noise, and saves 60-90% token consumption during development.
---

# Rust Token Killer (RTK) Protocol

High-performance output optimizer and token efficiency tool for agentic workflows.

## Principles

1. **Intelligent Command Output Compression:** Filter noise, banners, and redundant output from shell commands (`git`, `npm`, `cargo`, `pytest`, `curl`).
2. **Signal-to-Noise Focus:** When running long commands, focus on return codes, error lines, and key metrics. Do not dump thousand-line outputs unless explicitly debugging.
3. **Paging & Truncation Control:** Use targeted grep/slice when inspecting large files to avoid flooding the context window.
4. **Fast Tool Interception:** Leverage CLI proxy capabilities (`rtk <command>`) or direct command flag filtering (`--quiet`, `--compact`) where available.
