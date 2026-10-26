# 可编辑 reference 工程

这条片子用真实音频、实拍照片/视频、Motion Graphics、底部同步字幕与大字ending组合而成。它是定制参考工程，不是把任意音频丢进来就无需编排的自动产品。

在仓库根目录运行：

```sh
npm ci --ignore-scripts
python3 scripts/prepare-reference.py --fetch-stock
npm run check
npm run build
npm run verify:frames
npm run preview
npm run render
```

- `src/DirectedFilm.tsx`：7段镜头、实拍时间映射、连续声音对象、Motion Skill end card。
- `src/Captions.tsx` / `src/captions.json`：25条字幕与底部排版。
- `src/theme.json`：强调色、墨色、底色入口。
- `inputs/story.json` / `src/compiled-plan.json`：脱敏后的语义镜头、原声时间与阅读预算。
- `captions.srt`：可单独导入剪辑器的字幕。
- 研究库复用仓库根目录 `assets/runtime/src/studies/`，来源和许可范围见根目录文档。

媒体准备会从公开示范片提取48.064秒配音副本，并复制随包字体；`--fetch-stock`才下载实拍来源。下载资产和渲染结果不进Git。原始录音与ASR原件未分发。

运行环境、已检查项目、素材来源和ASR文字整理见 [制作记录](../../docs/REFERENCE.md)。换色见 [CUSTOMIZATION](../../docs/CUSTOMIZATION.md)。
