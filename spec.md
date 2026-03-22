# Mirror Within

## Current State
Full-stack self-inquiry journaling app with 8 screens: onboarding, checkin, intake, shadow, journal, insights, resources, and breathe. Dark theme, crisis detection, local storage journaling, guided breathing.

## Requested Changes (Diff)

### Add
- New `creator` screen: "Behind the Eyes of the Creator" — a personal story section where the creator can share their mental health journey. Content is editable directly in code (hardcoded with clear placeholder sections).
- Nav item for this screen labeled "Creator" or "Our Story".

### Modify
- Add `"creator"` to the `Screen` type union.
- Add nav item pointing to the creator screen.

### Remove
- Nothing.

## Implementation Plan
1. Add `"creator"` to the `Screen` type.
2. Add nav entry `{ label: "Our Story", screen: "creator" }` to navItems.
3. Create `CreatorScreen` component with rich, emotionally resonant layout — title "Behind the Eyes of the Creator", a personal intro paragraph, a mental health journey section with expandable/scrollable content blocks, and a closing message. Content uses placeholder text the creator can replace.
4. Wire the creator screen into the AnimatePresence block in App.
