# Links Page Design

## Goal

Rewrite the frontend friend links experience so it is no longer a popup. Clicking the friend links icon in the frontend header should navigate to a dedicated `/links` route, where the main content area renders the links page.

## Current State

`frontend/src/components/Header.vue` currently imports and mounts `frontend/src/components/Link.vue`. The header icon calls an exposed `toggleShowLink()` method, and `Link.vue` renders a fixed-position popup with its own open/close state. Link data is loaded through `getLink()` from `frontend/src/api/link.ts`, while site name, logo, avatar, and `link_brief` come from `useDefaultStore().configs`.

## Recommended Approach

Create a dedicated page component at `frontend/src/views/Links.vue` and add a frontend child route at `/links` in `frontend/src/router/frontend.ts`. The route should use the existing `FrontLayout`, so the page replaces the main router content area instead of overlaying the current page.

Update `Header.vue` so the friend links icon calls `router.push({ name: 'links' })`. Remove the popup-specific `Link.vue` import, template mount, `ref`, exposed API type, and `toggleShow` helper from `Header.vue`.

If no other references to `frontend/src/components/Link.vue` remain, delete that component to avoid keeping obsolete popup behavior.

## Page Behavior

`Links.vue` should:

- Display the current site logo, site name, and `link_brief` using `useDefaultStore()`.
- Fetch friend links with `getLink()` on mount.
- Render each link with logo fallback `/img/avatar.jpg`, site name, and fallback brief text `暂时未设置站点介绍`.
- Open external links with `window.open(url, '_blank', 'noopener,noreferrer')`.
- Show a simple empty state when no links are returned.
- Show a simple failure state if loading fails, while logging the error for debugging.

## Styling

Use the existing narrow app container from `FrontLayout` rather than adding an overlay. Keep the page as a normal vertical content view. Reuse the visual intent of the old component, but replace fixed positioning, popup shadow, close button, and slide transition with page-level spacing and list interactions.

## Testing

There is no configured frontend test runner. Verification should use:

- `cd frontend && npm run build` to type-check and build the Vue app.
- Manual browser check: click the header friend links icon, confirm `/links` loads, confirm back navigation works, and confirm link rows open in a new tab.
