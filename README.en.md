# Motion Skill — Voice-to-video for creators who prefer to stay off camera

[中文完整文档](README.md) · [FAQ (中文)](docs/FAQ.md) · [Contributing](CONTRIBUTING.md)

**Have ideas to share but prefer not to appear on camera? Start with a written idea or a voice recording.** Motion Skill is a Codex / Agent skill and editable Remotion project for combining narration, real-world footage, motion graphics and synchronized captions. It also supports script-driven motion graphics without narration. It is currently in beta.

## Watch the reference

[![48-second silent preview with real footage, motion graphics and Chinese captions](demo/motion-skill-preview.gif)](https://github.com/derek-zhuolin/motion-skill/releases/download/v1.1.0-beta.1/motion-skill-reference.mp4)

[Download the full video with audio](https://github.com/derek-zhuolin/motion-skill/releases/download/v1.1.0-beta.1/motion-skill-reference.mp4) · [Editable reference project](examples/voice-to-video/README.md)

The published reference is 48 seconds, 1920×1080 at 30fps, with 7 scenes, 25 caption cues, one stock photo and a 5.4-second stock clip. It was developed in Codex with **GPT-6.1 Sol** (model label supplied by the author), local Whisper transcription, Remotion rendering and human review. It does not establish equivalent quality for every recording or model.

## Who it is for

- Creators sharing observations and knowledge without filming themselves.
- Designers, developers and independent makers explaining ideas or workflows.
- People who find it easier to speak an idea before editing it into a story.

You provide the ideas and approve the result. The Agent helps direct and implement the video. Staying off camera does not anonymize your voice or the information you share.

## Narration is optional

`script` mode uses a written script and planned reading time; without an audio source, the result is silent. `voice` mode uses a real recording and its timestamps. `example` mode is a labeled structural demo.

Narration, sound effects and background music are separate creative choices. The current template only wires narration: it has no bundled SFX library, independent SFX switch or automatic music/SFX mixing pipeline. Ask the Agent to integrate authorized audio and verify the mix when needed. The published 48-second reference has narration only; its stock footage is muted. The player’s voice toggle controls narration, while the README GIF is always silent. See [audio details (中文)](docs/AUDIO.md).

## Example prompt

> /motion-video I want to share the ideas in this recording without appearing on camera. Combine licensed real photos and short footage clips for concrete scenes with motion graphics for abstract relationships. Preserve the complete voice at 1× and add synchronized bottom captions. If I supply no footage, use available web tools to find suitable licensed media and record the authors, source pages and license terms. Finish with a large [name] and [closing line], held steady for at least three seconds. Deliver an MP4, editable project, captions and source notes.

The default is **16:9** (example output: 1920×1080). Request **9:16 / 1080×1920** or **3:4 / 1080×1440** explicitly when needed. The current runtime is fixed to landscape: the Agent must adapt the composition and layout, then verify it. There is no built-in automatic aspect-ratio switch.

## Run the editable reference

Requires Node.js 22+, Python 3, FFmpeg/ffprobe and an installed Chrome/Chromium browser. Run from the repository root:

```sh
npm ci --ignore-scripts
python3 scripts/prepare-reference.py --fetch-stock
npm run check
npm run build
npm run verify:frames
npm run preview
```

Open `http://127.0.0.1:4341/`. Export with `npm run render`. Set `REMOTION_BROWSER_EXECUTABLE` if your installed browser is not found. The preparation script extracts narration from the authorized public demo and downloads the attributed reference stock assets; the private original recording is not distributed.

Install the full repository in an Agent-readable skill directory, preserving its structure; the skill name is `motion-video`. See [getting started](docs/GETTING_STARTED.md) for creating your own project.

## What is included, and what is not

- **96 motion studies in 19 categories**, with source mappings and documented attribution gaps; not 96 original inventions or production templates.
- **5 semantic renderers**, frame-based caption checks, editable palettes and a reproducible reference project.
- No bundled ASR service, model, automatic stock-search API or one-click semantic directing engine. External tools and human review remain necessary.
- Change colors through `theme.json`, story brand settings or the study palette as documented in [customization](docs/CUSTOMIZATION.md).

## Attribution and reuse

The [scoped MIT license](LICENSE_SCOPE.md) covers contributor-owned engineering code and documentation. Historical studies, third-party fonts, dependencies, stock assets and demo media have separate terms or exclusions. Individual provenance for early studies 1–64 remains incomplete. Read [attribution](ATTRIBUTION.md) and [third-party notices](THIRD_PARTY_NOTICES.md) before reuse.

Contributions are welcome: palettes, captions, layouts, reproducible fixes and source records. Please include an actual preview and respect the existing license boundaries.
