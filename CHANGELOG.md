# Changelog

All notable changes to this project will be documented in this file.

## [0.0.3] - 2026-03-08

### Changed
- Aligned the internal app version, README version reference, and public release numbering with the GitHub release flow.

## [0.0.2] - 2026-03-08

### Added
- Database templates for photo archive, bibliography, inventory, simple CRM, project management, and research datasets.
- Persistent advanced filters with grouped `AND`/`OR` logic, date ranges, empty/non-empty rules, saved view reuse, multi-sort, and grouping by property.
- Stronger attachment workflows with multi-drag-and-drop uploads, larger previews, metadata, quick preview, sidebar browser, and richer filters.
- Expanded analytics with category counts, distributions, null summaries, tag frequencies, timelines, and CSV export.
- Structured schema migrations through `schema_migrations`.
- Activity logging for databases, records, attachments, API keys, backups, and restores.
- API keys with optional expiry, scopes, and per-key usage traces.
- Integration coverage for API keys, validation, attachments, templates, filters, analytics, and backup/restore flows.

### Changed
- Full portfolio backups now generate a consistent SQLite snapshot instead of packaging the live WAL database file directly.
- Database restore remaps property IDs inside property configs and saved views to preserve compatibility across imports.
- Record and property writes now validate URLs, dates, times, rollup configs, and relation targets before persisting.
- Relation cleanup now removes orphaned references when records or referenced configs disappear.

### Docs
- Added roadmap and release notes.
- Documented testing, release/versioning, audit history, and API key security features.
