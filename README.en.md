# Motion Skill — Voice-to-video for creators who prefer to stay off camera

[Release notes](https://github.com/derek-zhuolin/motion-skill/releases/tag/v1.2.0-beta.1) · [中文完整文档](README.md) · [FAQ (中文)](docs/FAQ.md) · [Contributing](CONTRIBUTING.md)

**Have ideas to share but prefer not to appear on camera? Start with a written idea or a voice recording.** Motion Skill is a Codex / Agent skill and editable Remotion project for combining narration, real-world footage, motion graphics and synchronized captions. It also supports script-driven motion graphics without narration. Currently in **public beta**; exact versions remain in the [changelog](CHANGELOG.md).

## Watch the reference

[![48-second silent preview with real footage, motion graphics and Chinese captions](demo/motion-skill-preview.gif)](https://github.com/derek-zhuolin/motion-skill/releases/download/v1.1.0-beta.1/motion-skill-reference.mp4)

[Download the full video with audio](https://github.com/derek-zhuolin/motion-skill/releases/download/v1.1.0-beta.1/motion-skill-reference.mp4) · [Editable reference project](examples/voice-to-video/README.md)

The published reference is 48 seconds, 1920×1080 at 30fps, with 7 scenes, 25 caption cues, one stock photo and a 5.4-second stock clip. It was developed in Codex with **GPT-6.1 Sol** (model label supplied by the author), local Whisper transcription, Remotion rendering and human review. It does not establish equivalent quality for every recording or model.

## Meaning first, with an explicit shot plan

Before implementing Remotion code, the Agent locates and reads the official `remotion-best-practices` entry and relevant branches by default. The read-only locator reports paths/version/hash, **not proof of reading**. Missing guidance is reported; it is never silently installed. Install the upstream skills separately when authorized:

```sh
npx skills add remotion-dev/skills
python3 scripts/motion.py preflight-remotion --project /absolute/project
python3 scripts/motion.py select-motion assets/semantic-plan.example.json \
  --out /tmp/motion-selection.json --explain /tmp/motion-shots.md
```

Before coding, show numbered shots with time, meaning, focal object, primary study ID/component, supporting transitions, handoff object, rationale and readable interval. This is a short disclosure, not an extra per-shot approval gate.

There are **96 studies and 10 reusable production adapters**, not 96 production templates. Select effects for fixed numbers, sourced comparisons, keyword hierarchy, inspected media or meaningful joins. Avoid repeating recently used adapters when another suitable choice exists; do not randomize effects or replay one reference's sequence for every story. The deterministic selector operates on Agent-reviewed structured input; it does not recognize raw audio/video or assemble the film. Unsupported relationships can use explicitly documented custom implementations.

Preserve the approved visual language: typography, colors, material, shadows and media treatment. Change effect selection and handoff paths for the meaning at hand. Reusable number reels retain configurable edge fading, subtle motion blur and separator appearance; a workflow upgrade is not permission to redesign the film.

Default to a **15–20 second pilot**, then expand after human acceptance unless the user explicitly requested a different scope. Preserve readable time and continuity; tests never imply aesthetic approval. Private baselines and transcript caches remain local and are not bundled. The existing 48-second reference is unchanged.

See [integration](references/remotion-integration.md), [shot planning](references/semantic-orchestration.md), [production adapters](references/production-registry.json) and [local reuse](references/local-fastpatch.md).

## Who it is for

- Creators sharing observations and knowledge without filming themselves.
- Designers, developers and independent makers explaining ideas or workflows.
- People who find it easier to speak an idea before editing it into a story.

You provide the ideas and approve the result. The Agent helps direct and implement the video. Staying off camera does not anonymize your voice or the information you share.

## Narration is optional

`script` mode uses a written script and planned reading time; without an audio source, the result is silent. `voice` mode uses a real recording and its timestamps. `example` mode is a labeled structural demo.

Narration, sound effects and background music are separate creative choices. New generated projects accept an explicit `--audio-kind voice|sfx|music` input (voice is the default); they have no bundled SFX library, independent SFX switch or automatic mixing pipeline. The existing reference still uses narration only. Ask the Agent to integrate authorized audio and verify the mix when needed. The published 48-second reference has narration only; its stock footage is muted. The player’s voice toggle controls narration, while the README GIF is always silent. See [audio details (中文)](docs/AUDIO.md).

For optional local music generation, install [ACE-Step from its official GitHub](https://github.com/ace-step/ACE-Step-1.5), following the [official installation guide](https://github.com/ace-step/ACE-Step-1.5/blob/main/docs/en/INSTALL.md). Installing Motion Skill does not install ACE-Step or its models. **The first model download is large and can take a long time.** The guide lists roughly 10GB of core-model disk space, plus dependencies and caches; download time varies. Reuse an existing installation or licensed music when available. See [setup, first-run expectations and the Motion workflow (中文)](docs/ACE_STEP.md).

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

For a first install with the official Skills CLI (Node.js 22.20+), run `npx skills add derek-zhuolin/motion-skill --skill motion-video -g` and choose your Agent. Update that managed global install with `npx skills update motion-video -g`; for a project installation use `-p` instead. This follows the original source, normally the default branch, not a stable-release channel. Back up custom changes and private files first: the CLI replaces installed files rather than merging your edits. Manual copies and forks require a separate update path. See [installation and updates](docs/UPDATING.md).

Prefer to ask your Agent? Copy this prompt:

> Update my Motion Skill from https://github.com/derek-zhuolin/motion-skill. Identify the actual installation and source first; back it up and preserve my custom changes, private assets and existing videos. Explain conflicts before merging. Use the existing installation method, leave unrelated skills alone and do not upload files. Verify the installed version and basic checks afterward.

Check `package.json` and `CHANGELOG.md` in the actual installed skill. Start a new Agent session if it still uses older guidance. To receive future release notifications, choose `Watch → Custom → Releases` on GitHub; installed copies still need an explicit update.

The full-repository manual installation remains supported; the skill name is `motion-video`. See [getting started](docs/GETTING_STARTED.md) for creating your own project.

## What is included, and what is not

- **96 motion studies in 19 categories**, with source mappings and documented attribution gaps; not 96 original inventions or production templates.
- **10 production adapters** plus **5 semantic renderers**, frame-based caption checks, editable palettes and a reproducible reference project.
- No bundled ASR service, model, automatic stock-search API or one-click semantic directing engine. External tools and human review remain necessary.
- Change colors through `theme.json`, story brand settings or the study palette as documented in [customization](docs/CUSTOMIZATION.md).

## Attribution and reuse

The [scoped MIT license](LICENSE_SCOPE.md) covers contributor-owned engineering code and documentation. Historical studies, third-party fonts, dependencies, stock assets and demo media have separate terms or exclusions. Individual provenance for early studies 1–64 remains incomplete. Read [attribution](ATTRIBUTION.md) and [third-party notices](THIRD_PARTY_NOTICES.md) before reuse.

Contributions are welcome: palettes, captions, layouts, reproducible fixes and source records. Please include an actual preview and respect the existing license boundaries.

## Optional orchestration and rhythm extensions (1.2.0-beta.1)

New opt-in helpers preserve existing projects and the 10 stable adapters: focus/return camera, declared handoff checks, named-event shotbooks, explicit dependency fingerprints and stale checks, and authored rhythm tracks. Plan validity, wiring, pixels, playback, and user acceptance remain separate states.

Run `npm run build:rhythm` then `npm run preview:rhythm` for a seekable A/B example with invoice and inventory variants. Its synthetic 116 BPM test groove is generated by source code, **not ACE-Step**; no personal voice or footage is included.

ACE-Step remains an optional external service. First use downloads several GB; upstream lists roughly 10 GB for core models, before optional models and dependencies. Download, initialization and generation times differ. One local 29-second turbo run took 243.75 seconds to generate, excluding initial download; this is not a benchmark or timing guarantee. See [audio setup and limits](docs/ACE_STEP.md), [upgrade scope](docs/ORCHESTRATION_UPGRADE.md), and [migration](docs/UPDATING.md).
