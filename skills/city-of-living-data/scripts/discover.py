#!/usr/bin/env python3
"""
Discover what a city should contain by reading the user's code — BEFORE asking questions.

    python3 scripts/discover.py <repo-or-folder> [more folders...] -o discovery.json [--draft world.draft.json]

Reads (standard library only; uses PyYAML if installed, otherwise a small YAML subset parser):
  docker-compose*.yml      services, images, ports, depends_on, env URLs -> services + calls
  Kubernetes manifests     Deployments/StatefulSets/CronJobs/Services, env URLs -> services + calls
  OpenAPI / Swagger        API title + routes
  SQL migrations (*.sql)   CREATE TABLE + REFERENCES -> tables + relations (Flyway, Liquibase SQL, plain)
  schema.prisma            models + relations
  Spring (Java/Kotlin)     @RestController routes, @FeignClient targets, spring.application.name
  Node                     package.json (framework -> kind), Express/Nest routes
  .env / application.*     *_URL / *_HOST pointing at other services -> calls
  Terraform                aws_/google_/azurerm_ databases, queues, buckets, functions

Writes discovery.json (evidence for every finding) and prints a short summary to show the user.
With --draft it also writes a world.draft.json (v2: places, a first journey) to refine with the user.
Everything is a *proposal*: confirm it in the City Brief, then fill vehicles, people, lines and pages.
"""
import argparse
import json
import os
import re
import sys
from collections import defaultdict

SKIP_DIRS = {".git", "node_modules", "dist", "build", "target", "out", ".next", ".nuxt", ".angular", "vendor",
             ".venv", "venv", "__pycache__", ".gradle", ".idea", ".vscode", "coverage", ".terraform", "bin", "obj"}
MAX_BYTES = 1_500_000

KIND_RULES = [  # (regex on name/image, kind)
    (r"postgres|mysql|mariadb|mongo|cockroach|sqlserver|mssql|oracle|cassandra|dynamo|firestore|supabase-db|[-_]db\b|\bdb[-_]|database", "database"),
    (r"redis|memcache|valkey|hazelcast", "cache"),
    (r"kafka|rabbit|nats|zookeeper|pulsar|activemq|sqs|sns|pubsub|eventbridge|kinesis|redpanda", "queue"),
    (r"elastic|opensearch|meili|solr|typesense", "search"),
    (r"nginx|traefik|envoy|kong|haproxy|gateway|ingress|apisix|krakend", "gateway"),
    (r"keycloak|auth|oauth|identity|cognito|okta", "auth"),
    (r"minio|s3|bucket|storage|blob", "storage"),
    (r"frontend|front|web|ui|portal|app-web|angular|react|next|nuxt|vue|site|admin-ui|dashboard", "frontend"),
    (r"worker|consumer|job|cron|scheduler|batch|processor", "worker"),
    (r"prometheus|grafana|jaeger|tempo|loki|otel|zipkin|datadog", "observability"),
    (r"mailhog|smtp|ses|sendgrid|mail|notification|notify|sms|push", "service"),
]
TYPE_BY_KIND = {"frontend": "shop", "gateway": "hq", "service": "office", "worker": "warehouse", "queue": "dome",
                "database": "tank", "cache": "tower", "storage": "tank", "auth": "tower", "search": "tower",
                "external": "office", "observability": "dome"}


def guess_kind(*names):
    text = " ".join(n for n in names if n).lower()
    for rx, kind in KIND_RULES:
        if re.search(rx, text):
            return kind
    return "service"


# ---------------------------------------------------------------- tiny YAML subset (fallback)
def _scalar(v):
    v = v.strip()
    if not v:
        return None
    if v[0] in "'\"" and v[-1:] == v[0]:
        return v[1:-1]
    if v in ("true", "false"):
        return v == "true"
    if re.fullmatch(r"-?\d+", v):
        return int(v)
    if v.startswith("[") and v.endswith("]"):
        return [_scalar(x) for x in v[1:-1].split(",") if x.strip()]
    if v.startswith("{") and v.endswith("}"):
        out = {}
        for part in v[1:-1].split(","):
            if ":" in part:
                k, val = part.split(":", 1)
                out[k.strip().strip("'\"")] = _scalar(val)
        return out
    return v


