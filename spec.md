# Mirror Within

## Current State
Full Book Journey flow with 5 steps, pattern detection via `basePatterns` (9 patterns using regex), `detectPatternIds`, `pickNextRoute`, and a persistent profile stored at `mw_profile_v1`. Step 5 (Recap) shows detected patterns with advice and adaptive next steps. All existing access codes, feedback viewer (Iamki-only), garden visualization, crisis detection, mic toggle, and conversational follow-ups are present.

## Requested Changes (Diff)

### Add
- A **detailed entry analysis** function (`analyzeEntry`) that detects across 4 dimensions:
  - **Emotions**: fear, anger, shame, sadness, rejection, control (via keyword lists)
  - **Triggers**: family, relationship, work, selfImage, money, health
  - **Beliefs**: abandonment, unworthiness, overResponsibility, mistrust, selfSilencing
  - **Coping**: avoidance, caretaking, peoplePleasing, rumination, confrontation
- **Auto-save** each completed chapter set to a new localStorage key `mirrorEntries` as structured objects: `{ id, storyName, entryPoint, lens, entry (last chapter response), emotions[], triggers[], beliefs[], coping[], timestamp }`
- A **Pattern History panel** in Step 5 (below existing pattern analysis) that reads all saved entries from `mirrorEntries`, counts tag frequency across all entries, and shows:
  - Saved entry count
  - Top emotion trend (with frequency + label: "Major pattern" >= 5, "Recurring pattern" >= 3, "Emerging pattern" >= 2)
  - Top trigger trend
  - Top belief trend  
  - Top coping trend
- The detailed analysis for the CURRENT session should also show in Step 5: "Likely trigger area", "Possible core belief", "Coping style" cards in addition to existing pattern cards

### Modify
- Step 5 recap: after the existing pattern analysis section, insert the current-session detailed analysis cards, then the pattern history panel

### Remove
- Nothing

## Implementation Plan
1. Add `mirrorEntries` localStorage key constant
2. Add `analyzeEntry(entry, lensKey, entryPoint, storyName)` function with 4 dictionaries
3. Add `saveEntryToHistory(analysis)` function that reads, deduplicates by id, and writes to `mirrorEntries`
4. Add `renderHistoryInsights(saved)` helper that counts tags and returns trend data
5. In the Step 5 render: after `detectedPatterns` section, add a new `DetailedAnalysisPanel` showing current session's emotion/trigger/belief/coping findings
6. Add `PatternHistoryPanel` component below that shows cross-session trends
7. Auto-call `saveEntryToHistory` when step 5 is reached (at the same point profile is updated)
