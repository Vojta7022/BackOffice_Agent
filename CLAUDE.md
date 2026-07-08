# COMM_backoffice-agent

RE:Agent is an AI assistant for real-estate agency backoffice work. It turns agency data into natural-language answers, charts, drafted emails, and operational reports.

## Metadata
- **Category:** commercial
- **Status:** active
- **Type:** code
- **Created:** 2026-04-10

## Purpose

RE:Agent is an AI assistant for real-estate agency backoffice work. It turns agency data into natural-language answers, charts, drafted emails, and operational reports.

## Inputs Processing

On session start:
1. Scan `inputs/` for files not listed in `inputs/.processed.md` when the project has an `inputs/` directory.
2. For each new file: extract content, create `knowledge/<filename-slug>.md`.
3. Log in `inputs/.processed.md` with timestamp.
4. Update `knowledge/README.md` navigation map.

If processing fails for any file, log as `(failed: reason)` and continue.

## Documentation Maintenance

Keep `README.md` current with user-visible functionality, setup, commands, configuration, storage, integrations, and troubleshooting. Never document real secret values.

## Domain Learnings

<!-- Append durable findings here as they are discovered. -->
