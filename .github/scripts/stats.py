#!/usr/bin/env python3
"""Counts downloads of every skill released in this repo and writes:
  stats/<skill>.json      shields.io endpoint (the README badge reads it)
  stats/history.csv       one line per skill per day: date,skill,total
  skills/STATS.md         a table: total, last 7 days, last 30 days, per version
A download = one download of a release asset named <skill>.zip (any version)."""
import csv, json, os, pathlib, urllib.request
from collections import defaultdict
from datetime import date, timedelta

REPO = os.environ.get("GITHUB_REPOSITORY", "lorransantosdev/utils")
TOKEN = os.environ.get("GITHUB_TOKEN")
ROOT = pathlib.Path(__file__).resolve().parents[2]


def api(path):
    req = urllib.request.Request(f"https://api.github.com/repos/{REPO}{path}", headers={"Accept": "application/vnd.github+json", **({"Authorization": f"Bearer {TOKEN}"} if TOKEN else {})})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def main():
    skills = sorted(p.name for p in (ROOT / "skills").iterdir() if p.is_dir() and not p.name.startswith(("_", ".")) and (p / "SKILL.md").exists())
    total, per_version = defaultdict(int), defaultdict(dict)
    page = 1
    while True:
        rel = api(f"/releases?per_page=100&page={page}")
        if not rel:
            break
        for r in rel:
            for a in r.get("assets", []):
                for s in skills:
                    if a["name"] == f"{s}.zip" or a["name"].startswith(f"{s}-v"):
                        total[s] += a["download_count"]
                        per_version[s][r["tag_name"]] = per_version[s].get(r["tag_name"], 0) + a["download_count"]
        page += 1
    out = ROOT / "stats"; out.mkdir(exist_ok=True)
    hist_file = out / "history.csv"
    rows = list(csv.DictReader(open(hist_file))) if hist_file.exists() else []
    today = date.today().isoformat()
    # one row per skill per day the number changed (no change = no row = no commit)
    last = {r["skill"]: r["total"] for r in rows}
    rows = [r for r in rows if r["date"] != today] + [{"date": today, "skill": s, "total": str(total[s])} for s in skills if last.get(s) != str(total[s])]
    with open(hist_file, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["date", "skill", "total"]); w.writeheader(); w.writerows(sorted(rows, key=lambda r: (r["date"], r["skill"])))

    def at(s, days):
        d = (date.today() - timedelta(days=days)).isoformat()
        past = [int(r["total"]) for r in rows if r["skill"] == s and r["date"] <= d]
        return total[s] - (past[-1] if past else 0)

    lines = ["# Downloads", "", "Counted daily by `.github/workflows/skill-stats.yml`. A download = one download of the skill's zip from a GitHub Release.", "",
             "| skill | total | last 7 days | last 30 days | by version |", "|---|---:|---:|---:|---|"]
    for s in skills:
        (out / f"{s}.json").write_text(json.dumps({"schemaVersion": 1, "label": "downloads", "message": f"{total[s]:,}", "color": "F63B04"}))
        byv = ", ".join(f"{t.split('-v')[-1]}: {n}" for t, n in sorted(per_version[s].items())) or "–"
        lines.append(f"| [{s}](./{s}) | {total[s]:,} | {at(s, 7):,} | {at(s, 30):,} | {byv} |")
    (ROOT / "skills/STATS.md").write_text("\n".join(lines) + "\n")
    print("\n".join(lines))


if __name__ == "__main__":
    main()
