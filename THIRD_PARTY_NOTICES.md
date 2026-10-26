# Third-party notices

This repository does not relicense its dependencies, fonts, reference works or media.

| Component | How used | Upstream terms |
|---|---|---|
| Remotion / @remotion packages | React timeline, player, fonts, bundling and rendering | [Remotion licensing](https://www.remotion.dev/docs/license); check current terms for your organization/use |
| React / React DOM | Runtime dependency | [React MIT license](https://github.com/facebook/react/blob/main/LICENSE) |
| TypeScript | Type checking | [TypeScript Apache-2.0](https://github.com/microsoft/TypeScript/blob/main/LICENSE.txt) |
| esbuild | Bundling | [esbuild MIT](https://github.com/evanw/esbuild/blob/main/LICENSE.md) |
| Source Han Sans | Bundled CJK fonts | Apache-2.0 and NOTICE files in `assets/runtime/site/assets/fonts/` |
| Figtree | Bundled Latin font | SIL OFL 1.1 in `assets/runtime/site/assets/fonts/Figtree-OFL.txt` |
| FFmpeg / Chrome / Python / Node | User-installed tools; not vendored | Their own distribution terms |
| Whisper | Used locally for the reference transcript; not bundled or invoked by this repo | [Upstream](https://github.com/openai/whisper) |
| Spec Kit | Documentation/workflow reference; CLI not bundled | [Official project](https://github.com/github/spec-kit) |

All installed transitive packages remain governed by the LICENSE/NOTICE files in their distributions. Package versions are recorded in `package-lock.json`; `node_modules` is not committed.

Motion-study sources, incomplete historical provenance and media attributions are listed in `ATTRIBUTION.md`. No upstream reference video, source photo, 3D Ken Burns model or Oreo UI component distribution is included.
