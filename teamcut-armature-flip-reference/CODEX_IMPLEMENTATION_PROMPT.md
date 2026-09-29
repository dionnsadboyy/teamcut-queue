# TASK — Adapt ARMATURE's 3D Flip Modal Effect to TEAMCUT Hairstylist Profiles

We want to reuse the **3D flip-card modal mechanics** from the attached ARMATURE MONITORING reference and implement the same interaction in the existing TEAMCUT project.

Reference files in this package:
- `source/animations.js`
- `source/gsap.min.js` (GSAP 3.13.0)
- `reference/material-flip.css`
- `reference/material-flip.html`

## Goal

When a user taps/clicks a TEAMCUT hairstylist card/profile:
1. Open the existing profile detail modal.
2. The modal should feel like a **small floating physical card** entering 3D space.
3. Use a smooth Y-axis 3D flip with a little X tilt, depth (`z`), scale, and vertical movement.
4. Settle naturally into the profile modal.
5. Closing should reverse the same motion.
6. The effect should be compact and premium on mobile, not a huge full-screen dashboard modal.

## Preserve TEAMCUT

Do NOT import ARMATURE's visual design.
Keep TEAMCUT's existing:
- black / white base
- restrained red accent
- bold editorial typography
- existing hairstylist photos
- existing profile content
- existing WhatsApp CTAs
- existing branch / service / booking behavior
- existing mobile bottom navigation

This task is ONLY about improving the profile-card/modal interaction.

## ARMATURE mechanics to reuse

The useful source pattern is:
- outer scene with `perspective: 1200px`
- inner card with `transform-style: preserve-3d`
- front and back faces sharing the same grid area
- `backface-visibility: hidden`
- `rotateY(180deg)` on the back face
- GSAP sequence using `rotationY`, `rotationX`, `scale`, `y`, and `z`
- `force3D: true`
- `transformPerspective: 1500`
- kill active tweens before starting a new transition
- respect `prefers-reduced-motion`

In the ARMATURE reference, the opening sequence is approximately:
- start: `rotationY: 180`, `rotationX: -6`, `scale: 0.72`, `y: 18`, `z: -140`
- then `rotationY: 115`, `scale: 0.82`, `y: 8`, `z: -50`
- then `rotationY: 65`, `scale: 0.91`, `z: 20`
- then `rotationY: 18`, `rotationX: -1`, `scale: 0.985`, `y: 1`, `z: 5`
- final: `rotationY: 0`, `rotationX: 0`, `scale: 1`, `y: 0`, `z: 0`

Use these as a **reference**, but tune them for TEAMCUT so the animation is shorter, lighter, and suited to a small editorial profile card. Do not blindly copy timings if they look excessive.

## TEAMCUT implementation requirements

1. Find the current hairstylist profile card click handler and current profile detail modal.
2. Reuse the existing modal/data logic. Do not create a parallel profile system.
3. Make the profile modal/card structure support:
   - `.hairstylist-profile-scene` (or equivalent)
   - `.hairstylist-profile-card`
   - `.hairstylist-profile-front`
   - `.hairstylist-profile-back`
   Use clear TEAMCUT-specific class names; do not leave ARMATURE's `material-*` naming in production unless the current codebase already has a shared generic animation component.
4. The front face contains the actual TEAMCUT profile.
5. The back face can be a minimal TEAMCUT brand surface / image treatment only if it improves the flip. Keep it very subtle and consistent with the site.
6. The modal card should be narrower/shorter than the ARMATURE modal and optimized for a 390px mobile viewport.
7. Typography and photo should be scaled down and laid out cleanly inside the card. Avoid oversized headings.
8. Keep both WhatsApp actions distinct:
   - `KONSULTASI VIA WHATSAPP` -> hairstylist's own number
   - `BOOKING VIA ADMIN` -> existing TEAMCUT admin booking flow
9. Do not break the current booking flow, branch switching, gallery, services, queue, or admin logic.
10. Do not introduce horizontal overflow at 375px, 390px, or 430px.
11. Escape/close/backdrop behavior must continue to work.
12. Clicking outside the modal should behave exactly as the current TEAMCUT modal behavior unless the existing implementation says otherwise.
13. Add reduced-motion fallback.
14. Avoid adding a large dependency if GSAP is already available. If TEAMCUT already has an animation library, use the existing one where practical; otherwise use GSAP if it is already installed/loaded.

## Motion direction

Desired feel:
- card lifts off the page
- slight perspective/tilt
- flips through depth
- comes forward
- settles with a tiny overshoot feeling

NOT desired:
- cheap 180deg CSS spin
- generic fade/scale modal
- dramatic dashboard animation
- giant full-screen flip
- excessive bounce

## Validation

After implementation:
- test opening/closing several different hairstylists
- test on 375 / 390 / 430 widths
- verify no horizontal scroll
- verify photo, name, branch, bio, highlights, Instagram, and WhatsApp remain correct
- verify booking CTA still targets admin
- verify individual consultation CTA still targets the hairstylist's number
- verify closing the modal does not leave the page/card transformed
- verify reduced-motion behavior
- check browser console for errors

Finally report:
- files changed
- animation implementation summary
- anything you had to adapt from the ARMATURE reference
- QA results