def mini_yaml(text):
    """Handles maps, lists, '- key: v' list items, inline lists/maps, comments, block scalars (skipped)."""
    docs, lines = [], []
    for raw in text.split("\n"):
        if raw.strip() == "---":
            docs.append(lines); lines = []
        else:
            lines.append(raw)
    docs.append(lines)
    out = []
    for doc in docs:
        toks = []
        skip_indent = None
        for raw in doc:
            line = re.sub(r"(^|\s)#.*$", "", raw).rstrip()
            if not line.strip():
                continue
            ind = len(line) - len(line.lstrip())
            if skip_indent is not None:
                if ind > skip_indent:
                    continue
                skip_indent = None
            if re.search(r":\s*[|>][-+]?\s*$", line):
                skip_indent = ind
                line = re.sub(r":\s*[|>][-+]?\s*$", ": ''", line)
            toks.append((ind, line.strip()))
        if not toks:
            continue

        def parse(i, ind):
            if toks[i][1].startswith("- "):
                lst = []
                while i < len(toks) and toks[i][0] == ind and toks[i][1].startswith("- "):
                    item = toks[i][1][2:]
                    m = re.match(r"^([^:'\"\s][^:]*?):(\s+(.*))?$", item)
                    if m and not item.startswith("{"):
                        # list of maps: rewrite the item as a map at indent ind+2
                        sub_ind = ind + 2
                        toks[i] = (sub_ind, item)
                        val, i = parse_map(i, sub_ind)
                        lst.append(val)
                    else:
                        lst.append(_scalar(item)); i += 1
                return lst, i
            return parse_map(i, ind)

        def parse_map(i, ind):
            mp = {}
            while i < len(toks) and toks[i][0] == ind and not toks[i][1].startswith("- "):
                m = re.match(r"^(['\"]?)([^:]+?)\1:(\s+(.*))?$", toks[i][1])
                if not m:
                    i += 1; continue
                key, rest = m.group(2).strip(), (m.group(4) or "").strip()
                i += 1
                if rest:
                    mp[key] = _scalar(rest)
                elif i < len(toks) and (toks[i][0] > ind or (toks[i][0] == ind and toks[i][1].startswith("- "))):
                    mp[key], i = parse(i, toks[i][0])
                else:
                    mp[key] = None
            return mp, i

        try:
            val, _ = parse(0, toks[0][0])
            out.append(val)
        except Exception:  # noqa: BLE001
            pass
    return out


def load_yaml_docs(text):
    try:
        import yaml  # type: ignore
        return [d for d in yaml.safe_load_all(text) if d is not None]
    except ImportError:
        return mini_yaml(text)
    except Exception:  # noqa: BLE001
        return mini_yaml(text)


# ---------------------------------------------------------------- discovery
class Found:
    def __init__(self):
        self.aliases = {}        # other name for the same deployable -> canonical name
        self.services = {}       # name -> dict
        self.edges = {}          # (a, b) -> evidence
        self.tables = {}         # name -> {fks, evidence}
        self.apis = []
        self.files_read = 0
        self.build_dirs = []     # (abs dir, compose name)
        self.rel_base = {}

    def abs_of(self, rel):
        return self.rel_base.get(rel, rel)

    def service(self, name, kind=None, evidence=None, **kw):
        name = re.sub(r"[^a-z0-9_.-]+", "-", str(name).lower()).strip("-")
        if not name:
            return None
        s = self.services.setdefault(name, {"name": name, "kind": kind or guess_kind(name), "evidence": [], "routes": [], "ports": [], "tech": []})
        if kind and s["kind"] in ("service",) and kind != "service":
            s["kind"] = kind
        if evidence and evidence not in s["evidence"]:
            s["evidence"].append(evidence)
        for k, v in kw.items():
            if isinstance(v, list):
                s[k] = sorted(set(s.get(k, []) + [x for x in v if x is not None]), key=str)
            elif v:
                s[k] = v
        return name

    def edge(self, a, b, evidence):
        if a and b and a != b:
            self.edges.setdefault((a, b), evidence)


