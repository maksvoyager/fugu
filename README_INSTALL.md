# Ready-to-install Codex skills

Copy the contents of this folder into the **root of your game repository**.

After copying, your repo should look like:

```text
fugu/
├── AGENTS.md
├── .agents/
│   └── skills/
│       ├── creative-director/
│       │   └── SKILL.md
│       ├── game-feel-designer/
│       │   └── SKILL.md
│       ├── casual-game-ux-designer/
│       │   └── SKILL.md
│       ├── underwater-art-director/
│       │   └── SKILL.md
│       ├── retention-progression-designer/
│       │   └── SKILL.md
│       └── mobile-performance-guardian/
│           └── SKILL.md
├── assets/
├── src/
├── index.html
└── package.json
```

Codex detects repo skills from `.agents/skills/<skill-name>/SKILL.md`.

Each `SKILL.md` contains YAML metadata (`name`, `description`) plus instructions. Codex can invoke a relevant skill automatically, or you can explicitly mention a skill in Codex.

If Codex is already open when you add these files, restart/reopen the Codex session if the skills do not appear immediately.
