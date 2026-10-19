#!/usr/bin/env python3
"""
Puts a city where it will run.

    python3 scripts/scaffold.py --target single  --world world.json --out ./city.html
    python3 scripts/scaffold.py --target vanilla --world world.json --out ./city/
    python3 scripts/scaffold.py --target react   --world world.json --out ./src/components/city/
    python3 scripts/scaffold.py --target vue     --world world.json --out ./src/components/city/
    python3 scripts/scaffold.py --target angular --world world.json --out ./src/app/city/

single  : one self-contained HTML file (engine, styles and world inlined; three.js from a CDN).
          Opens by double-click, can be e-mailed or published as a page.
vanilla : index.html + city-of-living-data.js/.css + world.json (any static host; needs http://, not file://).
react / vue / angular : a component + the engine files + world.json. The app needs `three`
          (npm i three@^0.169) — the engine imports 'three' and 'three/addons/…'.
"""
import argparse, html as H, json, pathlib, shutil, sys

SKILL = pathlib.Path(__file__).resolve().parent.parent
ENGINE_JS = SKILL / "assets/engine/city-of-living-data.js"
ENGINE_CSS = SKILL / "assets/engine/city-of-living-data.css"
ENGINE_DTS = SKILL / "assets/engine/city-of-living-data.d.ts"


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--target", required=True, choices=["single", "vanilla", "react", "vue", "angular"])
    ap.add_argument("--world", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--title", help="page title (default: meta.title)")
    a = ap.parse_args()
    world = json.loads(pathlib.Path(a.world).read_text(encoding="utf-8"))
    title = H.escape(a.title or world.get("meta", {}).get("pageTitle") or world.get("meta", {}).get("title", "City of Living Data"))
    lang = H.escape(world.get("meta", {}).get("locale", "en"))
    out = pathlib.Path(a.out)
    js, css = ENGINE_JS.read_text(encoding="utf-8"), ENGINE_CSS.read_text(encoding="utf-8")

    if a.target == "single":
        tpl = (SKILL / "assets/template/single.html").read_text(encoding="utf-8")
        html = (tpl.replace("__TITLE__", title).replace("__LANG__", lang).replace("__CSS__", css)
                   .replace("__WORLD__", json.dumps(world, ensure_ascii=False).replace("</", "<\\/"))
                   .replace("__ENGINE__", js))
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding="utf-8")
        print(f"wrote {out} ({len(html) // 1024} KB) — open it in a browser")
        return

    out.mkdir(parents=True, exist_ok=True)
    shutil.copy(ENGINE_JS, out / ENGINE_JS.name)
    shutil.copy(ENGINE_CSS, out / ENGINE_CSS.name)
    if a.target in ("react", "vue", "angular"):
        shutil.copy(ENGINE_DTS, out / ENGINE_DTS.name)
    (out / "world.json").write_text(json.dumps(world, ensure_ascii=False, indent=1), encoding="utf-8")
    if a.target == "vanilla":
        (out / "index.html").write_text((SKILL / "assets/template/index.html").read_text(encoding="utf-8").replace("__TITLE__", title), encoding="utf-8")
        print(f"wrote {out}/ — serve it, e.g.  cd {out} && python3 -m http.server 8080")
        return
    comp = {"react": ("react/CityView.tsx", "CityView.tsx"), "vue": ("vue/CityView.vue", "CityView.vue"), "angular": ("angular/city-view.component.ts", "city-view.component.ts")}[a.target]
    shutil.copy(SKILL / "assets/integrations" / comp[0], out / comp[1])
    print(f"wrote {out}/{comp[1]} + engine + world.json")
    print("next: npm i three@^0.169  ·  add the Google Fonts link (Sora + DM Sans) to your index.html (optional)")
    print("      give the component a size (height: 100vh or a fixed height) — the city fills its box")


if __name__ == "__main__":
    sys.exit(main())