URL_HOST = re.compile(r"(?:https?|grpc|amqp|kafka|redis|postgres(?:ql)?|mysql|mongodb(?:\+srv)?|jdbc:\w+)://(?:[^@/\s]+@)?([a-zA-Z0-9_.-]+)")
HOSTISH = re.compile(r"^(?:[A-Z0-9_]*_(?:URL|URI|HOST|ADDR|ENDPOINT|BROKERS?|SERVERS?))$")


SCHEME_KIND = {"postgres": "database", "postgresql": "database", "mysql": "database", "mongodb": "database", "mongodb+srv": "database",
               "redis": "cache", "kafka": "queue", "amqp": "queue"}
INTERNAL_TLDS = (".local", ".internal", ".svc", ".cluster", ".lan", ".corp")


def hosts_in(value):
    """Service names referenced by URLs. Internal hosts -> first label; public domains -> brand (api.stripe.com -> stripe)."""
    out = []
    for m in URL_HOST.finditer(str(value)):
        host = m.group(1).lower()
        if "." in host and not host.endswith(INTERNAL_TLDS) and not re.fullmatch(r"[\d.]+", host):
            parts = host.split(".")
            out.append(parts[-2] if len(parts) >= 2 else parts[0])
        else:
            out.append(host.split(".")[0])
    return out


def host_kind(value):
    m = re.match(r"\s*(?:jdbc:)?([a-z+]+)://([^/\s]+)", str(value))
    if not m:
        return None
    host = m.group(2).split("@")[-1].split(":")[0]
    if "." in host and not host.endswith(INTERNAL_TLDS) and not re.fullmatch(r"[\d.]+", host):
        return "external"
    return SCHEME_KIND.get(m.group(1))


def handle_compose(path, docs, F):
    for doc in docs:
        services = (doc or {}).get("services") if isinstance(doc, dict) else None
        if not isinstance(services, dict):
            continue
        names = set(services)
        for name, svc in services.items():
            svc = svc or {}
            image = str(svc.get("image", "") or "")
            ports = [str(p) for p in (svc.get("ports") or [])] if isinstance(svc.get("ports"), list) else []
            F.service(name, guess_kind(name, image), f"{path}: services.{name}", image=image or None, ports=ports)
            build = svc.get("build")
            ctx = build.get("context") if isinstance(build, dict) else build
            if ctx:  # the code folder built by this service is the same deployable
                F.build_dirs.append((os.path.normpath(os.path.join(os.path.dirname(F.abs_of(path)), str(ctx))), name))
            deps = svc.get("depends_on") or []
            deps = list(deps) if isinstance(deps, (list, dict)) else []
            for d in deps:
                F.edge(F.service(name), F.service(d), f"{path}: {name}.depends_on")
            env = svc.get("environment") or {}
            vals = list(env.values()) if isinstance(env, dict) else [str(e).split("=", 1)[-1] for e in env]
            for v in vals:
                for h in hosts_in(v):
                    if h in names or host_kind(v) == "external":
                        F.edge(F.service(name), F.service(h, host_kind(v), f"{path}: {name}.environment"), f"{path}: {name}.environment")


