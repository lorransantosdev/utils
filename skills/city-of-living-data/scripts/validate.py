#!/usr/bin/env python3
"""
Checks a City of Living Data world.json (v2) before you build or ship it.

    python3 scripts/validate.py world.json [--strict]

Errors (exit 1): broken structure or references the engine can't resolve.
Warnings: things that make the city less useful, less interactive or unsafe to share —
read every one. --strict turns warnings into errors (use it in CI).
"""
import json, re, sys

KINDS = {"shop", "office", "tower", "cluster", "park"}
P_STATES = {"wander", "work", "idle", "wait", "drive", "away"}
BLOCKS = {"stats", "bar", "alerts", "timeline", "kv", "funnel", "spark", "note", "chips", "list", "buttons"}
REF_T = {"place", "vehicle", "person", "actions", "home", "action", "companion", "me", "pet", "prop"}
SEV = {"red", "amber", "blue", "muted"}
# personal data that must never be in a city that leaves your machine
PII = [
    (re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b"), "a CPF-like number"),
    (re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b"), "a CNPJ-like number"),
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), "an e-mail address"),
    (re.compile(r"(?<!\d)(?:\+?\d{2}\s?)?\(?\d{2}\)?\s?9?\d{4}-?\d{4}(?!\d)"), "a phone-like number"),
    (re.compile(r"\b[A-Z]{3}-?\d[A-Z0-9]\d{2}\b"), "a licence-plate-like code"),
    (re.compile(r"service_role|sk_live_|-----BEGIN|eyJhbGciOi"), "a secret or token"),
]


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    path, strict = sys.argv[1], "--strict" in sys.argv
    try:
        W = json.load(open(path, encoding="utf-8"))
    except Exception as e:
        sys.exit(f"✗ not valid JSON: {e}")
    E, Wn = [], []
    err, warn = E.append, Wn.append

    meta = W.get("meta", {})
    if not meta.get("title"): warn("meta.title is empty — the city has no name")
    places = W.get("places", [])
    if not places: err("places: at least one place is required")
    pid = [str(p.get("id")) for p in places]
    if len(set(pid)) != len(pid): err("places: duplicate ids")
    non_park = [p for p in places if p.get("kind") != "park"]
    if len(places) + (0 if any(p.get("kind") == "park" for p in places) else 1) > 12:
        err(f"places: {len(places)} places (+ the square) — max 12. Group the smaller ones into a 'cluster' place")
    roles = W.get("roles", {})
    states = {"road", "waiting", "parked"} | set(W.get("states", {}))
    moving = {"road"} | {k for k, v in W.get("states", {}).items() if v.get("moving")}
    vehicles, people, actions = W.get("vehicles", []), W.get("people", []), W.get("actions", [])
    vid = {str(v.get("id")) for v in vehicles}
    perid = {str(p.get("id")) for p in people}
    aid = {str(a.get("id", f"a{i}")) for i, a in enumerate(actions)}
    if len(vid) != len(vehicles): err("vehicles: duplicate ids")
    if len(perid) != len(people): err("people: duplicate ids")

    def check_ref(r, where):
        if not isinstance(r, dict) or r.get("t") not in REF_T:
            return err(f"{where}: ref must be {{t: place|vehicle|person|actions|home…, id}} — got {r}")
        t, i = r.get("t"), str(r.get("id"))
        if t == "place" and i not in pid: err(f"{where}: unknown place '{i}'")
        if t == "vehicle" and i not in vid: err(f"{where}: unknown vehicle '{i}'")
        if t == "person" and i not in perid: err(f"{where}: unknown person '{i}'")
        if t == "action" and i not in aid: err(f"{where}: unknown action '{i}'")

    def check_blocks(bl, where):
        for k, b in enumerate(bl or []):
            t = b.get("type")
            if t not in BLOCKS: err(f"{where}.blocks[{k}]: unknown type '{t}' (use {', '.join(sorted(BLOCKS))})"); continue
            if t in ("stats", "alerts", "timeline", "kv", "funnel", "spark", "chips", "buttons") and not isinstance(b.get("items"), list): err(f"{where}.blocks[{k}] ({t}): needs items[]")
            if t == "bar" and not (isinstance(b.get("value"), (int, float)) and isinstance(b.get("max"), (int, float))): err(f"{where}.blocks[{k}] (bar): value and max must be numbers")
            if t == "list" and b.get("of") not in ("places", "actions", "vehicles", "people"): err(f"{where}.blocks[{k}] (list): of = places|actions|vehicles|people")
            for it in b.get("items", []) if t in ("buttons", "chips") else []:
                if it.get("ref"): check_ref(it["ref"], f"{where}.blocks[{k}]")

    for p in places:
        w = f"place '{p.get('id')}'"
        if p.get("kind", "shop") not in KINDS: err(f"{w}: kind must be one of {', '.join(sorted(KINDS))}")
        if p.get("kind") != "park" and not p.get("name"): warn(f"{w}: no name")
        mine = [v for v in vehicles if str(v.get("place")) == str(p.get("id"))]
        cap = p.get("capacity")
        if mine and p.get("kind") in ("tower", "park"): warn(f"{w}: {len(mine)} vehicles but a {p.get('kind')} has no lot — they won't show")
        if cap and len(mine) > cap: warn(f"{w}: {len(mine)} vehicles for capacity {cap} — the extra ones stay hidden")
        if p.get("kind") == "shop" and len(mine) > 22: warn(f"{w}: more than 22 vehicles — only 22 bays fit")
        if p.get("status") and p["status"] not in ("ok", "warn", "down", "none"): err(f"{w}: status must be ok|warn|down|none")
        if p.get("kind") in ("shop", "office", "tower", "cluster") and not (p.get("page") or {}).get("blocks"): warn(f"{w}: no page.blocks — its panel will only show lists")
        check_blocks((p.get("page") or {}).get("blocks"), w)
        if p.get("inbox", {}) and p.get("inbox", {}).get("ref"): check_ref(p["inbox"]["ref"], f"{w}.inbox")
    for v in vehicles:
        w = f"vehicle '{v.get('id')}'"
        if str(v.get("place")) not in pid: err(f"{w}: unknown place '{v.get('place')}'")
        if v.get("state", "parked") not in states: err(f"{w}: state '{v.get('state')}' is not in states")
        if v.get("driver") and str(v["driver"]) not in perid: err(f"{w}: unknown driver '{v['driver']}'")
        if not v.get("name"): warn(f"{w}: no name")
        if not re.match(r"^#[0-9a-fA-F]{6}$", str(v.get("color", "#000000"))): err(f"{w}: color must be #RRGGBB")
        if v.get("alert") and v["alert"] not in SEV: err(f"{w}: alert must be red|amber|blue|muted")
        check_blocks((v.get("page") or {}).get("blocks"), w)
    for q in people:
        w = f"person '{q.get('id')}'"
        if q.get("place") is not None and str(q.get("place")) not in pid: err(f"{w}: unknown place '{q.get('place')}'")
        if q.get("state", "idle") not in P_STATES: err(f"{w}: state must be one of {', '.join(sorted(P_STATES))}")
        if q.get("role") and q["role"] not in roles and q["role"] not in ("owner", "staff", "driver", "customer", "family"): warn(f"{w}: role '{q['role']}' has no entry in roles (label/color)")
        if q.get("vehicle") and str(q["vehicle"]) not in vid: err(f"{w}: unknown vehicle '{q['vehicle']}'")
        if q.get("state") == "drive" and not q.get("vehicle"): err(f"{w}: state drive needs a vehicle")
        if q.get("state") == "drive" and q.get("vehicle"):
            v = next((x for x in vehicles if str(x.get("id")) == str(q["vehicle"])), None)
            if v and v.get("state") not in moving: warn(f"{w}: drives vehicle {q['vehicle']} but that vehicle is not in a moving state")
        check_blocks((q.get("page") or {}).get("blocks"), w)
    for i, a in enumerate(actions):
        w = f"action '{a.get('id', i)}'"
        if a.get("sev", "amber") not in SEV: err(f"{w}: sev must be red|amber|blue|muted")
        if not a.get("title"): err(f"{w}: title is required")
        if a.get("place") is not None and str(a["place"]) not in pid: err(f"{w}: unknown place '{a['place']}'")
        if a.get("target"): check_ref(a["target"], w)
        if not a.get("target") and not a.get("place"): warn(f"{w}: no place or target — clicking it goes nowhere")
    for i, k in enumerate(W.get("kpis", [])):
        if k.get("ref"): check_ref(k["ref"], f"kpis[{i}]")
        if isinstance(k.get("value"), (int, float)) and not k.get("sub") and not k.get("ref"): warn(f"kpis[{i}] '{k.get('label')}': a number with no comparison (sub: 'of 22', '+8% vs last week')")
    check_blocks((W.get("home") or {}).get("blocks"), "home")
    for j, J in enumerate(W.get("journeys", []) + ([{"title": "tour", "steps": W["tour"]["steps"]}] if (W.get("tour") or {}).get("steps") else [])):
        for k, s in enumerate(J.get("steps", [])):
            w = f"journey '{J.get('title')}' step {k + 1}"
            mv = s.get("move")
            if mv:
                for e in ("from", "to"):
                    if str(mv.get(e)) not in pid: err(f"{w}: move.{e} '{mv.get(e)}' is not a place")
            if s.get("place") is not None and str(s["place"]) not in pid: err(f"{w}: unknown place '{s['place']}'")
            if s.get("ref"): check_ref(s["ref"], w)
            if s.get("enter") and (s.get("ref") or {}).get("t") != "place": err(f"{w}: enter needs ref {{t:'place'}}")
    tl = W.get("timeline")
    if tl:
        for k, e in enumerate(tl.get("events", [])):
            if not e.get("at"): err(f"timeline.events[{k}]: at (ISO date) is required")
            if e.get("vehicle") and str(e["vehicle"]) not in vid: err(f"timeline.events[{k}]: unknown vehicle '{e['vehicle']}'")
            if e.get("state") and e["state"] not in states: err(f"timeline.events[{k}]: unknown state '{e['state']}'")
    for s in (W.get("data") or {}).get("sources", []):
        if s.get("type") not in ("http", "supabase", "sse", "ws", "static"): err(f"data source '{s.get('id')}': type must be http|supabase|sse|ws|static")
        if s.get("type") == "supabase" and re.search(r"service_role", json.dumps(s)): err(f"data source '{s.get('id')}': never put a service_role key in the browser")

    # everything interactive: who has something to say
    silent_p = [q for q in people if not q.get("lines") and q.get("state") != "away"]
    if people and len(silent_p) > len(people) * .5: warn(f"{len(silent_p)} of {len(people)} people have no lines — clicking them only waves. Give each role 1–3 lines with real numbers")
    if vehicles and not any(v.get("lines") or v.get("stateText") for v in vehicles): warn("vehicles have no lines/stateText — give them something to say")
    if not actions: warn("no actions — the drawer opens with nothing to do. Monitoring cities should rank what needs attention")
    if not W.get("companions"): pass
    # privacy
    blob = json.dumps(W, ensure_ascii=False)
    for rx, what in PII:
        m = rx.search(blob)
        if m: warn(f"possible personal data: {what} ('{m.group(0)[:24]}') — remove before sharing")
    priv = [p for p in places if p.get("private")]
    if not priv and meta.get("purpose") != "explain" and any(p.get("kind") in ("shop", "cluster") for p in places): warn("no place is private: true — the 'Hide names' button won't appear (needed to record videos with real customers)")

    for e in E: print("✗", e)
    for w in Wn: print("!", w)
    print(f"{'✗' if E else '✓'} {len(E)} error(s), {len(Wn)} warning(s) · {len(places)} places · {len(vehicles)} vehicles · {len(people)} people · {len(actions)} actions")
    sys.exit(1 if E or (strict and Wn) else 0)


if __name__ == "__main__":
    main()
