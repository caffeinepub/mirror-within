# Mirror Within

## Current State
The Book Journey app is fully functional with: access codes, garden visualization, session management, crisis detection, feedback system, voice/text journaling, chapter-by-chapter reflection, pattern detection, adaptive routing, and a chat-based UI for deeper reflection sections. The app is ~4130 lines in App.tsx. It currently has basic/partial Mirror analysis logic but is missing the full system.

## Requested Changes (Diff)

### Add
- `lensesByStage` constant (surface/attacked/deep stages, 14 lens keys each with key/title/subtitle/promptTitle/prompt)
- `researchQuestionBank` constant (14 lens keys, each with reflective question arrays)
- `phraseSignals` constant (10 wound keys, each with array of {phrase, weight} objects)
- `intensitySignals` constant (strong/medium/pattern groups)
- `contradictionSignals` constant (4 contradiction objects with left/right/label/weight)
- `analyzeEntry(entry, lensKey, entryPoint, storyName)` function with full emotion/trigger/belief/coping detection, phrase/intensity/contradiction scoring, wound scoring, primaryWound/secondaryWound derivation
- `buildMirror(primary, secondary, variant)` inside analyzeEntry returning poetic mirrorMode text with 3+ variants per wound
- `buildInterruption(primary)` inside analyzeEntry returning loopInterruption text
- Confidence system: high/medium/low based on maxScore and evidenceCount
- Adaptive question system using stageBank (surface/pattern/confrontation/identity), woundQuestionBank (10 wounds), anti-repetition via mirrorRecentQuestions localStorage
- localStorage support for `mirrorEntries` and `mirrorRecentQuestions`
- Analysis state fields: analysis, history, baseEntry, manualStop, lastTranscriptAt
- Auto-save full analysis object to mirrorEntries after each analysis
- History insights: top wound trend, secondary wound trend, emotion/trigger/belief/coping trends, timeline shift, quiet inference note, recentShift logic
- Recap UI cards: Core wound detection, Pattern evidence, Mirror mode, Loop interruption

### Modify
- Existing analysis state to include new fields
- Existing recap/results screen to include new analysis cards
- Existing follow-up question logic to use adaptive question system (integrated into chat flow, NOT separate boxes)
- History rendering to include wound trend counting (primary=1, secondary=0.5), pattern labels (5+=Major, 3-4=Recurring, 2=Emerging, 1=Not enough yet)

### Remove
- Simple/stub analysis logic replaced by full analyzeEntry

## Implementation Plan
1. Add all 5 constants (lensesByStage, researchQuestionBank, phraseSignals, intensitySignals, contradictionSignals) near top of App.tsx or in a separate mirrorConstants.ts file imported into App.tsx
2. Add analyzeEntry function with buildMirror and buildInterruption helpers
3. Add getAdaptiveQuestions function using stageBank + woundQuestionBank + anti-repetition
4. Extend analysis state and localStorage integration
5. Update recap/results UI to render new cards
6. Update history insights panel
7. Wire analyzeEntry into the existing deeper reflection flow (replacing simple analysis)
8. Validate and build
