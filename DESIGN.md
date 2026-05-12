---
version: alpha
name: RadialSAN Dark Glass Workbench
description: Dense desktop design system for a Tauri radial-menu editor with dark glass surfaces, command-first layout, and canvas-centered editing.
colors:
  background: "#070A0F"
  backgroundElevated: "#0B1018"
  surface: "#111823"
  surfaceGlass: "#141C28"
  surfaceGlassStrong: "#192332"
  surfaceMuted: "#172131"
  surfaceSelected: "#213049"
  border: "#334155"
  borderStrong: "#5D6F89"
  text: "#EEF5FF"
  textMuted: "#9AA8BC"
  textDim: "#6F7D91"
  primary: "#6EE7F9"
  primaryContent: "#031116"
  primarySoft: "#123542"
  secondary: "#A78BFA"
  secondaryContent: "#0F0820"
  accent: "#F8C45D"
  accentContent: "#171006"
  success: "#5DE4A1"
  warning: "#F6B95F"
  error: "#FF6B7A"
  canvasRing: "#2D3A52"
  canvasWedge: "#1A2638"
  canvasWedgeActive: "#31466A"
  canvasGuide: "#59667A"
typography:
  display:
    fontFamily: "Inter, SF Pro Display, Segoe UI, Hiragino Sans, Meiryo, sans-serif"
    fontSize: 28px
    fontWeight: 700
    lineHeight: 36px
    letterSpacing: 0em
  headline:
    fontFamily: "Inter, SF Pro Display, Segoe UI, Hiragino Sans, Meiryo, sans-serif"
    fontSize: 20px
    fontWeight: 700
    lineHeight: 28px
    letterSpacing: 0em
  title:
    fontFamily: "Inter, SF Pro Text, Segoe UI, Hiragino Sans, Meiryo, sans-serif"
    fontSize: 15px
    fontWeight: 650
    lineHeight: 20px
    letterSpacing: 0em
  body:
    fontFamily: "Inter, SF Pro Text, Segoe UI, Hiragino Sans, Meiryo, sans-serif"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: 0em
  bodySmall:
    fontFamily: "Inter, SF Pro Text, Segoe UI, Hiragino Sans, Meiryo, sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0em
  label:
    fontFamily: "Inter, SF Pro Text, Segoe UI, Hiragino Sans, Meiryo, sans-serif"
    fontSize: 11px
    fontWeight: 700
    lineHeight: 14px
    letterSpacing: 0.08em
  code:
    fontFamily: "JetBrains Mono, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  control: 6px
  field: 8px
  panel: 10px
  canvas: 14px
  pill: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  xxl: 32px
  navRail: 64px
  menuTree: 280px
  inspector: 340px
  profileCard: 220px
components:
  appShell:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    padding: "{spacing.md}"
    typography: "{typography.body}"
  topCommandBar:
    backgroundColor: "{colors.surfaceGlassStrong}"
    textColor: "{colors.text}"
    borderColor: "{colors.border}"
    rounded: "{rounded.panel}"
    padding: "{spacing.sm}"
  navRail:
    backgroundColor: "{colors.surfaceGlassStrong}"
    textColor: "{colors.textMuted}"
    width: "{spacing.navRail}"
    rounded: "{rounded.panel}"
  navItemActive:
    backgroundColor: "{colors.primarySoft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.field}"
  menuTree:
    backgroundColor: "{colors.surfaceGlass}"
    textColor: "{colors.text}"
    width: "{spacing.menuTree}"
    rounded: "{rounded.panel}"
    padding: "{spacing.md}"
  treeRowActive:
    backgroundColor: "{colors.surfaceSelected}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
  canvasWorkbench:
    backgroundColor: "{colors.backgroundElevated}"
    textColor: "{colors.text}"
    rounded: "{rounded.canvas}"
    padding: "{spacing.lg}"
  radialWedge:
    backgroundColor: "{colors.canvasWedge}"
    textColor: "{colors.text}"
    borderColor: "{colors.canvasGuide}"
  radialWedgeActive:
    backgroundColor: "{colors.canvasWedgeActive}"
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
  inspector:
    backgroundColor: "{colors.surfaceGlass}"
    textColor: "{colors.text}"
    width: "{spacing.inspector}"
    rounded: "{rounded.panel}"
    padding: "{spacing.md}"
  field:
    backgroundColor: "{colors.surfaceMuted}"
    textColor: "{colors.text}"
    borderColor: "{colors.border}"
    rounded: "{rounded.field}"
    padding: "{spacing.sm}"
  segmentedControl:
    backgroundColor: "{colors.surfaceMuted}"
    textColor: "{colors.textMuted}"
    rounded: "{rounded.field}"
    padding: "{spacing.xs}"
  buttonPrimary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primaryContent}"
    rounded: "{rounded.field}"
    padding: "{spacing.sm}"
    typography: "{typography.label}"
  buttonSecondary:
    backgroundColor: "{colors.surfaceMuted}"
    textColor: "{colors.text}"
    borderColor: "{colors.border}"
    rounded: "{rounded.field}"
    padding: "{spacing.sm}"
    typography: "{typography.label}"
  profileCard:
    backgroundColor: "{colors.surfaceGlass}"
    textColor: "{colors.text}"
    width: "{spacing.profileCard}"
    rounded: "{rounded.panel}"
    padding: "{spacing.md}"
  statusChip:
    backgroundColor: "{colors.primarySoft}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    typography: "{typography.label}"
