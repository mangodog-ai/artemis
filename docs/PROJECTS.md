# Artemis project home

The root route `/` is the entry point for the app collection. It lists each project in `lib/projects.js` and links to that project's front page. Keep product-specific landing pages under a named route so the launcher remains a stable home for the collection.

## Current workspaces

- **Life Insurance** — `/life-insurance` is its landing page. Its existing sign-in, comparison, admin and quote-lab routes remain at their current URLs for now.
- **Artemis Cycling** — `/cycling` is its landing page and owns the analysis, forecast and activity pages below that route. See [Cycling architecture](./CYCLING_ARCHITECTURE.md).
- **Project 3** — `/project-3` is a placeholder front page for the next app.

## Adding a project

1. Add a project entry to `lib/projects.js` with its destination, name, purpose and status.
2. Create a front page under `app/<project-slug>/page.js` and set page metadata there.
3. Add project-specific styles and components in that route folder. Keep shared project-home styles scoped to their own classes.
4. Link back to `/` so people can switch workspaces.
5. Keep data, auth and API boundaries explicit. Do not reuse another project's private data or credentials by default.

The projects share one Next.js deployment today. A project should move to its own deployment only if a separate runtime, domain, access boundary or release cycle becomes useful.
