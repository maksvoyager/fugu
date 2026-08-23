# Codex project instructions

This repository is a mobile-first underwater casual merge game built with Phaser 3 and Matter.js.

## Persistent project facts
- Main gameplay scene: `src/game.js`, `FruitScene`.
- World and character configuration: `src/worlds.js`, `WORLDS`.
- Worlds: `fugu` («Лагуна фугу») and `jellyfish` («Лунная бухта»).
- 9 levels per world; `9 + 9` removes both characters and play continues.
- UI uses HTML/CSS Liquid Glass over Phaser.
- Deployment target includes GitHub Pages.
- Prioritize iPhone Safari compatibility.
- Preserve existing saves and relative asset paths.
- Run `npm run check` after code changes.

## Project skills
Use the skills under `.agents/skills/` when relevant:
- `creative-director` — major feature scope and prioritization.
- `game-feel-designer` — merge/release/unlock/VFX feel.
- `casual-game-ux-designer` — mobile UX, menus, HUD, Atlas.
- `underwater-art-director` — visual consistency and world art direction.
- `retention-progression-designer` — collection, unlocks, goals, replay.
- `mobile-performance-guardian` — FPS, memory, loading, Safari safety.

For a large visual/gameplay feature, prefer:
1. Creative Director review.
2. Relevant specialist skill.
3. Mobile Performance Guardian review.
4. Implementation and checks.

Do not duplicate existing systems without inspecting the current implementation first.