def handle_k8s(path, docs, F):
    known = []
    for doc in docs:
        if not isinstance(doc, dict) or "kind" not in doc:
            continue
        kind = doc.get("kind")
        name = ((doc.get("metadata") or {}).get("name"))
        if kind in ("Deployment", "StatefulSet", "DaemonSet", "CronJob", "Job") and name:
            spec = doc.get("spec") or {}
            tmpl = (spec.get("jobTemplate", {}) or {}).get("spec", {}).get("template") if kind == "CronJob" else spec.get("template")
            containers = (((tmpl or {}).get("spec") or {}).get("containers")) or []
            image = " ".join(str(c.get("image", "")) for c in containers if isinstance(c, dict))
            k = "worker" if kind in ("CronJob", "Job") else guess_kind(name, image)
            F.service(name, k, f"{path}: {kind}/{name}", image=image or None)
            for c in containers:
                for e in (c or {}).get("env") or []:
                    if isinstance(e, dict) and e.get("value"):
                        for h in hosts_in(e["value"]):
                            known.append((name, h, f"{path}: {name} env {e.get('name')}", host_kind(e["value"])))
        elif kind == "Service" and name:
            F.service(name, None, f"{path}: Service/{name}")
    for a, h, ev, k in known:
        F.edge(F.service(a), F.service(h, k, ev), ev)


def handle_openapi(path, doc, F):
    info = doc.get("info") or {}
    title = info.get("title") or os.path.basename(os.path.dirname(path))
    routes = []
    for p, ops in (doc.get("paths") or {}).items():
        if isinstance(ops, dict):
            for m in ops:
                if m.lower() in ("get", "post", "put", "patch", "delete"):
                    routes.append(f"{m.upper()} {p}")
    F.apis.append({"title": title, "file": path, "routes": routes[:200]})


SQL_TABLE = re.compile(r"create\s+table\s+(?:if\s+not\s+exists\s+)?([\"`\[]?[\w.]+[\"`\]]?)\s*\((.*?)\)\s*;", re.I | re.S)
SQL_FK = re.compile(r"references\s+([\"`\[]?[\w.]+[\"`\]]?)", re.I)


def handle_sql(path, text, F):
    for m in SQL_TABLE.finditer(text):
        t = m.group(1).strip('"`[]').split(".")[-1].lower()
        fks = sorted({x.strip('"`[]').split(".")[-1].lower() for x in SQL_FK.findall(m.group(2))} - {t})
        e = F.tables.setdefault(t, {"fks": [], "evidence": path})
        e["fks"] = sorted(set(e["fks"]) | set(fks))
    for m in re.finditer(r"alter\s+table\s+([\w.\"]+).*?references\s+([\w.\"]+)", text, re.I | re.S):
        a, b = (x.strip('"').split(".")[-1].lower() for x in m.groups())
        if a in F.tables and a != b:
            F.tables[a]["fks"] = sorted(set(F.tables[a]["fks"]) | {b})


def handle_prisma(path, text, F):
    models = re.findall(r"model\s+(\w+)\s*\{(.*?)\}", text, re.S)
    names = {m[0] for m in models}
    for name, body in models:
        fks = sorted({t for t in re.findall(r"^\s*\w+\s+(\w+)(?:\[\])?\??\s", body, re.M) if t in names and t != name})
        F.tables[name.lower()] = {"fks": [f.lower() for f in fks], "evidence": path}


def module_of(path, roots):
    """Nearest folder with a build file = the deployable this file belongs to."""
    d = os.path.dirname(path)
    while True:
        for marker in ("package.json", "pom.xml", "build.gradle", "build.gradle.kts", "go.mod", "Dockerfile", "pyproject.toml", "Cargo.toml"):
            if os.path.exists(os.path.join(d, marker)):
                return d
        if d in roots or os.path.dirname(d) == d:
            return d
        d = os.path.dirname(d)


