# Mirror Within

## Current State
The app has a full journaling system with access control (unique codes), session management (15-min timeout), intake/shadow prompts, crisis detection, pattern detection, insights, feedback collection, and experimental modes (micro-introspection, voice reflection, pattern reveal). The main flow uses a screen state machine in App.tsx.

## Requested Changes (Diff)

### Add
- Full "Book Journey" flow replacing the journaling flow
- Step 1: Welcome screen — user picks a shared name
- Step 2: Entry intensity selection (Surface level, Ok I feel attacked, Love/distance/attachment, Control/pressure/performance)
- Step 3: Expression method selection (voice "Your very own TedTalk" or writing "Hear ye Hear ye")
- Step 4: Chapter-by-chapter reflection with real mic controls (SpeechRecognition API) for voice mode and textarea for writing mode; follow-up prompts appear after each response
- Step 5: End of chapter recap showing all saved responses
- Pattern detection after chapter completion (avoidance, control, abandonment, over-giving)
- Adaptive next-step routing (stay/deepen/shift lens) based on detected patterns
- Persistent pattern profile stored in localStorage (mw_profile_v1)
- Pattern profile shows session count and pattern frequency

### Modify
- Replace the existing journaling/prompt flow with the Book Journey flow
- Keep access control (unique codes + personalized greeting)
- Keep session management (15-min timeout, autosave, relock)
- Keep crisis detection (keywords still checked against journal responses)
- Keep privacy controls and feedback
- Keep the dark theme design

### Remove
- Old intake/shadow prompt screens
- Old experimental modes (micro-introspection standalone, old pattern reveal)
- Old journal entry list/delete flow (replaced by book journey chapter recap)

## Implementation Plan
1. Replace the journaling screen flow in App.tsx with the Book Journey multi-step component
2. Integrate entryPaths data, ProgressRings, PathPreview, voice capture, chapter saving, pattern detection, adaptive routing, and profile persistence
3. Keep the access control gate (unique codes) before the Book Journey starts
4. Keep crisis detection scanning chapter responses
5. Keep session timeout, autosave, privacy controls, feedback
6. Use existing dark theme colors (#120d10, #1b1317, #efc1d0, etc.)