---

# RadialSAN Design System Specification

## Overview

RadialSAN is a dense desktop workbench for building muscle-memory radial menus. The product should feel like a technical control surface: dark glass panels, compact command controls, a canvas-first radial editor, and immediate visibility into hotkeys, profiles, selected wedges, and action configuration.

The primary screen is the editor, not a landing page. Preserve the screenshot-derived intent: a top command bar, left navigation rail, adjacent menu tree, central radial canvas, right inspector, and bottom profile cards. Every visual decision should make scanning, editing, testing, and assigning radial menu actions faster.

## Colors

Use the YAML `colors` tokens as the canonical palette. All color tokens are valid hex values so they can be consumed by automated tooling; transparency should be implemented in CSS through opacity utilities or alpha composition at the usage site, not encoded in the token value.

The base is near-black, with cool blue glass surfaces and quiet borders. `primary` cyan is reserved for focus, active navigation, selected wedges, and synchronized selection across tree, canvas, and inspector. `secondary` violet supports alternate modes. `accent` amber marks unsaved edits and profile conflicts. `success`, `warning`, and `error` are state colors, not decorative accents.

Main panels use `surfaceGlass` or `surfaceGlassStrong` with blur, tonal separation, and subtle borders. Text uses `text` for primary values, `textMuted` for labels and metadata, and `textDim` for disabled or low-priority hints.

## Typography

Use the YAML `typography` tokens. Favor `title`, `body`, `bodySmall`, `label`, and `code` because this is a compact native-feeling Tauri app. `display` and `headline` are only for page-level headings, empty states, or major editor modes.

Labels may use uppercase where it improves scanning, such as HOTKEY, PROFILE, ACTION, and BEHAVIOR. Do not use negative letter spacing. Numeric values, key chords, command paths, and serialized settings snippets use `code`.

## Layout

The editor is a full-height workbench with stable desktop regions:

- Top command bar: save/apply, undo/redo, import/export, record hotkey, preview-test, and status.
- Left nav rail: fixed `spacing.navRail`, icon-first destinations for menus, profiles, settings, import/export, and diagnostics.
- Menu tree: fixed `spacing.menuTree`, compact nested rows with disclosure controls, action icons, hotkeys, and status chips.
- Central canvas: flexible radial editor with the most visual weight, guide rings, wedge boundaries, icon placeholders, labels, drag handles, and disabled states.
- Right inspector: fixed `spacing.inspector`, tight groups for identity, trigger, action, icon, behavior, conditions, and advanced settings.
- Bottom profile cards: profile summaries spanning the tree/canvas/inspector area, each showing scope, priority, enabled state, and conflicts.

Keep gutters compact and consistent. The selected tree row, active radial wedge, inspector header, and relevant profile card must stay visually synchronized.

## Elevation & Depth

Depth comes from dark glass, blur, tonal layering, borders, and restrained glows. Avoid decorative gradients and oversized floating cards. The hierarchy should read as base app background, work surfaces, floating editor controls, then modal or popover layers.

Use stronger borders and cyan glow only for focus, drag targets, active wedges, and current selection. Panel shadows should be broad and dark; the canvas can use a slightly deeper surface so the radial menu remains the anchor.

## Shapes

Use the YAML `rounded` tokens. Controls use `control` or `field`; panels use `panel`; the central canvas uses `canvas`; chips and small status badges use `pill`.

The app should remain crisp and technical. Avoid large rounded marketing-style cards. Keep fixed-format UI such as nav buttons, toolbar buttons, profile cards, and radial wedges dimensionally stable so hover and selection states do not shift layout.

## Components

Use the YAML `components` tokens as the canonical component references. Each component token points back to defined `colors`, `typography`, `rounded`, or `spacing` tokens.

The top command bar is compact and command-focused. Use lucide icons for undo, redo, save, import, export, add, delete, zoom, and preview-test actions, with tooltips for icon-only controls.

The nav rail is icon-first and narrow. Active destinations use `navItemActive` plus an additional indicator so state is not color-only.

The menu tree is dense and aligned. Rows show hierarchy, action type, hotkey, conflicts, and enabled state without long explanatory copy. The selected row uses `treeRowActive` and must match the highlighted wedge.

The central canvas uses `canvasWorkbench`, `radialWedge`, and `radialWedgeActive`. Wedges should support normal, hover, selected, disabled, drag target, and conflict states.

The inspector uses compact field groups. Use segmented controls for modes, toggles for binary settings, sliders or steppers for numeric timing and angle values, menus for action types, and fields for labels or command strings.

Profile cards use `profileCard` and `statusChip`. Selected profiles use cyan, unsaved profiles use amber, disabled profiles are dimmed, and conflict warnings include an icon or text cue in addition to color.

## Do's and Don'ts

Do make the radial canvas the central visual signal. Do keep the interface dense, aligned, desktop-native, and optimized for repeated editing. Do keep static UI strings in i18n files. Do use lucide icons for tool actions. Do pair color with icons, outlines, or text for selection and warnings.

Do not turn the editor into a landing page. Do not add decorative orbs, one-note gradients, oversized cards, or explanatory in-app text blocks. Do not hide profile conflicts or unsaved state outside the relevant row, wedge, inspector header, or profile card. Do not introduce design tokens that cannot be resolved from the YAML front matter.