def module_name(mod):
    pj = os.path.join(mod, "package.json")
    if os.path.exists(pj):
        try:
            n = json.load(open(pj, encoding="utf-8")).get("name")
            if n:
                return n.split("/")[-1]
        except Exception:  # noqa: BLE001
            pass
    for f in ("application.yml", "application.yaml", "application.properties"):
        for sub in ("src/main/resources", ""):
            p = os.path.join(mod, sub, f)
            if os.path.exists(p):
                m = re.search(r"(?:spring\.application\.name\s*=\s*|application:\s*\n\s*name:\s*)([\w-]+)", open(p, encoding="utf-8", errors="ignore").read())
                if m:
                    return m.group(1)
    return os.path.basename(os.path.abspath(mod))


def handle_code(path, text, F, roots):
    ext = os.path.splitext(path)[1]
    mod = module_of(path, roots)
    me = None
    if ext in (".java", ".kt"):
        base = re.search(r"@RequestMapping\(\s*(?:value\s*=\s*|path\s*=\s*)?\"([^\"]*)\"", text)
        if "@RestController" in text or "@Controller" in text:
            me = F.service(module_name(mod), None, path, tech=["spring"])
            prefix = base.group(1) if base else ""
            routes = [f"{v.upper()} {prefix}{p}" for v, p in re.findall(r"@(Get|Post|Put|Patch|Delete)Mapping\(\s*(?:value\s*=\s*|path\s*=\s*)?\"([^\"]*)\"", text)]
            F.service(me, routes=routes)
        for m in re.finditer(r"@FeignClient\(([^)]*)\)", text):
            args = m.group(1)
            tgt = re.search(r"(?:name|value)\s*=\s*\"([^\"]+)\"", args) or re.search(r"\"([^\"]+)\"", args)
            if tgt:
                me = me or F.service(module_name(mod), None, path, tech=["spring"])
                F.edge(me, F.service(tgt.group(1), None, f"{path}: @FeignClient"), f"{path}: @FeignClient")
        if re.search(r"@KafkaListener|KafkaTemplate", text):
            me = me or F.service(module_name(mod), None, path, tech=["spring"])
            for t in re.findall(r"topics?\s*=\s*\{?\s*\"([^\"]+)\"", text):
                F.service(f"topic-{t}", "queue", path)
    elif ext in (".ts", ".js", ".mjs"):
        routes = [f"{v.upper()} {p}" for v, p in re.findall(r"\b(?:app|router|server)\.(get|post|put|patch|delete)\(\s*['\"`]([^'\"`]+)", text)]
        nest = re.search(r"@Controller\(\s*['\"]([^'\"]*)", text)
        if nest:
            pre = "/" + nest.group(1).strip("/")
            routes += [f"{v.upper()} {pre}/{p}".rstrip("/") for v, p in re.findall(r"@(Get|Post|Put|Patch|Delete)\(\s*['\"]?([^'\")]*)", text)]
        if routes:
            me = F.service(module_name(mod), None, path, routes=routes)
        for u in re.findall(r"(?:fetch|axios\.\w+|http\.\w+|got)\(\s*[`'\"](https?://[^`'\"]+)", text):
            for h in hosts_in(u):
                F.edge(me or F.service(module_name(mod), None, path), F.service(h, host_kind(u), path), f"{path}: HTTP call")


def handle_env(path, text, F, roots):
    mod = module_of(path, roots)
    me = None
    for line in text.splitlines():
        m = re.match(r"\s*([A-Za-z0-9_.-]+)\s*[=:]\s*(.+)", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2).strip().strip("'\"")
        if HOSTISH.match(key.upper().replace(".", "_").replace("-", "_")) or "://" in val:
            for h in hosts_in(val):
                if h in ("localhost", "127", "0", "host"):
                    continue
                me = me or F.service(module_name(mod), None, path)
                F.edge(me, F.service(h, host_kind(val), f"{path}: {key}"), f"{path}: {key}")


