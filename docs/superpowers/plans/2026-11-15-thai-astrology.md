# Thai Astrology Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace approximate solar/lunar calculations with the user's selected `thai-astrology` engine while preserving the existing website and sharing URL.

**Architecture:** An adapter exposes only display-safe natal factors and daily transit snapshots. A separate results component presents these factors; the four-step tarot flow remains in `App.tsx`. Everything runs locally in the browser.

**Tech Stack:** React 19, esbuild, Node test runner, thai-astrology exactly 0.3.2.

**Spec:** The user's approved existing four-step website and latest instruction to update it using https://github.com/kongesque/thai-astrology. Existing behavior is documented in README.md. This is an integration within the approved scope, not a redesign.

## Global Constraints

- Preserve the public GitHub Pages URL, navy/gold design, 78-card deck, optional birth time, and 56px mobile controls.
- No backend, AI service, analytics, personal-data storage, or personal data in shared URLs.
- Use published 0.3.2 APIs with full Thai province names; do not override automatic sunrise/time references.
- Unknown birth time uses explicitly labeled 12:00 reference; omit ascendant, houses, taksa and factors.
- Display mathematical traditional factors separately from editorial tarot/reflection text; no scientific prediction claims.
- 1/7/30 calendar-day periods sample offsets 0 through N−1 at the current Bangkok wall-clock minute. They are not exact ingress times.
- Include the MIT license and GeoNames CC BY 4.0 attribution in the deployed distribution.

## Review Focus

- Thai dates near UTC midnight and year rollover must not depend on the visitor's timezone.
- Switching known/unknown birth time must not leave stale ascendant or houses.
- Invalid dates, future births, unsupported historical fixtures and malformed times must not generate plausible-looking results.
- Transit houses must be relative to the natal ascendant, not the transit ascendant.
- A 360px touchscreen must complete all four steps and inspect the added tables without page overflow.

## Task 1: Tested calculation adapter

**Files:** Create `src/astrology.js`, `test/astrology.test.js`; modify `package.json`, `package-lock.json`.

**Interfaces:** Export `PROVINCES` (77 full Thai names), `PLANET_KEYS` (10 keys), `bangkokMoment(now)`, and `buildReading({date, time, province, period, now})`. `date` is `{year, era:'CE'|'BE', month, day}`, `time` is optional `HH:mm`, and period is `วันนี้`, `7 วัน`, or `30 วัน`.

The result contains `engine`, `birth:{dateISO, referenceTime, timeKnown, province}`, `natal:{planets, ascendant, houses, taksa, factors, lunarDate, civilWeekday, referenceMode}`, `period:{label, days}`, `snapshots:[{dateISO, time, planets, lunarDate}]`, `changes:[{dateISO, time, key, nameThai, fromSignName, toSignName}]`, and `generatedAtISO`. Each planets object uses `PLANET_KEYS` with `{key,nameThai,number,sign,signName,degrees,minutes,longitudeDegrees,house,dignities}`. Transit `house` means natal house; all houses are null if birth time is unknown. `factors` contains `ascendantRulerName` and `tanusethName` only when known.

- [x] Write tests for the published 2024-09-15 08:30 Chiang Mai fixture (Sun สิงห์ 27°56′; Moon มังกร 19°07′; ascendant กันย์; lunar day 13/month10), era equality, every province, optional time, bad input, transit houses, period counts, rollover, and Bangkok timezone independence.
- [x] Run `node --test test/astrology.test.js`; confirm missing adapter failure before implementation.
- [x] Implement the adapter, including an explicit guard for the documented upstream special-case Uranus correction at 1904-02-29 03:47 แม่ฮ่องสอน.
- [x] Run `npm test`; require all assertions to pass.

## Task 2: Results, workflow and touch behavior

**Files:** Create `src/AstrologyResults.tsx`, `src/astrology-results.css`; modify `src/App.tsx`, `src/horoscope.css`.

**Interfaces:** `<AstrologyResults reading={reading}/>` consumes Task 1 output. App captures the current instant when a reading begins and computes before showing cards. Calculation errors stay in the form flow.

- [x] Test the known/unknown output contract and selected-snapshot options before implementing the component.
- [x] Show all ten planetary factors, optional ascendant/12 houses/taksa, a readable Thai lunar date, and a selector for each daily transit sample. State the location/time convention and unknown-time limits visibly.
- [x] Replace approximate functions in App, use all 77 provinces, preserve the tarot sequence and sharing behavior, remove stale approximation copy, and retain non-animated behavior.
- [ ] Verify both known and unknown time flows, multiple periods, field changes/reset, 360px touch targets, and absence of horizontal page overflow in a browser.

## Task 3: Attribution and verified deployment

**Files:** Update `README.md`, `index.html`; create `public/THIRD_PARTY_NOTICES.txt`; regenerate `docs/index.html` and `docs/assets/*` using the existing hash-versioned build.

- [x] Document version, conventions, limitations and the guarded historical input; include exact MIT notice and GeoNames attribution.
- [x] Run `npm test`, `npm run build`, `git diff --check`, and review the complete diff.
- [ ] Recheck remote main and publish via a fast-forward commit with an expected-head lease, preserving unrelated changes.
- [ ] Verify the Pages deployment workflow, served asset hashes and live end-to-end flow before reporting the update complete.

## Verification record before deployment

- 22 pure/React SSR tests pass. The calculation adapter and results component both had observed failing tests before implementation.
- Independent read-only review found one important issue: future birth time later on today's date. Fixed after an observed failing regression; equal/earlier minute and unknown-time reference remain accepted.
- Ruling: the headless browser launch was blocked by host socket permissions; no bypass attempted. The connected browser was unavailable and the supported cloud browser cannot reach the workspace loopback. Verify the live Pages UI after the authorized deployment before reporting completion; do not label the optional smoke script as executed successfully.
- Ruling: the transit-house fixture originally used coincidentally equal natal/transit ascendants. It was moved to a different current hour so it proves the two house systems are distinguished.
- Independent astronomical validity across the entire historical range is not claimed. This change verifies integration with the pinned traditional calculator, not scientific predictive accuracy.
