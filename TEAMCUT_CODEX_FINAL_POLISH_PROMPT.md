# TEAMCUT — FINAL POLISH PASS: 2-SECOND HOOK + SMOOTH 3D HAIRSTYLIST PROFILE

Implement this directly in the existing TEAMCUT project.

This is a FINAL POLISH pass. The current TEAMCUT V1 UI, layout, data, business logic, and user flow are already approved/locked. Do not redesign them.

## HARD RULES

- Inspect the existing TEAMCUT code first and work with the current implementation.
- Implement the requested changes directly. Do not stop at a plan, mockup, explanation, or pseudocode.
- Do not ask me to choose between multiple animation concepts. Use the direction below and make the implementation yourself.
- Do not redesign any existing UI.
- Do not replace the current typography, colors, spacing system, photos, copy, cards, sections, navigation, or layout unless a tiny internal wrapper/class is technically required for the animation.
- Do not change business logic or data flow.
- Do not change Supabase schema, RLS, realtime queue logic, admin logic, booking logic, branch logic, gallery logic, or WhatsApp destinations.
- Do not add unrelated features.
- Do not create a new profile system or duplicate modal system.
- Do not add heavy animation libraries. GSAP is already available in the project; reuse the existing GSAP setup.
- Do not work on image WebP conversion in this task. That will be handled separately later.
- Keep the result production-ready and mobile-first.
- No horizontal overflow at 375px, 390px, or 430px.
- Preserve accessibility and reduced-motion behavior.

The two tasks below are the ONLY scope.

---

# TASK 1 — 2-SECOND HERO HOOK / INTRO MOTION

Create a polished opening animation for the first ~2 seconds of the TEAMCUT homepage.

The goal is to make the existing hero feel alive immediately when the page loads, with an editorial/barbershop-brand feel. It should feel intentional and premium, not like a generic SaaS fade-in.

## Desired sequence

Target total duration: approximately 1.8–2.2 seconds.

### 0.00–0.45s — Hero photo appears
- Use the EXISTING TEAMCUT hero photo.
- Do not replace or regenerate the image.
- The photo should emerge/timbul into place from a slightly lower/deeper position.
- Use a subtle combination of opacity, scale, y movement, and z-depth.
- Example feel: starts slightly smaller and lower/deeper, then moves forward and settles into the existing hero position.
- Avoid a dramatic zoom.

### 0.20–1.15s — TEAMCUT lettering falls in
- Animate the existing TEAMCUT wordmark/text.
- Treat the letters individually, preferably by wrapping the existing text characters in spans through JS/DOM if no split-text utility is already present.
- Preserve the actual displayed text and typography.
- Letters should initially come from above with small variations in y-position, x-offset, rotation, and timing so they feel slightly scattered/chaotic.
- Then they should settle into the exact existing TEAMCUT layout.
- Think: "letters fall from above -> slightly messy -> snap/settle into TEAMCUT".
- It must NOT look like a terminal typing effect.
- It must NOT look like a generic staggered fade.
- Keep the scatter controlled and tasteful; no huge rotations or letters flying off-screen.
- Use GSAP timeline/stagger. Small randomized offsets are okay, but make them deterministic so the animation is stable on every load.

Suggested motion characteristics (tune visually):
- initial y: roughly -70 to -140px per letter
- initial x: small variation, roughly -12 to +12px
- rotation: small variation, roughly -8deg to +8deg
- opacity: 0 to 1
- scale: roughly 0.95–1.05
- settle with a smooth ease, not a cartoon bounce

### 1.05–1.70s — Tagline / supporting hero copy
- Existing tagline and nearby hero supporting text should enter subtly after the main TEAMCUT letters settle.
- Use a short upward motion + opacity, or another restrained editorial motion.
- Preserve all current copy.
- Do not add new text.

### 1.60–2.20s — Existing queue/status UI settles
- Existing queue/status/branch information may finish entering or settling if it currently has an entrance state.
- Do NOT redesign or rearrange it.
- Keep this subtle.

## Motion quality requirements

- Use one GSAP timeline for the hero intro when practical, with carefully controlled sequencing.
- Prefer smooth premium easing such as power3/power4 and a small amount of back/eased settling only where helpful.
- Do not use aggressive bounce, elastic, flashing, shaking, or glitch effects.
- Do not animate every page section on initial load.
- Do not make the user wait. Total hook must stay around 2 seconds.
- The animation should play once on initial page load, not repeatedly on scroll.
- Avoid layout shift: reserve the existing element positions and animate transforms/opacity rather than changing document flow.
- Respect `prefers-reduced-motion`: provide an immediate/static state or very short fade fallback.
- Do not leave elements invisible if JS/animation fails. Ensure a safe visible final state.

## Important

The hook must preserve the current TEAMCUT visual identity:
- black/white editorial base
- restrained red accent
- bold typography
- existing hero image
- existing mobile-first layout

This is motion polish, NOT a redesign.

---

# TASK 2 — POLISH THE EXISTING HAIRSTYLIST PROFILE 3D FLIP

The existing TEAMCUT hairstylist profile card/modal ALREADY has a working 3D flip.

Do not rebuild the feature from zero unless the current implementation truly requires it.

The problem now is that it feels like a basic flat flip: it flips from front to back, but it is still rough and lacks a convincing physical rotation through 3D space.

## Desired result

Keep the current 3D flip mechanic, but make the card feel like a real physical card that:

1. lifts slightly from the page,
2. rotates through depth,
3. flips around the Y axis,
4. has a small coordinated X/Z rotational tilt while travelling,
5. moves slightly forward/back in Z space,
6. settles smoothly into the floating profile modal,
7. reverses naturally when closing.

