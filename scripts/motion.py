#!/usr/bin/env python3
"""Local Motion Skill project/probe/plan helpers. No cloud or model calls."""
import argparse
from array import array
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import sys
import zipfile
from timing import compile_story
from production import audit_production
from semantic_motion import recommend, summarize
from remotion_preflight import locate
from reuse import list_baselines, reuse_project

SKILL = Path(__file__).resolve().parents[1]
RELATION_EFFECTS = {
    "collect": [1, 3, 21, 23, 24], "focus": [2, 25, 26, 27, 28, 92],
    "process": [9, 41, 42, 45, 60, 84], "compare": [43, 38, 82],
    "cause": [9, 41, 60, 84], "evidence": [5, 25, 26, 89, 90, 91, 92],
    "merge": [8, 19, 23, 45, 48, 78], "conclusion": [20, 38, 64, 88],
}


def read(path):
    return json.loads(Path(path).read_text())


def save(path, value):
    path = Path(path)
    if path.exists():
        raise ValueError("Output exists; use a new path: " + str(path))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def probe(path, limit=60):
    path = Path(path).expanduser().resolve()
    if not path.is_file():
        raise ValueError("Media missing")
    ffprobe, ffmpeg = shutil.which("ffprobe"), shutil.which("ffmpeg")
    if not ffprobe or not ffmpeg:
        raise ValueError("ffprobe/ffmpeg missing; no automatic installation")
    meta = json.loads(subprocess.check_output([ffprobe, "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)]))
    duration = float(meta.get("format", {}).get("duration", 0))
    audio = [x for x in meta["streams"] if x["codec_type"] == "audio"]
    video = [x for x in meta["streams"] if x["codec_type"] == "video"]
    silence = []
    if audio:
        raw = subprocess.check_output([ffmpeg, "-v", "error", "-i", str(path), "-t", str(limit), "-map", "0:a:0", "-ac", "1", "-ar", "8000", "-f", "s16le", "-"])
        samples = array("h", raw)
        if sys.byteorder != "little":
            samples.byteswap()
        run = None
        for i in range(0, len(samples), 160):
            part = samples[i:i+160]
            rms = (sum(x*x for x in part) / max(1, len(part))) ** .5 / 32768
            t = i / 8000
            if rms < .012 and run is None:
                run = t
            if rms >= .012 and run is not None:
                if t - run >= .18:
                    silence.append({"start": round(run, 3), "end": round(t, 3)})
                run = None
        if run is not None and len(samples)/8000-run >= .18:
            silence.append({"start": round(run, 3), "end": round(len(samples)/8000, 3)})
    return {"file": str(path), "sha256": sha(path), "duration": duration,
            "has_audio": bool(audio), "has_video": bool(video),
            "video": [{k: x.get(k) for k in ("width", "height", "r_frame_rate")} for x in video],
            "pause_candidates": silence, "analysis_window_seconds": min(duration, limit),
            "limits": "Energy candidates only, not speech recognition, semantic segmentation, vocal emphasis or music beat detection.",
            "transcript_status": "not_transcribed"}


def new_project(args):
    dest = Path(args.dest).expanduser().resolve()
    if dest.exists():
        raise ValueError("Destination exists; choose a new run")
    deps = Path(args.deps).expanduser().resolve()
    versions = {"remotion": "4.0.538", "@remotion/player": "4.0.538", "react": "19.2.3"}
    for name, version in versions.items():
        if not (deps/name/"package.json").is_file() or read(deps/name/"package.json").get("version") != version:
            raise ValueError("Missing/incompatible dependencies: " + name)
    input_media = Path(args.media).expanduser().resolve() if args.media else None
    report = probe(input_media) if input_media else None
    audio_kind = getattr(args, 'audio_kind', 'voice')
    draft = read(args.story) if args.story else read(SKILL/"assets/story.example.json")
    if getattr(args, "captions", None):
        draft["captions"] = read(args.captions)
    transcript = Path(args.transcript).expanduser().resolve() if args.transcript else None
    if transcript and not transcript.is_file():
        raise ValueError("Transcript missing")
    if report and not args.story and audio_kind == 'voice':
        if not getattr(args, 'captions', None):
            draft.pop('captions', None)
        draft = {**draft, "mode": "voice", "duration": report["duration"],
                 "scenes": [], "source": {"transcript_verified": False}}
    if report and not report["has_audio"]:
        raise ValueError("No audio track; supply narration or explicitly choose a silent/script project")
    if report and audio_kind == 'voice' and draft.get("mode") != "voice":
        raise ValueError("A media-driven story must use voice mode and actual transcript timestamps")
    if report and audio_kind == 'voice' and abs(float(draft["duration"])-report["duration"]) > .05:
        raise ValueError("Story duration differs from actual media; use an explicitly prepared source excerpt")
    if report and audio_kind != 'voice' and draft.get('mode') == 'voice':
        raise ValueError('SFX/music input cannot satisfy voice mode; supply narration separately')
    if report and audio_kind != 'voice' and not args.story:
        raise ValueError('SFX/music needs an explicit story duration; no inferred narration timeline')
    shutil.copytree(SKILL/"assets/runtime", dest)
    # Studio uses public/; the standalone Player uses site/. Keep one asset source.
    if not (dest/"public").exists(): (dest/"public").symlink_to("site", target_is_directory=True)
    (dest/"node_modules").symlink_to(deps, target_is_directory=True)
    for name in ("inputs", "specs", "evidence", "outputs"):
        (dest/name).mkdir(exist_ok=True)
    if report:
        media_dir = dest/"site/assets"
        copied = media_dir/("source" + input_media.suffix.lower())
        shutil.copy2(input_media, copied)
        voice = media_dir/(audio_kind+".wav")
        subprocess.run([shutil.which("ffmpeg"), "-v", "error", "-n", "-i", str(copied), "-map", "0:a:0", "-ac", "2", "-ar", "48000", "-c:a", "pcm_s16le", str(voice)], check=True)
        if audio_kind == 'voice':
            draft["source"] = {**draft.get("source", {}), "voice_url": "assets/voice.wav",
                               "video_url": "assets/"+copied.name if report["has_video"] else None,
                               "actual_duration": report["duration"], "source_offset": 0}
        else:
            draft['source'] = {**draft.get('source', {}), audio_kind+'_url':'assets/'+audio_kind+'.wav'}
        save(dest/"inputs/media-probe.json", report)
    if transcript:
        shutil.copy2(transcript, dest/"inputs"/("transcript"+transcript.suffix))
    save(dest/"inputs/story.json", draft)
    compiled = compile_story(draft)
    save(dest/"src/compiled-plan.json", compiled)
    for name in ("spec.md", "plan.md", "tasks.md", "constitution.md"):
        shutil.copy2(SKILL/"assets/spec-templates"/name, dest/"specs"/name)
    return {"created": str(dest), "status": compiled["audit"]["status"],
            "audio": audio_kind+" extracted 1x" if report else "none",
            "model_calls": 0, "next": "核对转写并由Agent填写语义镜头；再运行plan、类型检查、预览。"}


def pack(args):
    output = Path(args.out).expanduser().resolve()
    if output.exists():
        raise ValueError("Archive exists; not overwriting")
    allowed = {"SKILL.md", "README.md", "README.en.md", "CHANGELOG.md", "LICENSE", "LICENSE_SCOPE.md", "ATTRIBUTION.md", "THIRD_PARTY_NOTICES.md", "agents", "assets", "references", "scripts", "docs"}
    excluded = {"node_modules", "__pycache__", ".git", ".local", ".cache", "evidence", "outputs", "dist"}
    files = [p for p in SKILL.rglob("*") if p.is_file() and not p.is_symlink()
             and p.relative_to(SKILL).parts[0] in allowed
             and not any(x in p.relative_to(SKILL).parts for x in excluded)]
    forbidden = {".wav", ".mp3", ".mp4", ".mov", ".m4a", ".env"}
    if any(p.suffix.lower() in forbidden or p.name.startswith(".env") for p in files):
        raise ValueError("Private/source media or environment file found in skill package")
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as z:
        for p in files:
            z.write(p, "motion-video/"+p.relative_to(SKILL).as_posix())
    return {"archive": str(output), "files": len(files), "sha256": sha(output), "contains_private_media": False}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="command", required=True)
    d = sub.add_parser("doctor")
    d.add_argument("--deps")
    q = sub.add_parser("probe")
    q.add_argument("media"); q.add_argument("--out", required=True)
    n = sub.add_parser("new")
    for name in ("dest", "deps"):
        n.add_argument("--"+name, required=True)
    for name in ("media", "transcript", "story", "captions"):
        n.add_argument("--"+name)
    n.add_argument('--audio-kind', choices=('voice','sfx','music'), default='voice')
    b = sub.add_parser("baselines"); b.add_argument("--registry")
    u = sub.add_parser("reuse")
    for key in ("baseline", "dest", "deps"): u.add_argument("--"+key, required=True)
    u.add_argument("--registry")
    c = sub.add_parser("plan")
    c.add_argument("draft"); c.add_argument("--out", required=True)
    z = sub.add_parser("pack"); z.add_argument("--out", required=True)
    k = sub.add_parser("catalog")
    k.add_argument("--relation", choices=sorted(RELATION_EFFECTS))
    k.add_argument("--query", default="")
    k.add_argument("--limit", type=int, default=8)
    v = sub.add_parser('audit-production')
    v.add_argument('manifest'); v.add_argument('--project', required=True); v.add_argument('--out', required=True)
    pf = sub.add_parser('preflight-remotion')
    pf.add_argument('--project'); pf.add_argument('--skills-root', action='append'); pf.add_argument('--out')
    sm = sub.add_parser('select-motion')
    sm.add_argument('plan'); sm.add_argument('--out', required=True); sm.add_argument('--explain', required=True)
    a = p.parse_args()
    if a.command == 'preflight-remotion':
        result=locate(a.project,a.skills_root)
        if a.out:save(a.out,result)
        print(json.dumps(result,ensure_ascii=False,indent=2))
        return 0 if result.get('ready_for_code') else 2
    elif a.command == 'select-motion':
        if Path(a.out).exists() or Path(a.explain).exists():raise ValueError('Plan outputs exist; choose a new run')
        result=recommend(read(a.plan));save(a.out,result)
        Path(a.explain).parent.mkdir(parents=True,exist_ok=True);Path(a.explain).write_text(summarize(result))
        print(summarize(result))
        return 2 if result['blocking'] else 0
    elif a.command == "doctor":
        result = {"ffmpeg": shutil.which("ffmpeg"), "ffprobe": shutil.which("ffprobe"),
                  "node": shutil.which("node"), "asr": "not bundled; use verified transcript from an authorized existing provider",
                  "model_calls": 0, "skill": str(SKILL)}
        if a.deps:
            result["dependencies"] = {n: read(Path(a.deps)/n/"package.json").get("version") if (Path(a.deps)/n/"package.json").is_file() else None for n in ("remotion", "@remotion/player", "react")}
    elif a.command == "baselines":
        result = list_baselines(a.registry)
    elif a.command == "reuse":
        result = reuse_project(a)
    elif a.command == "probe":
        result = probe(a.media); save(a.out, result)
    elif a.command == "new":
        result = new_project(a)
    elif a.command == "plan":
        result = compile_story(read(a.draft)); save(a.out, result)
        print(json.dumps(result["audit"], ensure_ascii=False, indent=2))
        return 2 if result["audit"]["blocking"] else 0
    elif a.command == "catalog":
        items = read(SKILL/"references/catalog.json")["effects"]
        ids = RELATION_EFFECTS.get(a.relation)
        chosen = [x for x in items if (ids is None or x["id"] in ids) and a.query.lower() in (x["name"]+x["category"]).lower()]
        result = {"relation": a.relation, "matches": [{key:x[key] for key in ("id","name","category","implementation","production_status","limit")} for x in chosen[:max(1,min(a.limit,12))]],
                  "note":"Manual task-to-mechanism reference map plus literal search; current Agent judges semantic fit."}
    elif a.command == 'audit-production':
        result = audit_production(read(a.manifest), a.project, read(SKILL/'references/production-registry.json'))
        save(a.out, result)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 2 if result['blocking'] else 0
    else:
        result = pack(a)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as exc:
        print("Motion Skill: " + str(exc), file=sys.stderr)
        sys.exit(1)
