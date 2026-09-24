# Roadmap

The living plan. Reviewed regularly; issues track the detail.

### Now
- Harden the Talent Algorithm: confidence modeling, evidence links, rounding correctness.
- Reliability under load: rate limiting and persistent session state for the Challenge.
- Finish the private-media path: upload, playback and the backfill of legacy absolute URLs ([ADR-0005](./docs/adr/0005-media-access-decided-by-the-database.md)).
- An admin surface for the operational controls now in the schema: the maintenance flag, the spend ledger, and a configuration read-back endpoint.

### Next
- AI Internship: multi-week deliverables with a talent profile that compounds.
- Expert Review: human certification layer on top of AI evidence. Availability and its fail-closed guard are in ([ADR-0004](./docs/adr/0004-availability-checks-that-gate-payment-fail-closed.md)); the reviewer surface and checkout are not built.
- Reporting on public surfaces: a report re-opens the existing moderation record rather than creating a second queue. Needs the moderation record first.

### Later
- Institution mode: cohorts, dashboards, exportable evidence.
- The simulation environment itself as a first-class product.

Have an idea? Open an [RFC](./docs/product/rfc-process.md).
