# Mirror Within

## Current State
Full-width multi-column layout with a large header, left content panel, and right sidebar. Each segment fills the viewport. Garden visualization sits in the sidebar. The design uses a `#120d10` dark background with pink/rose accent colors. Feedback is collected but not displayed anywhere in the UI.

## Requested Changes (Diff)

### Add
- Page-peel animation when transitioning between steps: `perspective(1200px) rotateY(-18deg) translateX(28px) scale(0.98)` → neutral on entry
- Step indicator pill in topbar (e.g. "Welcome", "Entry Point", "Lens", "Reflection", "Pattern", "Recap", "Adaptive")
- **Feedback viewer page**: A dedicated page inside the shell (accessible from the recap/end screen or a small icon in the topbar) that shows all saved feedback entries from localStorage (`mirror_within_feedback_v4`). Each entry shows the name, message, screen, and date. If no feedback exists, show a gentle empty state.

### Modify
- **Layout**: Replace full-width multi-column layout with a compact single centered shell card (max-width 520px, `border-radius: 28px`, `backdrop-filter: blur(14px)`, background `rgba(255,255,255,0.06)`, border `rgba(255,255,255,0.08)`)
- **Background**: Use `linear-gradient(180deg, #0f0b14 0%, #17111f 45%, #21152a 100%)` instead of flat `#120d10`
- **Topbar**: Small topbar inside the shell with brand label "Mirror" (uppercase, tracking) and the step pill on the right. Add a small feedback icon button (e.g. MessageSquare icon) in the topbar that navigates to the feedback viewer page.
- **Pages**: Each step/segment renders as a "page" inside the shell; only the active page is visible; all use the peel-in animation on mount
- **Garden**: Move garden into the shell as its own dedicated page/step shown after pattern analysis. Keep all garden symbols/milestones, render inline inside the card.
- **Sidebar removed**: All content that was in the right sidebar folded into the main flow or removed. Garden stays as a dedicated page.
- **Buttons**: Keep existing color scheme (primary = `#f3d8ff` / `#efc1d0`, secondary = translucent white border)
- All existing feature logic (access codes, Book Journey segments 1-5, conversational follow-ups, mic toggle, crisis detection, adaptive routing, localStorage) is preserved exactly -- only the visual shell, layout, and feedback visibility change

### Remove
- Right sidebar (current selections, "what this segment adds" panel)
- Multi-column grid layout
- Large header section at the top of the page

## Implementation Plan
1. Refactor the outer layout to a centered flex container with the compact shell card
2. Update background to the gradient
3. Add topbar with brand + step pill + feedback icon inside the shell
4. Wrap each segment in a page div with the peel-in animation (framer-motion AnimatePresence + motion.div with perspective rotateY, or CSS keyframes)
5. Move garden view into the shell as a dedicated step after recap
6. Add feedback viewer page that reads from `mirror_within_feedback_v4` localStorage and renders all entries
7. Remove sidebar markup entirely
8. Keep all state, logic, storage keys, access codes, and flow unchanged
