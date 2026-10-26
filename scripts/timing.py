"""Deterministic comprehension budgets. These are tunable heuristics, not norms."""
import math
import re

DEFAULTS = {
    "han_chars_per_second": 4.5,
    "latin_words_per_second": 2.5,
    "orientation_seconds": 0.35,
    "minimum_read_seconds": 1.2,
    "settle_seconds": 0.2,
    "preparation_seconds": 0.45,
    "max_headline_han_chars": 14,
    "max_headline_latin_words": 6,
    "max_new_labels": 4,
}
RELATION_TIME = {"claim": 0.25, "collect": 0.45, "process": 0.7,
                 "compare": 0.9, "cause": 0.7, "evidence": 1.2,
                 "conclusion": 0.35}


def count_text(text):
    """Han glyphs individually; English/numeric groups as words; punctuation ignored."""
    han = sum(0x3400 <= ord(c) <= 0x4DBF or 0x4E00 <= ord(c) <= 0x9FFF
              or 0x20000 <= ord(c) <= 0x3134F for c in text)
    words = re.findall(r"[A-Za-z0-9]+(?:[.'’-][A-Za-z0-9]+)*", text)
    return {"han_chars": han, "latin_words": len(words)}


def number(value, name, errors, minimum=0):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < minimum:
        errors.append({"code": "INVALID_NUMBER", "field": name,
                       "message": "Expected finite number >= " + str(minimum)})
        return minimum
    return float(value)


