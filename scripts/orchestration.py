"""Optional semantic-plan extension and dependency freshness checks. No rendering or inference."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import sys

ROLES = {"process", "result", "context"}
SPACES = {"world", "object", "screen"}
CATEGORIES = ("source", "audio", "asset", "config", "artifact")
PRIVATE_PARTS = {".git", ".local", ".ssh", ".aws", ".codex", ".agents", "node_modules"}
PRIVATE_NAMES = {"credentials", "credentials.json", "secrets.json", "id_rsa", "id_ed25519"}


def finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def text(value):
    return isinstance(value, str) and bool(value.strip())


def proof_states(plan="not_checked"):
    return {"plan": plan, "wiring": "not_checked", "pixels": "not_checked",
            "playback": "not_checked", "user_acceptance": "pending"}


def resolve(plan):
    """Resolve named events, not audio beats. The author owns interpretation and factual review."""
    if not isinstance(plan, dict):
        raise ValueError("plan must be an object")
    ext = plan.get("orchestration")
    if ext is None:
        return {"schema": 1, "status": "not_requested", "blocking": [], "warnings": [],
                "shots": [], "risk_windows": [], "evidence": proof_states(),
                "scope": "Legacy plan retained. Optional orchestration extension was not supplied."}
    errors, warnings, result, windows = [], [], [], []
    if not isinstance(ext, dict):
        raise ValueError("orchestration must be an object")
    if ext.get("version") != 1:
        errors.append("UNSUPPORTED_ORCHESTRATION_VERSION")
    duration = plan.get("duration")
    if not finite(duration) or duration <= 0:
        errors.append("DURATION_MUST_BE_POSITIVE")
        duration = 0
    events = ext.get("events", {})
    if not isinstance(events, dict):
        errors.append("EVENT_TABLE_REQUIRED")
        events = {}
    for key, value in events.items():
        if not text(key) or not finite(value) or not 0 <= value <= duration:
            errors.append(f"events.{key}: INVALID_EVENT_TIME")

    def rows(value, name):
        if not isinstance(value, list):
            errors.append(name + ": ARRAY_REQUIRED")
            return []
        valid = []
        for index, row in enumerate(value):
            if not isinstance(row, dict):
                errors.append(f"{name}[{index}]: OBJECT_REQUIRED")
            else:
                valid.append(row)
        return valid

    originals = {}
    for s in rows(plan.get("shots", []), "shots"):
        sid = s.get("id")
        if not text(sid) or sid in originals:
            errors.append("shots: MISSING_OR_DUPLICATE_ID")
        else:
            originals[sid] = s
    objects = {}
    for obj in rows(ext.get("objects", []), "objects"):
        oid = obj.get("id")
        if not text(oid) or oid in objects:
            errors.append("objects: MISSING_OR_DUPLICATE_ID")
            continue
        objects[oid] = obj
        if obj.get("space") not in SPACES:
            errors.append(f"{oid}: COORDINATE_SPACE_REQUIRED")
        properties = set()
        geometry = rows(obj.get("geometry", []), oid + ".geometry")
        if not geometry:
            errors.append(f"{oid}: GEOMETRY_OWNER_REQUIRED")
        for binding in geometry:
            prop = binding.get("property")
            if not text(prop) or not text(binding.get("owner")):
                errors.append(f"{oid}: GEOMETRY_OWNER_REQUIRED")
            elif prop in properties:
                errors.append(f"{oid}.{prop}: DUPLICATE_GEOMETRY_OWNER")
            properties.add(prop if isinstance(prop, str) else "")

    sources = {}
    for item in rows(ext.get("evidence", []), "evidence"):
        eid = item.get("id")
        if not text(eid) or eid in sources or not text(item.get("source")) or not text(item.get("scope")):
            errors.append("evidence: UNIQUE_ID_SOURCE_SCOPE_REQUIRED")
        else:
            sources[eid] = item
    seen = set()
    shot_rows = rows(ext.get("shots", []), "orchestration.shots")
    if not shot_rows:
        errors.append("EMPTY_ORCHESTRATION_SHOTS")
    for shot in shot_rows:
        sid = shot.get("shotId")
        prefix = str(sid) + ": "
        if not text(sid) or sid in seen:
            errors.append(prefix + "MISSING_OR_DUPLICATE_SHOT_ID")
            continue
        seen.add(sid)
        original = originals.get(sid)
        if not original:
            errors.append(prefix + "SHOT_NOT_IN_SEMANTIC_PLAN")
            original = {}
        if not text(original.get("meaning")):
            errors.append(prefix + "MEANING_REQUIRED")
        def event(field):
            name = shot.get(field)
            if not text(name) or name not in events or not finite(events[name]):
                errors.append(prefix + field + ": UNKNOWN_EVENT")
                return None
            return events[name]
        start, end = event("startEvent"), event("endEvent")
        read_from, read_until = event("readableFromEvent"), event("readableUntilEvent")
        ordered = all(finite(x) for x in (start, end, read_from, read_until))
        if ordered and not 0 <= start <= read_from < read_until <= end <= duration:
            errors.append(prefix + "INVALID_TIME_ORDER")
        budget = shot.get("minReadSeconds")
        if not finite(budget) or budget <= 0 or (ordered and read_until - read_from + 1e-9 < budget):
            errors.append(prefix + "READ_WINDOW_TOO_SHORT_OR_MISSING")
        if not text(shot.get("readBasis")):
            errors.append(prefix + "READ_BASIS_REQUIRED")
        for field, value in (("start", start), ("end", end)):
            if field in original and (not finite(original[field]) or original[field] != value):
                errors.append(prefix + field + ": LEGACY_TIME_CONFLICT")
        role = shot.get("role")
        if role not in ROLES:
            errors.append(prefix + "ROLE_REQUIRED")
        if role == "result" and shot.get("evidenceRef") not in sources:
            errors.append(prefix + "RESULT_EVIDENCE_REFERENCE_REQUIRED")
        for field in ("narration", "visual", "annotation"):
            # Empty narration/annotation is explicit and valid for a silent visual beat.
            if not isinstance(shot.get(field), str) or (field == "visual" and not text(shot[field])):
                errors.append(prefix + field + ": EXPLICIT_TEXT_REQUIRED")
        if text(shot.get("narration")) and shot.get("narration") == shot.get("visual"):
            warnings.append(prefix + "VISUAL_REPEATS_NARRATION: review whether the picture adds information")
        ids = original.get("object_ids", [])
        if not isinstance(ids, list) or not ids or any(not text(o) or o not in objects for o in ids):
            errors.append(prefix + "OBJECTS_MUST_BE_DECLARED")
            ids = []
        focus = original.get("focus_object")
        if focus not in ids:
            errors.append(prefix + "FOCUS_MUST_BE_AN_OBJECT")
        reference = shot.get("reference", {})
        if not isinstance(reference, dict):
            reference = {}
        if reference.get("kind") not in {"adapter", "custom"} or any(not text(reference.get(k)) for k in ("id", "version", "entry", "skin")):
            errors.append(prefix + "REFERENCE_ID_VERSION_ENTRY_SKIN_REQUIRED")
        if reference.get("kind") == "custom" and not text(reference.get("reason")):
            errors.append(prefix + "CUSTOM_DIFFERENCE_REASON_REQUIRED")
        if not text(shot.get("motionIntent")):
            errors.append(prefix + "MOTION_INTENT_REQUIRED")
        handoff = shot.get("handoff")
        if handoff is not None:
            if not isinstance(handoff, dict):
                errors.append(prefix + "INVALID_HANDOFF")
                handoff = None
            else:
                receiver = originals.get(handoff.get("to"), {})
                at = events.get(handoff.get("event"))
                if not receiver or not text(handoff.get("reason")) or not finite(at):
                    errors.append(prefix + "HANDOFF_TARGET_EVENT_REASON_REQUIRED")
                elif not ordered or not read_until <= at <= end:
                    errors.append(prefix + "HANDOFF_BEFORE_READING_OR_OUTSIDE_SHOT")
                else:
                    windows.append({"shotId": sid, "reason": "handoff", "event": handoff["event"],
                                    "from": max(0, at - .2), "to": min(duration, at + .2)})
                if handoff.get("kind") not in {"cut", "contrast", "focus", "match", "expand"}:
                    errors.append(prefix + "HANDOFF_KIND_REQUIRED")
                elif handoff["kind"] in {"focus", "match", "expand"}:
                    oid = handoff.get("objectId")
                    if not oid or oid not in ids or oid not in receiver.get("object_ids", []):
                        errors.append(prefix + "HANDOFF_OBJECT_LOST")
        if ordered:
            windows.append({"shotId": sid, "reason": "readable-arrival", "event": shot["readableFromEvent"],
                            "from": max(0, read_from - .2), "to": min(duration, read_from + .2)})
        result.append({"id": sid, "meaning": original.get("meaning", ""), "role": role,
                       "start": start, "end": end, "readable_from": read_from, "readable_until": read_until,
                       "focus_object": focus, "object_ids": ids, "reference": reference,
                       "narration": shot.get("narration", ""), "visual": shot.get("visual", ""),
                       "annotation": shot.get("annotation", ""), "motion_intent": shot.get("motionIntent"),
                       "handoff": handoff, "evidence_ref": shot.get("evidenceRef")})
    # A locally valid sender is insufficient: its receiver may not exist yet.
    # Resolve this only after every extended shot is known, independent of row order.
    resolved = {s["id"]: s for s in result}
    handoff_checks = []
    for sender in result:
        handoff = sender["handoff"]
        if not handoff:
            continue
        receiver = resolved.get(handoff.get("to"))
        at = events.get(handoff.get("event"))
        check_row = {"from": sender["id"], "to": handoff.get("to"), "event": handoff.get("event"),
                     "status": "not_checked", "receiver_active": "not_checked", "receiver_readable": "not_checked"}
        handoff_checks.append(check_row)
        prefix = sender["id"] + ": "
        if receiver is None:
            warnings.append(prefix + "HANDOFF_RECEIVER_NOT_EXTENDED: timing and readability not checked")
            continue
        bounds = [receiver[k] for k in ("start", "end", "readable_from", "readable_until")]
        if not finite(at) or not all(finite(v) for v in bounds) or not 0 <= bounds[0] <= bounds[2] < bounds[3] <= bounds[1] <= duration:
            warnings.append(prefix + "HANDOFF_RECEIVER_TIMING_UNRESOLVED: timing and readability not checked")
            continue
        if not receiver["start"] <= at <= receiver["end"]:
            errors.append(prefix + "HANDOFF_RECEIVER_NOT_ACTIVE")
            check_row.update(status="blocked", receiver_active="blocked")
            continue
        check_row["receiver_active"] = "declared_valid"
        if receiver["readable_from"] <= at <= receiver["readable_until"]:
            check_row.update(status="declared_valid", receiver_readable="declared_valid")
        elif handoff.get("kind") in {"focus", "match", "expand"}:
            errors.append(prefix + "HANDOFF_RECEIVER_NOT_READABLE")
            check_row.update(status="blocked", receiver_readable="blocked")
        else:
            # A cut may precede the next visual's entry animation. Do not force an
            # instantaneous readable frame, but do not claim continuous coverage.
            warnings.append(prefix + "HANDOFF_RECEIVER_READING_PENDING: cut/contrast entry needs visual review")
    incomplete = any(row["status"] == "not_checked" for row in handoff_checks)
    plan_state = "blocked" if errors else "partial" if incomplete else "valid"
    return {"schema": 1, "status": "blocked" if errors else "plan_partial" if incomplete else "plan_valid", "blocking": errors,
            "warnings": warnings, "shots": result, "objects": list(objects.values()), "risk_windows": windows,
            "handoff_checks": handoff_checks, "evidence": proof_states(plan_state),
            "scope": "Declared relationships only. No source wiring, pixels, media decoding, factual truth, musical downbeats or user acceptance verified."}


def shotbook(report):
    safe = lambda v: str(v).replace("|", "／").replace("\n", " ")
    lines = ["# SHOTBOOK", "", "状态：" + report["status"], "",
             "| 镜头 / 时间 | 语义角色 / 焦点 | 配音 | 画面承担的动作 | 注解 | 参考 / 阅读窗口 |",
             "| --- | --- | --- | --- | --- | --- |"]
    for s in report["shots"]:
        lines.append("| " + " | ".join(safe(v) for v in (
            f'{s["id"]} / {s["start"]}–{s["end"]}', f'{s["role"]} / {s["focus_object"]}',
            s["narration"], s["visual"], s["annotation"],
            f'{s["reference"].get("id")} / {s["readable_from"]}–{s["readable_until"]}')) + " |")
    lines += ["", "## 必查窗口", ""] + [f'- {w["shotId"]} / {w["reason"]}: {w["from"]:.3f}–{w["to"]:.3f}s' for w in report["risk_windows"]]
    lines += ["", "## 证据边界", "", report["scope"], "", json.dumps(report["evidence"], ensure_ascii=False)]
    if report.get("handoff_checks"):
        lines += ["", "交接检查（声明范围；不是可见画面证明）：", "", json.dumps(report["handoff_checks"], ensure_ascii=False)]
    for name in ("blocking", "warnings"):
        if report[name]:
            lines += ["", name + ":"] + ["- " + x for x in report[name]]
    return "\n".join(lines) + "\n"


def project_file(project, relative):
    """Accept only explicit project-relative files, reject traversal, hidden secrets and escaped symlinks."""
    if not isinstance(relative, str) or not relative or "\\" in relative:
        raise ValueError("file path must be a nonempty POSIX project-relative path")
    p = Path(relative)
    if p.is_absolute() or ".." in p.parts or p == Path("."):
        raise ValueError("path must stay inside project: " + relative)
    if any(part in PRIVATE_PARTS or part.startswith(".env") or part.lower() in PRIVATE_NAMES
           or part.lower().endswith((".pem", ".key", ".p12", ".keychain-db")) for part in p.parts):
        raise ValueError("private/configuration path is not allowed: " + relative)
    root = Path(project).resolve(strict=True)
    target = (root / p).resolve(strict=True)
    if not target.is_relative_to(root) or not target.is_file():
        raise ValueError("path is not a project file: " + relative)
    if any(part in PRIVATE_PARTS or part.startswith(".env") or part.lower() in PRIVATE_NAMES
           or part.lower().endswith((".pem", ".key", ".p12", ".keychain-db"))
           for part in target.relative_to(root).parts):
        raise ValueError("resolved private/configuration path is not allowed: " + relative)
    return target


def digest(path):
    value = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def snapshot(project, files):
    entries, seen = [], set()
    for category, names in files.items():
        if category not in CATEGORIES:
            raise ValueError("unknown dependency category: " + category)
        for name in names:
            path = project_file(project, name)
            key = str(Path(name))
            if key in seen:
                raise ValueError("duplicate dependency path: " + key)
            seen.add(key)
            entries.append({"category": category, "path": key, "sha256": digest(path), "bytes": path.stat().st_size})
    if not entries:
        raise ValueError("explicit dependency list must not be empty")
    entries.sort(key=lambda e: e["path"])
    build_id = hashlib.sha256(json.dumps(entries, sort_keys=True).encode()).hexdigest()[:16]
    return {"schema": 1, "build_id": build_id, "files": entries, "evidence": proof_states(),
            "scope": "Hashes bind only the explicit dependency list. Omitted imports/assets are not discovered. Fresh is not a visual or publication approval."}


def check(project, manifest):
    if not isinstance(manifest, dict) or manifest.get("schema") != 1 or not isinstance(manifest.get("files"), list) or not manifest["files"]:
        raise ValueError("invalid or empty dependency manifest")
    changes, seen = [], set()
    entries = manifest["files"]
    for entry in entries:
        if not isinstance(entry, dict) or entry.get("category") not in CATEGORIES or not isinstance(entry.get("sha256"), str) or len(entry["sha256"]) != 64:
            raise ValueError("invalid dependency entry")
        name = entry.get("path")
        if not isinstance(name, str) or name in seen:
            raise ValueError("missing or duplicate dependency path")
        seen.add(name)
        try:
            path = project_file(project, name)
            if digest(path) != entry["sha256"] or path.stat().st_size != entry.get("bytes"):
                changes.append({"path": name, "category": entry["category"], "reason": "changed"})
        except FileNotFoundError:
            changes.append({"path": name, "category": entry["category"], "reason": "missing"})
    expected = hashlib.sha256(json.dumps(sorted(entries, key=lambda e: e["path"]), sort_keys=True).encode()).hexdigest()[:16]
    if manifest.get("build_id") != expected:
        raise ValueError("manifest build_id does not match its file table")
    return {"status": "stale" if changes else "fresh", "build_id": expected, "changes": changes,
            "evidence": proof_states(), "scope": manifest.get("scope", "Explicit file hashes only")}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("resolve", help="Resolve optional orchestration events into reviewable shotbook")
    p.add_argument("plan", type=Path); p.add_argument("--out", required=True, type=Path)
    p.add_argument("--shotbook", required=True, type=Path)
    p = sub.add_parser("snapshot", help="Hash explicit dependency allowlist after building")
    p.add_argument("--project", required=True, type=Path); p.add_argument("--out", required=True, type=Path)
    for category in CATEGORIES:
        p.add_argument("--" + category, action="append", default=[])
    p = sub.add_parser("check", help="Detect changed or missing dependencies")
    p.add_argument("manifest", type=Path); p.add_argument("--project", required=True, type=Path)
    args = parser.parse_args(argv)
    try:
        if args.command == "resolve":
            report = resolve(json.loads(args.plan.read_text()))
            args.out.parent.mkdir(parents=True, exist_ok=True)
            args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
            args.shotbook.parent.mkdir(parents=True, exist_ok=True)
            args.shotbook.write_text(shotbook(report))
        elif args.command == "snapshot":
            report = snapshot(args.project, {c: getattr(args, c) for c in CATEGORIES})
            args.out.parent.mkdir(parents=True, exist_ok=True)
            args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
        else:
            report = check(args.project, json.loads(args.manifest.read_text()))
        print(json.dumps(report, ensure_ascii=False, indent=2))
        if report.get("status") == "plan_partial":
            return 3
        return 1 if report.get("status") in {"blocked", "stale"} else 0
    except (OSError, ValueError, TypeError) as exc:
        print(json.dumps({"status": "error", "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