The key phrase is: **"flip + orbit/tilt + depth"**, not just "rotateY(180deg)".

## ARMATURE reference

Use the previously extracted ARMATURE MONITORING reference package as motion inspiration only.

Relevant source pieces:
- `source/animations.js`
- `source/gsap.min.js`
- `reference/material-flip.css`
- `reference/material-flip.html`

Reuse the mechanics/concepts where useful:
- perspective around 1200px
- `transform-style: preserve-3d`
- `backface-visibility: hidden`
- front/back faces occupying the same card space
- GSAP 3D transforms
- `rotationY`, `rotationX`, `scale`, `y`, `z`
- `force3D: true`
- `transformPerspective`
- kill existing tweens before starting a new transition
- reduced-motion fallback

Do NOT copy the ARMATURE UI styling.

## Motion direction

The opening should feel approximately like this:

- card starts slightly smaller, deeper, and a little tilted
- card lifts/comes forward
- Y rotation carries the main flip
- X and Z rotations add a subtle physical "turning" feeling while the flip happens
- the rotation should not stay perfectly flat on one axis
- card comes toward the viewer slightly
- final tilt returns to neutral
- tiny overshoot/settling is okay, but keep it sophisticated

Use the existing ARMATURE motion values as a reference only, then tune them for TEAMCUT's smaller profile card. Do not blindly reuse long/excessive timings.

A reasonable target is roughly 650–900ms for the main profile-card opening motion, with a smooth close of similar or slightly shorter duration.

## Rotation requirement

The current implementation already flips successfully.

Keep `rotationY` as the primary flip axis, but add a subtle synchronized `rotationX` AND `rotationZ` path so the card feels like it is physically rotating in space rather than simply turning like a 2D door.

Example conceptual path (tune visually, do not copy blindly):
- start: small negative/positive X tilt, small Z tilt, scale < 1, z negative
- mid flip: stronger Y rotation while X/Z tilt changes gradually
- near final: Y approaches 0, X/Z approach 0, z returns to 0, scale returns to 1
- final: completely settled/neutral

Keep the additional X/Z rotation restrained. The card must remain readable and stable.

## Modal/card appearance

Preserve the existing TEAMCUT profile modal design.

The modal should feel like a **small floating editorial profile card**, not a huge full-screen dashboard.

Do not make the card unnecessarily large.
Do not increase typography dramatically.
Do not change the content hierarchy.
Do not remove existing profile information.

Existing profile content that must remain correct:
- hairstylist photo
- name
- branch
- bio
- keunggulan/highlights
- Instagram when available
- `KONSULTASI VIA WHATSAPP` -> hairstylist's own number
- `BOOKING VIA ADMIN` -> existing TEAMCUT admin booking flow

## Interaction requirements

- Opening a different hairstylist must animate correctly with that hairstylist's actual data.
- Closing must fully reset transforms so reopening another profile does not inherit the previous card state.
- Backdrop/close behavior must remain compatible with the existing TEAMCUT implementation.
- Escape/backdrop behavior must continue to work as currently designed.
- No horizontal overflow on 375 / 390 / 430px.
- No broken links.
- No console errors.
- No impact on branch/service/gallery/queue/booking behavior.

## Reduced motion

Respect `prefers-reduced-motion`.
For reduced-motion users, skip the 3D rotational sequence or reduce it to a simple opacity/scale transition while keeping the modal usable.

---

# IMPLEMENTATION STYLE

Before editing:
- inspect the existing hero DOM/classes and current hairstylist modal implementation;
- locate the existing GSAP setup and reuse it;
- understand how profile data is populated;
- understand how the modal currently opens/closes.

Then implement directly.

Prefer minimal, focused changes.
Avoid unnecessary refactors.
Avoid renaming unrelated classes/functions.
Avoid changing unrelated files.
Do not alter data structures unless technically required for the animation.

For the hero letters, preserve semantics/accessibility: do not make the heading unreadable to screen readers just because visual letters are split into spans.

For the 3D card, keep the front/back DOM structure robust and make sure both faces do not visually bleed through each other.

---

# VALIDATION — DO THIS BEFORE REPORTING DONE

Test:
1. Homepage first-load hook.
2. Refresh the page and ensure the hook reliably reaches the final visible state.
3. Open several different hairstylist profiles.
4. Close and reopen profiles repeatedly.
5. Test 375px, 390px, and 430px widths.
6. Verify no horizontal scrolling.
7. Verify all existing text/photos/buttons still appear correctly.
8. Verify `KONSULTASI VIA WHATSAPP` still uses the hairstylist's own WhatsApp number.
9. Verify `BOOKING VIA ADMIN` still uses the existing TEAMCUT admin booking flow.
10. Verify existing queue/branch/service/gallery/booking behavior remains unchanged.
11. Check browser console for errors.
12. Test `prefers-reduced-motion` behavior.

## IMPORTANT — DO NOT REVISE THE DESIGN

Do not make a second alternative animation.
Do not create multiple variants.
Do not ask for another visual direction.
Do not redesign after implementation.
Make the best polished implementation from this specification, validate it, and report the final result.

## FINAL RESPONSE FORMAT

After implementation, report only:

### Changed
- files changed
- hero hook implemented
- hairstylist 3D flip polished

### QA
- mobile widths tested
- open/close profile tested
- hero intro tested
- console/error result
- reduced-motion result

### Notes
- any small technical adaptation needed from the ARMATURE reference

Do not include unrelated suggestions or new feature ideas.
