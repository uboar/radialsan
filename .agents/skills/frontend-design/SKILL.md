---
name: frontend-design
description: Apply RadialSAN frontend/UI changes using the repo design system, existing Svelte/Tailwind patterns, i18n, and focused validation.
---

# RadialSAN Frontend Design Skill

Use this skill for frontend, UI, visual design, layout, component, icon, or interaction changes in this repository.

## Required Context

1. Read `DESIGN.md` before changing UI. Treat it as the canonical design direction and token reference.
2. Inspect nearby Svelte components and CSS/Tailwind usage before editing. Match the existing Svelte 5, Tailwind v4, store, and component patterns.
3. Check `src/i18n/locales/en.json` and `src/i18n/locales/ja.json` for any static UI text. Use `t()` in Svelte instead of hard-coded user-facing strings.

## Design Direction

- Preserve the dark glass dense desktop workbench: top command bar, left nav rail, menu tree, central radial canvas, right inspector, and bottom profile cards.
- Keep the radial canvas as the primary visual anchor.
- Use compact spacing, stable dimensions, readable contrast, and synchronized selection states across tree rows, radial wedges, inspector headers, and profile cards.
- Use lucide icons through the existing lucide-svelte or local LucideIcon patterns for toolbar and action buttons.
- Avoid landing-page composition, decorative gradients, oversized cards, and explanatory in-app text.

## Implementation Rules

- Keep changes scoped to the requested UI surface.
- Prefer existing components, stores, CSS variables, Tailwind utilities, and local helper APIs.
- Add or update focused tests when changing pure UI logic, geometry, stores, validation, or state mapping.
- Do not test OS-permission-dependent `rdev` or `enigo` behavior directly; test pure parsing, state, or rendering helpers instead.
- Preserve accessibility basics: labels for form controls, titles/tooltips for icon-only buttons, keyboard-reachable controls, and non-color-only state cues.

## Validation

Run cheap checks first:

```bash
git diff --check
pnpm run build
```

When changes affect logic, stores, rendering helpers, import/export, profile validation, or editor state, also run:

```bash
pnpm exec vitest run
```

If a command cannot run locally, report the exact command and failure reason.
