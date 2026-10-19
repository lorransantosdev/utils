# utils

Tools I build and share — starting with **Agent Skills** for Claude.

| | |
|---|---|
| [**skills/**](./skills) | Agent Skills you can install in Claude.ai or Claude Code |
| [city-of-living-data](./skills/city-of-living-data) | Your business, SaaS or system as a living 3D city where everything is clickable ![downloads](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/lorransantosdev/utils/main/stats/city-of-living-data.json) |

![City of Living Data](skills/city-of-living-data/docs/screenshots/overview.png)

### Quick install

```
# Claude Code
/plugin marketplace add lorransantosdev/utils
/plugin install city-of-living-data@lorran-utils
```
Claude (web / desktop): download the zip from [Releases](https://github.com/lorransantosdev/utils/releases) →
Customize → Skills → + → Upload a skill.

### Layout

```
skills/                 one folder per skill (+ _template to start a new one)
dev/                    source of the bigger skills (e.g. the city engine), not needed to use them
stats/                  download numbers, updated daily by a GitHub Action
.claude-plugin/         makes this repo a Claude Code plugin marketplace
.github/workflows/      release a skill from a tag · count downloads
```

---

🇧🇷 **Em português:** aqui ficam as ferramentas que eu crio e compartilho. Cada skill é uma
pasta em `skills/`; para instalar no Claude, baixe o zip em *Releases* e envie em
**Personalizar → Skills**, ou use o comando do Claude Code acima. Para criar uma skill nova,
copie `skills/_template`.

Made by [Lorran Sarmento](https://github.com/lorransantosdev) · MIT
