---
name: mobile-performance-guardian
description: Use when implementing or reviewing VFX, glow, particles, animation, backgrounds, loading, asset growth, Matter.js changes, or any feature that could affect FPS, memory, touch responsiveness, or iPhone Safari.
---

# Mobile Performance Guardian

## Role
Act as senior frontend/game performance engineer.

Protect responsive touch and stable performance, especially on iPhone Safari.

## Stack
- Phaser 3.90;
- Matter.js;
- HTML/CSS overlay UI;
- Web Audio;
- Liquid Glass / backdrop-filter;
- GitHub Pages;
- mobile-first;
- Phaser logical width 540;
- render resolution capped at 2.

## Critical rule: no per-frame allocation
Inside `update()` do not repeatedly create:
- Phaser Images;
- Graphics;
- tweens;
- timers;
- emitters;
- DOM nodes.

Reuse objects whenever possible.

## CSS
Prefer animation of:
- `transform`;
- `opacity`.

Avoid animating large:
- blur;
- backdrop-filter;
- box-shadow;
- width/height/layout properties.

Keep Liquid Glass blur static.

## Glow
For jellyfish prefer:
- existing/tinted SVG glow sphere;
- alpha/scale tween.

Avoid a realtime blur filter or dynamic light per character.

## Particles
- small count;
- short lifetime;
- automatic cleanup;
- no permanent emitters unless justified.

## Matter.js
Keep colliders simple.
Do not create polygon bodies for tentacles, fins, tails, or decorative appendages unless explicitly necessary.

## Cleanup
When removing a character, verify cleanup of:
- Matter body;
- sprite/container;
- glow;
- tweens;
- timers;
- particles;
- listeners.

## Asset loading
Current project preloads both worlds.

As worlds/assets grow, monitor:
- initial download;
- decoded texture memory;
- audio size;
- startup time.

For 3+ worlds, evaluate lazy world loading before adding large amounts of content, but do not refactor without measuring.

## Safari checks
Test:
- first load;
- audio unlock;
- tab hide/show;
- lock/unlock phone;
- viewport resize;
- touch cancel;
- world switching;
- 10+ minute session.

## Review workflow
Before implementing a costly feature, estimate:
- simultaneous object count;
- tween count;
- emitter count;
- filters;
- texture memory;
- cleanup path.

Offer a cheaper visual approximation if needed.

## Regression checks
- multiple rapid merges;
- many low-level characters on screen;
- repeated restart;
- repeated world switch;
- pause/resume;
- no accumulating glow/timers;
- no visible FPS drop;
- `npm run check`.

## Final report
State:
- likely performance cost;
- optimizations used;
- object lifecycle;
- Safari risks;
- asset/load impact;
- memory concerns.
