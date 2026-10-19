# Skills

Agent Skills for Claude (Claude.ai, Claude Code and the API). Each folder is one skill.

| skill | what it does | downloads |
|---|---|---|
| [city-of-living-data](./city-of-living-data) | Turns a business, a SaaS or a system into a living 3D city where everything is clickable — monitor data, explain flows, present it on video. | ![downloads](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/lorransantosdev/utils/main/stats/city-of-living-data.json) |

Download numbers per version and per week: [STATS.md](./STATS.md).

## Install a skill

- **Claude (web / desktop):** download `<skill>.zip` from [Releases](https://github.com/lorransantosdev/utils/releases) → **Customize → Skills → + → Upload a skill**.
- **Claude Code:** `/plugin marketplace add lorransantosdev/utils`, then `/plugin install <skill>@lorran-utils` — or copy the folder to `~/.claude/skills/<skill>/`.

## Add a new skill

1. Copy `_template/` to `skills/<new-skill>/` (lowercase, words separated by `-`).
2. In `SKILL.md`, set `name:` to the folder name and write a `description:` that says **what it
   does and when to use it** — that line decides when the skill is picked.
3. Write the instructions. Put long material in `references/`, scripts in `scripts/`, files the
   skill copies or fills in `assets/`. Keep `SKILL.md` short enough to read in one go.
4. Add it to the table above and to `.claude-plugin/marketplace.json` (one entry in `plugins`).
5. Publish a version: **Actions → Release a skill → Run workflow**, tag `<new-skill>-v1.0.0`
   (or create a release with that tag). The workflow zips the folder, creates the release and
   attaches `<new-skill>.zip`; downloads start being counted the next day.

## How downloads are counted

- Every release asset `<skill>.zip` counts its downloads (GitHub keeps the number).
- **Skill download stats** runs daily, sums all versions, writes `stats/<skill>.json` (the
  badge), `stats/history.csv` (one line per day) and [STATS.md](./STATS.md) (total, last 7 and
  30 days, per version). Run it by hand from the Actions tab whenever you want.
- Installs through `git clone` or the Claude Code marketplace are not downloads of the zip, so
  they are not in these numbers; GitHub shows clones of the last 14 days in Insights → Traffic.