def compile_story(draft):
    errors, warnings, scenes = [], [], []
    cfg = {**DEFAULTS, **draft.get("pacing", {})}
    for key, val in list(cfg.items()):
        cfg[key] = number(val, "pacing." + key, errors, 0.001)
    duration = number(draft.get("duration"), "duration", errors, 0.1)
    fps = number(draft.get("fps", 60), "fps", errors, 1)
    if fps != int(fps):
        errors.append({"code": "INVALID_FPS", "message": "fps must be an integer"})
    mode = draft.get("mode", "script")
    if mode not in ("script", "voice", "example"):
        errors.append({"code": "INVALID_MODE", "message": "mode must be script, voice or example"})
    source = draft.get("source", {})
    if mode == "voice" and not source.get("transcript_verified"):
        errors.append({"code": "TRANSCRIPT_NOT_VERIFIED", "message": "先核对真实转写及时间戳，不从音量猜台词。"})
    if mode == "voice":
        if not source.get("voice_url"):
            errors.append({"code":"MISSING_AUDIO_SOURCE", "message":"真实口播模式需要实际原声音源，不能静音导出后声称已配音。"})
        actual_duration = number(source.get("actual_duration"), "source.actual_duration", errors, .1)
        if abs(actual_duration - duration) > .05:
            errors.append({"code": "AUDIO_DURATION_MISMATCH", "message": "成片时间需与实际原声一致；不能静默延长或截断。"})
        if source.get("source_offset", 0) != 0:
            errors.append({"code": "UNSUPPORTED_OFFSET", "message": "本模板从输入副本0秒起播；先制作已授权片段并另存原始范围映射。"})
    if draft.get("audio_speed", 1) != 1:
        code = "UNSUPPORTED_RETIME" if draft.get("audio_edit_authorized", False) else "UNAUTHORIZED_RETIME"
        errors.append({"code": code, "message": "此运行模板只支持原声1×；全轨变速映射尚未实现，不能仅改一个速度字段。"})
    layout = draft.get("layout", {})
    face = layout.get("face", {"enabled": False})
    if face.get("enabled") and not source.get("video_url"):
        errors.append({"code": "NO_FACE_SOURCE", "message": "只有音频不能声称已经有真人画中画。"})
    if face.get("enabled"):
        vals = [number(face.get(k), "face." + k, errors) for k in ("x", "y", "w", "h")]
        if vals[0] + vals[2] > 1 or vals[1] + vals[3] > 1:
            errors.append({"code": "FACE_OUTSIDE_FRAME", "message": "人物窗超出画面。"})
    captions = draft.get("captions", {"enabled": mode == "voice", "fps": int(fps), "cues": []})
    if not isinstance(captions, dict):
        errors.append({"code": "INVALID_CAPTIONS", "message": "captions must be an object"})
        captions = {"enabled": False, "fps": int(fps), "cues": []}
    if captions.get("enabled"):
        cfps = number(captions.get("fps", fps), "captions.fps", errors, 1)
        cues = captions.get("cues", [])
        if not isinstance(cues, list) or not cues:
            errors.append({"code": "MISSING_CAPTIONS", "message": "真实口播默认需要核对后的底部字幕；无字幕须显式设置captions.enabled=false。"})
            cues = []
        previous = -1
        cue_ids = set()
        for cue in cues:
            if not isinstance(cue, dict):
                errors.append({"code": "INVALID_CAPTION_CUE"}); continue
            a, b, cid = cue.get("start_frame"), cue.get("end_frame"), cue.get("id")
            if not cid or cid in cue_ids or not isinstance(cue.get("text"), str) or not cue["text"].strip():
                errors.append({"code": "INVALID_CAPTION_CUE"})
            cue_ids.add(cid)
            if any(isinstance(v, bool) or not isinstance(v, int) for v in (a, b)) or not 0 <= a < b <= round(duration*cfps) or a < previous:
                errors.append({"code": "CAPTION_TIMING_INVALID"})
            else:
                previous = b
    raw = draft.get("scenes", [])
    if not raw:
        errors.append({"code": "NO_SCENES", "message": "需要Agent理解原话后填写语义镜头；脚本不自动编造语义。"})
    ids, previous_end = set(), 0.0
    for i, scene in enumerate(raw):
        sid = scene.get("id", "scene-" + str(i + 1))
        if sid in ids:
            errors.append({"code": "DUPLICATE_SCENE", "scene": sid})
        ids.add(sid)
        start = number(scene.get("start"), sid + ".start", errors)
        end = number(scene.get("end"), sid + ".end", errors)
        if end <= start or start < previous_end - .001 or end > duration + .001:
            errors.append({"code": "INVALID_SCENE_RANGE", "scene": sid,
                           "message": "语义镜头须有正时长、顺序排列且不超出成片；微动作用子事件。"})
        if start > previous_end + .001:
            errors.append({"code": "UNCOVERED_TIMELINE", "scene": sid,
                           "message": "停顿应保留在当前镜头内；时间轴不能留空后误跳到结尾。"})
        previous_end = end
        headline = str(scene.get("headline", "")).strip()
        if not headline:
            errors.append({"code": "NO_TAKEAWAY", "scene": sid, "message": "每段先给一个短结论。"})
        headline_count = count_text(headline)
        if headline_count["han_chars"] > cfg["max_headline_han_chars"] or headline_count["latin_words"] > cfg["max_headline_latin_words"]:
            errors.append({"code": "HEADLINE_OVERLOAD", "scene": sid,
                           "message": "主结论过长；优先减字，不通过缩小字体或加速解决。", **headline_count})
        visual = scene.get("visual", {})
        if visual.get("renderer") not in ("collect", "connect", "compare", "evidence", "conclusion"):
            errors.append({"code": "UNSUPPORTED_RENDERER", "scene": sid,
                           "message": "此模板只内置五类语义结构；新机制须真实实现后再声明。"})
        labels = visual.get("labels", [])
        if not isinstance(labels, list) or any(not isinstance(x, str) for x in labels):
            errors.append({"code": "INVALID_LABELS", "scene": sid})
            labels = []
        if len(labels) > cfg["max_new_labels"]:
            errors.append({"code": "TOO_MANY_LABELS", "scene": sid,
                           "message": "拆成渐进揭示或合并镜头；不要同时堆更多要读的标签。"})
        # Exact repetition is not charged twice; other labels are conservatively additive.
        texts = [headline] + [x for x in dict.fromkeys(labels) if x not in headline]
        counts = [count_text(x) for x in texts]
        han = sum(x["han_chars"] for x in counts)
        latin = sum(x["latin_words"] for x in counts)
        relation = scene.get("relation", "claim")
        if relation not in RELATION_TIME:
            errors.append({"code": "UNKNOWN_RELATION", "scene": sid})
        inspection = number(scene.get("inspection_seconds", RELATION_TIME.get(relation, .5)), sid + ".inspection_seconds", errors)
        entry = number(scene.get("entry_seconds", .35), sid + ".entry_seconds", errors)
        stable_at = start + entry
        text_read = han / cfg["han_chars_per_second"] + latin / cfg["latin_words_per_second"]
        read_budget = max(cfg["minimum_read_seconds"], text_read + inspection)
        content_ready = number(scene.get("content_ready_at", stable_at), sid + ".content_ready_at", errors)
        if not stable_at <= content_ready <= end:
            errors.append({"code": "CONTENT_READY_INVALID", "scene": sid,
                           "message": "阅读时钟从最后一批主要信息可读时开始，不能从入场第一帧开始算。"})
        read_complete = content_ready + cfg["orientation_seconds"] + read_budget
        voice = scene.get("voice", {})
        if mode == "voice":
            vstart = number(voice.get("start"), sid + ".voice.start", errors)
            vend = number(voice.get("end"), sid + ".voice.end", errors)
            meaning_complete = number(scene.get("meaning_complete_at"), sid + ".meaning_complete_at", errors)
            if vstart < start - .001 or vend > end + .001 or vend < vstart or not vstart <= meaning_complete <= vend:
                errors.append({"code": "VOICE_MAPPING_INVALID", "scene": sid,
                               "message": "原声、语义完成时间与画面范围不一致；不能静默移动人声。"})
        else:
            vend = start
            meaning_complete = start
        protected_until = max(read_complete, vend, meaning_complete) + cfg["settle_seconds"]
        deficit = max(0.0, protected_until - end)
        if deficit > .001:
            errors.append({"code": "NEEDS_SIMPLIFY", "scene": sid,
                           "deficit_seconds": round(deficit, 3),
                           "message": "来不及读懂：减字/减少标签/用一个画面跨多句话；如需延长或改原声先明确授权。"})
        preparation = max(0.0, min(cfg["preparation_seconds"], end - protected_until))
        if preparation < .15 and i < len(raw) - 1:
            warnings.append({"code": "NO_PREPARATION_ROOM", "scene": sid,
                             "message": "没有足够预备空间：沿用焦点进入下一句，勿再叠一个新结论。"})
        focus = visual.get("focus_object")
        if not focus or focus not in visual.get("object_ids", []):
            errors.append({"code": "NO_FOCUS", "scene": sid})
        token = visual.get("token", {"x":800,"y":610})
        tx = number(token.get("x"), sid+".token.x", errors)
        ty = number(token.get("y"), sid+".token.y", errors)
        if tx > 1600 or ty > 900:
            errors.append({"code":"FOCUS_OUTSIDE_FRAME", "scene":sid})
        if scene.get("camera", {}).get("reading_motion", "none") == "active":
            warnings.append({"code": "MOVING_READING_TARGET", "scene": sid,
                             "message": "阅读时机位活跃；需实际检查文字与注视点是否稳定。"})
        emphasis = scene.get("emphasis", [])
        for mark in emphasis:
            at = number(mark.get("at"), sid + ".emphasis.at", errors)
            if not start <= at <= end:
                errors.append({"code": "EMPHASIS_OUTSIDE_SCENE", "scene": sid})
        if visual.get("renderer") == "evidence" and not visual.get("asset"):
            errors.append({"code": "EVIDENCE_MISSING", "scene": sid,
                           "message": "没有真实证据图时，不能用虚构图表假装结果。"})
        scenes.append({**scene, "id": sid, "start": start, "end": end,
                       "timing": {"stable_at": round(stable_at, 3),
                                  "content_ready_at": round(content_ready, 3),
                                  "text_han_chars": han, "text_latin_words": latin,
                                  "read_budget_seconds": round(read_budget, 3),
                                  "read_complete_at": round(read_complete, 3),
                                  "protected_until": round(protected_until, 3),
                                  "preparation_at": round(end - preparation, 3),
                                  "preparation_seconds": round(preparation, 3),
                                  "handoff_at": end, "deficit_seconds": round(deficit, 3)}})
    if scenes and abs(previous_end-duration) > .001:
        errors.append({"code":"UNCOVERED_TIMELINE", "message":"最后镜头未覆盖实际片尾；不要隐含延长或截断原声。"})
    for current, nxt in zip(scenes, scenes[1:]):
        handoff = current.get("handoff", {})
        if not handoff.get("reason"):
            errors.append({"code": "NO_HANDOFF_REASON", "scene": current["id"],
                           "message": "写清下一镜为什么由这一镜带出。"})
        if handoff.get("type") == "shared_entity":
            object_id = handoff.get("object_id")
            if not object_id or object_id not in current.get("visual", {}).get("object_ids", []) or object_id not in nxt.get("visual", {}).get("object_ids", []):
                errors.append({"code": "SHARED_ENTITY_LOST", "scene": current["id"],
                               "message": "声明共享对象，却未在交接前后保留同一ID。"})
        if handoff.get("visual_verified"):
            warnings.append({"code": "VISUAL_PROOF_REQUIRED", "scene": current["id"],
                             "message": "JSON不能证明像素连续，需成片/关键帧实查；此字段不自动作为验收证据。"})
    status = "needs_revision" if errors else "ready_for_visual_review"
    return {"schema_version": 1, "title": draft.get("title", "Motion Video"),
            "mode": mode, "duration": duration, "fps": int(fps),
            "audio_speed": draft.get("audio_speed", 1), "source": source,
            "layout": layout, "brand": draft.get("brand", {}), "pacing": cfg, "captions": captions,
            "scenes": scenes, "audit": {"status": status, "blocking": errors,
                                         "warnings": warnings,
                                         "visual_acceptance": "pending",
                                         "listening_acceptance": "pending",
                                         "basis": "configurable comprehension heuristic; not measured human reading speed or beat detection"}}
