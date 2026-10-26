"""Behavior regression checks; no media generation, agents, cloud or model calls."""
from pathlib import Path
import copy
import json
from timing import compile_story, count_text


def main():
    seed = json.loads((Path(__file__).resolve().parents[1]/"assets/story.example.json").read_text())
    checked = []

    def expect(name, story, code=None):
        out = compile_story(story)
        codes = [x["code"] for x in out["audit"]["blocking"]]
        assert code in codes if code else not codes, (name, codes)
        checked.append({"case": name, "expected_blocker": code, "observed": codes})

    expect("valid example has enough readable time", seed)
    bad = copy.deepcopy(seed); bad["scenes"][0]["end"] = 1
    expect("fast scene cannot skip the comprehension budget", bad, "NEEDS_SIMPLIFY")
    bad = copy.deepcopy(seed); bad["scenes"][0]["content_ready_at"] = 5.8
    expect("late text reveal starts the clock later", bad, "NEEDS_SIMPLIFY")
    bad = copy.deepcopy(seed); bad["scenes"][0]["headline"] = "观众需要先读完所有这些堆在屏幕上的非常冗长的信息才能理解"
    expect("headline overload is not solved by small type", bad, "HEADLINE_OVERLOAD")
    bad = copy.deepcopy(seed); bad["scenes"][1]["visual"]["object_ids"].remove("thread")
    expect("a declared shared entity must survive the handoff", bad, "SHARED_ENTITY_LOST")
    bad = copy.deepcopy(seed); bad["layout"]["face"]["enabled"] = True
    expect("audio alone cannot create a real face", bad, "NO_FACE_SOURCE")
    bad = copy.deepcopy(seed); bad["audio_speed"] = 1.3
    expect("no silent acceleration of the source audio", bad, "UNAUTHORIZED_RETIME")
    bad["audio_edit_authorized"] = True
    expect("authorization alone does not implement retiming", bad, "UNSUPPORTED_RETIME")
    bad = copy.deepcopy(seed); bad["scenes"][0]["end"] = float("inf")
    expect("invalid geometry or time cannot pass", bad, "INVALID_NUMBER")
    bad = copy.deepcopy(seed); bad["scenes"][0]["visual"]["renderer"] = "automatic-cinematic-everything"
    expect("unimplemented renderer cannot masquerade as a feature", bad, "UNSUPPORTED_RENDERER")
    voice = copy.deepcopy(seed); voice["mode"] = "voice"
    voice["source"].update({"actual_duration":20,"transcript_verified":True,"voice_url":"assets/voice.wav"})
    voice["captions"]={"enabled":True,"fps":60,"cues":[{"id":"test","start_frame":0,"end_frame":1200,"text":"测试字幕"}]}
    for s in voice["scenes"]:
        s["voice"] = {"start":s["start"],"end":s["end"]-.8,"text":"测试台词，不是用户录音"}
        s["meaning_complete_at"] = s["end"]-1
    expect("verified voice coordinates can share the same clock", voice)
    bad = copy.deepcopy(voice); bad["scenes"][0]["voice"]["end"] = 7
    expect("source speech cannot cross a hidden edit", bad, "VOICE_MAPPING_INVALID")
    bad = copy.deepcopy(voice); bad["source"]["actual_duration"] = 17
    expect("audio length cannot silently drift", bad, "AUDIO_DURATION_MISMATCH")
    bad = copy.deepcopy(voice); bad["source"]["transcript_verified"] = False
    expect("unverified transcript stays blocked", bad, "TRANSCRIPT_NOT_VERIFIED")
    bad = copy.deepcopy(voice); bad["source"]["voice_url"] = None
    expect("a voiced deliverable needs an audio source", bad, "MISSING_AUDIO_SOURCE")
    bad = copy.deepcopy(seed); bad["scenes"][1]["start"] = 6.7
    expect("pauses must not create blank timeline holes", bad, "UNCOVERED_TIMELINE")
    bad = copy.deepcopy(seed); bad["scenes"][0]["visual"]["token"]["x"] = 2000
    expect("the focus must fit the frame", bad, "FOCUS_OUTSIDE_FRAME")
    bad = copy.deepcopy(voice); bad.pop("captions")
    expect("voiced output cannot silently omit subtitles", bad, "MISSING_CAPTIONS")
    bad = copy.deepcopy(voice); bad["captions"]["cues"][0]["end_frame"] = 1500
    expect("caption cannot exceed the source clock", bad, "CAPTION_TIMING_INVALID")
    bad = copy.deepcopy(voice); bad["captions"] = {"enabled":False}
    expect("explicitly requested no-subtitle output is allowed", bad)
    assert count_text("AI 0→1 的 Go to market。") == {"han_chars":1,"latin_words":6}
    checked.append({"case":"Han and Latin counts use distinct declared units","passed":True})
    print(json.dumps({"passed":len(checked),"cases":checked,"scope":"deterministic behavior only; not ASR, aesthetic or listening acceptance"},ensure_ascii=False,indent=2))


if __name__ == "__main__":
    main()
