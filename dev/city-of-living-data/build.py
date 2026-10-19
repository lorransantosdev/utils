#!/usr/bin/env python3
"""Builds the engine from engine/parts/*.js (concatenated in order) into the skill:
   skills/city-of-living-data/assets/engine/city-of-living-data.{js,css}
   and refreshes the example worlds.
usage: python3 dev/city-of-living-data/build.py"""
import pathlib, shutil, subprocess, sys
HERE = pathlib.Path(__file__).resolve().parent
SKILL = HERE.parents[1] / "skills/city-of-living-data"
js = "\n".join(p.read_text() for p in sorted((HERE / "engine/parts").glob("*.js")))
(SKILL / "assets/engine/city-of-living-data.js").write_text(js)
shutil.copy(HERE / "engine/city.css", SKILL / "assets/engine/city-of-living-data.css")
shutil.copy(HERE / "engine/single.html", SKILL / "assets/template/single.html")
subprocess.run([sys.executable, str(HERE / "examples/make.py")], check=True)
for f in (HERE / "examples").glob("*.world.json"):
    shutil.move(str(f), SKILL / "assets/examples" / f.name)
print("engine", len(js), "bytes →", SKILL / "assets/engine")