def handle_package_json(path, F):
    try:
        pj = json.load(open(path, encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return
    deps = {**pj.get("dependencies", {}), **pj.get("devDependencies", {})}
    tech = [t for t in ("@angular/core", "react", "next", "vue", "nuxt", "svelte", "express", "@nestjs/core", "fastify", "koa") if t in deps]
    if not tech or pj.get("workspaces"):
        return
    kind = "frontend" if any(t in tech for t in ("@angular/core", "react", "next", "vue", "nuxt", "svelte")) and not any(t in tech for t in ("express", "@nestjs/core", "fastify", "koa")) else "service"
    F.service(pj.get("name", os.path.basename(os.path.dirname(path))).split("/")[-1], kind, path, tech=tech)


TF_RES = re.compile(r'resource\s+"((?:aws|google|azurerm)_[a-z0-9_]+)"\s+"([\w-]+)"')


def handle_terraform(path, text, F):
    for rtype, name in TF_RES.findall(text):
        kind = None
        if re.search(r"db_instance|rds|dynamodb|sql_database|cosmosdb|spanner|firestore", rtype):
            kind = "database"
        elif re.search(r"sqs|sns|pubsub|eventbridge|kinesis|servicebus|msk", rtype):
            kind = "queue"
        elif re.search(r"s3_bucket$|storage_bucket|storage_account", rtype):
            kind = "storage"
        elif re.search(r"lambda_function|cloudfunctions|function_app|cloud_run|ecs_service", rtype):
            kind = "service"
        elif re.search(r"elasticache|redis", rtype):
            kind = "cache"
        elif re.search(r"api_gateway|apigateway|lb$|alb|load_balancer", rtype):
            kind = "gateway"
        if kind:
            F.service(name, kind, f"{path}: {rtype}.{name}", tech=[rtype])


def walk(roots, F):
    for root in roots:
        for dp, dns, fns in os.walk(root):
            dns[:] = [d for d in dns if d not in SKIP_DIRS and not d.startswith(".")]
            for fn in fns:
                p = os.path.join(dp, fn)
                try:
                    if os.path.getsize(p) > MAX_BYTES:
                        continue
                except OSError:
                    continue
                low = fn.lower()
                ext = os.path.splitext(low)[1]
                try:
                    if ext in (".yml", ".yaml", ".json", ".sql", ".prisma", ".java", ".kt", ".ts", ".js", ".mjs", ".properties", ".tf") or low.startswith(".env"):
                        text = open(p, encoding="utf-8", errors="ignore").read()
                    else:
                        continue
                except OSError:
                    continue
                F.files_read += 1
                rel = os.path.relpath(p, os.path.dirname(os.path.abspath(root)))
                F.rel_base[rel] = p
                if ext in (".yml", ".yaml"):
                    if "compose" in low:
                        handle_compose(rel, load_yaml_docs(text), F)
                    elif re.search(r"^\s*(openapi|swagger)\s*:", text, re.M):
                        docs = load_yaml_docs(text)
                        if docs and isinstance(docs[0], dict):
                            handle_openapi(rel, docs[0], F)
                    elif re.search(r"^kind:\s*\w+", text, re.M) and "apiVersion" in text:
                        handle_k8s(rel, load_yaml_docs(text), F)
                    elif low.startswith("application"):
                        handle_env(p, text, F, roots)
                elif ext == ".json":
                    if low == "package.json":
                        handle_package_json(p, F)
                    elif '"openapi"' in text[:300] or '"swagger"' in text[:300]:
                        try:
                            handle_openapi(rel, json.loads(text), F)
                        except ValueError:
                            pass
                elif ext == ".sql":
                    handle_sql(rel, text, F)
                elif ext == ".prisma":
                    handle_prisma(rel, text, F)
                elif ext in (".java", ".kt", ".ts", ".js", ".mjs"):
                    if "/test" not in p.replace("\\", "/") and ".spec." not in low and ".test." not in low:
                        handle_code(p, text, F, roots)
                elif ext == ".properties" or low.startswith(".env"):
                    handle_env(p, text, F, roots)
                elif ext == ".tf":
                    handle_terraform(rel, text, F)


def merge_build_aliases(F):
    """compose `build: ./web-app` + package.json name "web-app" are one deployable: keep the compose name."""
    for d, canonical in F.build_dirs:
        names = {os.path.basename(d).lower()}
        try:
            names.add(module_name(d).lower())
        except Exception:  # noqa: BLE001
            pass
        for n in names:
            n = re.sub(r"[^a-z0-9_.-]+", "-", n).strip("-")
            if n != canonical and n in F.services and canonical in F.services:
                src, dst = F.services.pop(n), F.services[canonical]
                for k in ("evidence", "routes", "ports", "tech"):
                    dst[k] = sorted(set(dst.get(k, [])) | set(src.get(k, [])), key=str)
                if dst["kind"] == "service" and src["kind"] != "service":
                    dst["kind"] = src["kind"]
                F.edges = {(canonical if a == n else a, canonical if b == n else b): e for (a, b), e in F.edges.items()}
                F.edges = {k: v for k, v in F.edges.items() if k[0] != k[1]}


def to_draft(F, title, locale="en", purpose=None):
    """A v2 world proposal: one place per deployable (max 12), infra grouped into one Platform tower,
    a first journey along the discovered calls. Everything is a proposal for the City Brief."""
    infra_kinds = {"database", "cache", "queue", "storage", "search", "external"}
    kind_of = {"frontend": "shop", "gateway": "office", "auth": "office", "service": "office", "worker": "office"}
    deg = defaultdict(int)
    for (a, b) in F.edges:
        deg[a] += 1; deg[b] += 1
    apps = sorted((s for s in F.services.values() if s["kind"] not in infra_kinds), key=lambda s: (-deg[s["name"]], s["name"]))
    infra = [s for s in F.services.values() if s["kind"] in infra_kinds]
    keep, rest = apps[:10], apps[10:]
    places = []
    for s in keep:
        what = f"{s['kind'].capitalize()} discovered in {s['evidence'][0] if s['evidence'] else 'the codebase'}."
        if s.get("routes"):
            what += f" Routes: {', '.join(s['routes'][:4])}{'…' if len(s['routes']) > 4 else ''}"
        calls = sorted({b for (a, b) in F.edges if a == s["name"]})
        places.append({"id": s["name"], "kind": kind_of.get(s["kind"], "office"), "name": s["name"].replace("-", " ").replace("_", " ").title(),
                       "sub": "TODO: one sentence — what it does, for whom", "floors": 2,
                       "page": {"blocks": [{"type": "note", "text": what}, {"type": "kv", "title": "Talks to", "items": [[c, "calls"] for c in calls[:6]]}]}})
    if rest:
        places.append({"id": "more", "kind": "cluster", "name": "More services", "sub": ", ".join(s["name"] for s in rest[:12]),
                       "page": {"blocks": [{"type": "note", "text": "Grouped to keep the city readable: " + ", ".join(s["name"] for s in rest)}]}})
    if infra:
        places.append({"id": "platform", "kind": "tower", "name": "Platform", "floors": min(6, max(2, len(infra))), "sub": "Databases, queues and caches",
                       "page": {"blocks": [{"type": "kv", "title": "Infrastructure", "items": [[s["name"], s["kind"]] for s in infra[:12]]}]}})
    ids = {p["id"] for p in places}
    # a first journey: walk the call graph from the entry point
    entry = next((s["name"] for s in keep if s["kind"] in ("frontend", "gateway")), keep[0]["name"] if keep else None)
    steps, seen, cur = [], {entry}, entry
    if entry:
        steps.append({"place": entry, "title": f"1 · {entry}", "text": "TODO: what happens here"})
        while True:
            nxt = next((b for (a, b) in sorted(F.edges) if a == cur and b in ids and b not in seen), None)
            if not nxt or len(steps) >= 8:
                break
            steps.append({"move": {"from": cur, "to": nxt, "say": "TODO: request"}, "title": f"{len(steps) + 1} · {nxt}", "text": "TODO: what this step does", "payload": "TODO: example request"})
            seen.add(nxt); cur = nxt
    return {
        "version": 2,
        "meta": {"title": title, "subtitle": "Discovered from the codebase — review before publishing", "locale": locale, "palette": "cream", **({"purpose": purpose} if purpose else {})},
        "roles": {"eng": {"label": "Engineer", "color": "#6366F1"}},
        "places": places, "vehicles": [], "people": [], "actions": [], "kpis": [],
        "journeys": [{"title": "TODO: main journey", "steps": steps}] if len(steps) > 1 else [],
    }


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="+")
    ap.add_argument("-o", "--out", default="discovery.json")
    ap.add_argument("--draft", help="also write a v2 world.draft.json proposal")
    ap.add_argument("--title", default=None)
    ap.add_argument("--locale", default="en", help="UI language of the draft, e.g. pt-BR")
    ap.add_argument("--purpose", choices=["explain", "monitor", "both"], help="the goal chosen in Phase 1")
    a = ap.parse_args()
    roots = [os.path.abspath(p) for p in a.paths]
    for r in roots:
        if not os.path.isdir(r):
            sys.exit(f"not a folder: {r}")
    F = Found()
    walk(roots, F)
    merge_build_aliases(F)
    # drop observability noise and orphan hosts that were only seen once in an env var with no other evidence
    observability = sorted(k for k, v in F.services.items() if v["kind"] == "observability")
    services = {k: v for k, v in F.services.items() if v["kind"] != "observability"}
    F.services = services
    F.edges = {k: v for k, v in F.edges.items() if k[0] in services and k[1] in services}
    report = {
        "roots": a.paths, "files_read": F.files_read,
        "services": sorted(F.services.values(), key=lambda s: (s["kind"], s["name"])),
        "calls": [{"from": x, "to": y, "evidence": e} for (x, y), e in sorted(F.edges.items())],
        "apis": F.apis,
        "tables": [{"name": k, **v} for k, v in sorted(F.tables.items())],
        # not buildings, but likely data sources for a monitoring city (Phase 1, step 3)
        "data_source_hints": observability,
    }
    json.dump(report, open(a.out, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    by_kind = defaultdict(list)
    for s in report["services"]:
        by_kind[s["kind"]].append(s["name"])
    print(f"Read {F.files_read} files under {', '.join(a.paths)}")
    for k in ("frontend", "gateway", "auth", "service", "worker", "queue", "database", "cache", "storage", "search", "external"):
        if by_kind.get(k):
            print(f"  {k:<9} {len(by_kind[k]):>2}  {', '.join(by_kind[k][:8])}{' …' if len(by_kind[k]) > 8 else ''}")
    print(f"  calls     {len(report['calls']):>2}  " + ", ".join(f"{c['from']}→{c['to']}" for c in report["calls"][:6]) + (" …" if len(report["calls"]) > 6 else ""))
    if report["apis"]:
        print(f"  APIs      {len(report['apis']):>2}  " + ", ".join(f"{x['title']} ({len(x['routes'])} routes)" for x in report["apis"][:4]))
    if report["tables"]:
        print(f"  tables    {len(report['tables']):>2}  " + ", ".join(t["name"] for t in report["tables"][:10]) + (" …" if len(report["tables"]) > 10 else ""))
    if observability:
        print(f"  data      {len(observability):>2}  {', '.join(observability)}  (observability — candidate data sources, not buildings)")
    if not report["services"] and not report["tables"]:
        print("  nothing recognizable — ask the user for a list, a diagram or docs instead")
    print(f"Wrote {a.out}")
    if a.draft:
        json.dump(to_draft(F, a.title or os.path.basename(roots[0]).replace("-", " ").title(), a.locale, a.purpose), open(a.draft, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        print(f"Wrote {a.draft} (proposal — confirm it in the City Brief, then run validate.py)")


if __name__ == "__main__":
    main()
