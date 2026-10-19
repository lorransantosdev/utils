#!/usr/bin/env python3
"""
Freezes a live city into a static one: reads every data source once (read-only), applies the same
mapping the engine applies (into / key / map / stateMap), merges the result into the world and drops
`data.sources`. Use it for the copy you e-mail, post or record — a file:// page can't reach your
internal APIs, and a public copy must not keep live connections to production.

    python3 scripts/snapshot.py world.json -o world.snapshot.json [--header "Authorization: Bearer …"]
    python3 scripts/scaffold.py --target single --world world.snapshot.json --out city.html

Then hide private names (`private: true` places/people get an alias) or remove them before sharing.
"""
import argparse, json, re, sys, urllib.request
from datetime import datetime, timezone


def fetch(url, headers):
    req = urllib.request.Request(url, headers={"Accept": "application/json", **headers})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def tpl(s, row):
    return re.sub(r"\{(\w+)\}", lambda m: str(row.get(m.group(1), "")), s)


def rows_to_patch(src, rows):
    into = src.get("into") or "world"
    if into == "world":
        return {} if isinstance(rows, list) else rows
    lst = rows if isinstance(rows, list) else rows.get("rows", [])
    out = []
    for row in lst:
        o = {"id": row.get(src.get("key", "id"))}
        for k, f in (src.get("map") or {}).items():
            o[k] = tpl(f, row) if isinstance(f, str) and "{" in f else row.get(f)
        sm = src.get("stateMap")
        if sm and o.get("state") is not None:
            o["state"] = sm.get(str(o["state"]), sm.get("*", o["state"]))
        out.append(o)
    return {into: out}


def merge(W, patch):
    for key in ("places", "vehicles", "people"):
        by = {str(x.get("id")): x for x in W.setdefault(key, [])}
        for d in patch.get(key, []):
            cur = by.get(str(d.get("id")))
            if cur: cur.update({k: v for k, v in d.items() if k != "id"})
            elif key != "places": W[key].append(d)
    for key in ("kpis", "actions"):
        if key in patch: W[key] = patch[key]
    if patch.get("asOf"): W.setdefault("meta", {})["asOf"] = patch["asOf"]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("world"); ap.add_argument("-o", "--out", required=True)
    ap.add_argument("--header", action="append", default=[], help='extra request header, e.g. "Authorization: Bearer …"')
    a = ap.parse_args()
    W = json.load(open(a.world, encoding="utf-8"))
    headers = dict(h.split(":", 1) for h in a.header); headers = {k.strip(): v.strip() for k, v in headers.items()}
    sources = (W.get("data") or {}).get("sources", [])
    if not sources: sys.exit("no data.sources in this world — nothing to snapshot")
    for s in sources:
        t = s.get("type")
        try:
            if t == "static": rows = s.get("rows") or s.get("patch")
            elif t == "supabase": rows = fetch(f"{s['url'].rstrip('/')}/rest/v1/{s['table']}?select={s.get('select', '*')}", {"apikey": s["anonKey"], "Authorization": f"Bearer {s['anonKey']}", **headers})
            elif t == "http": rows = fetch(s["url"], {**(s.get("headers") or {}), **headers})
            else:
                print(f"  skip {s.get('id')}: {t} is a stream — snapshot its HTTP twin instead"); continue
            merge(W, rows_to_patch(s, rows)); print(f"  ok   {s.get('id')} ({t})")
        except Exception as e:
            sys.exit(f"  fail {s.get('id')}: {e}")
    W.pop("data", None)
    W.setdefault("meta", {}).setdefault("asOf", datetime.now(timezone.utc).isoformat(timespec="seconds"))
    json.dump(W, open(a.out, "w", encoding="utf-8"), ensure_ascii=False)
    print(f"wrote {a.out} — run validate.py on it before sharing")


if __name__ == "__main__":
    main()
