# Roadmap

## Current focus
- Keep the dynamic database model safe with stronger migrations, validation, backup compatibility, and auditability.
- Expand automated coverage around API behavior, restore flows, and critical user journeys.
- Improve external credibility with clearer release notes, changelog discipline, and roadmap visibility.

## Next
- Add a browser-based smoke test layer for critical UI flows such as create/edit/delete record, restore backup, and attachment management.
- Add richer migration helpers for multi-step data migrations and rollback-friendly dry runs.
- Expose database-level recent activity in the UI with filtering by entity type.
- Add API key scopes for narrower domains if needed (`records`, `attachments`, `webhooks`) on top of the current coarse scopes.
- Add retention and export controls for audit and API usage logs.

## Later
- Add background integrity checks and repair commands for large portfolios.
- Publish signed releases and a release checklist tied to the changelog.
- Introduce optional role-based access controls if the app evolves beyond single-operator usage.
