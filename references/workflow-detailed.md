# 详细工作流（兼容资料）

来自公开 1.1.0-beta.1 的工作流说明；默认样片已改为 15–20 秒，制作入口及新指令以 ../SKILL.md 为准。

## 核心判断

**先看到一个短结论 → 留时间读懂关系 → 本句讲完、动作落定 → 提前铺垫下一步。** 铺垫可以早于下一句话，但下一步答案不能抢走当前阅读焦点。

优先级：语义清楚、可读性、人声韵律、动作接触、音乐。微动作可以快；新结论和证据必须有理解时间。不要靠把整条片子减速解决信息过载，也不要为了凑目标时长加速人声。

## 按输入工作

- **真实音频/视频**：先probe真实时长，复用已获授权、可用的转写能力，核对文字与时间。此包没有ASR模型；probe的能量低谷不是转写、重音或音乐强拍。有视频才使用原人物；只有音频不生成说话人脸。读 [原声契约](audio-contract.md)。
- **文案**：明确受众、唯一带走的结论和素材。没有音源就保持静音，不把估计的口播时间说成真实时间。
- **复看成片**：按时间点检查构图、焦点、真实交接、阅读时间与声音落点，先给修改点；用户只要求复盘时不要重渲染。

## 语义导演与节奏

读 [导演与可读性](direction.md)，由当前Agent理解原话，填写 `assets/story.example.json` 的同结构草稿，字段含义见 [story契约](story-contract.md)。脚本负责时间计算，不负责理解人说了什么。

每个语义镜头写：短结论、语音起止/语义完成时间、信息关系、一个主焦点、可见标签、最后一批信息可读时间、证据、机位用途、入出对象与交接原因。允许一个画面承接多句话。先给结论，细节渐进揭示；标题优先居中、重点清楚，按品牌与画面再调整，不能每段都重置同一个“标题＋中央物体”布局。

`motion.py plan` 计算阅读预算，保持原声1×。预算参数是可调整的初始假设，必须用实际观看校准；不是通用行业标准。主标题汉字逐字计，英文/数字逐词计，二者分开记录。阅读从 `content_ready_at` 开始，不从入场第一帧开始。若 `NEEDS_SIMPLIFY`，先减字、减少同时出现的信息、让一个视觉跨多句话；仍不够才按用户授权延长/改剪辑，不能悄悄把后段人声推迟。

从 [动效目录](catalog.json) 按信息关系选机制。96项是可浏览研究，非96种独立发明；每片只取实际有用的几项。共享对象必须在像素里可追踪：保留身份、位置/方向与动作因果。静态JSON校验只能查声明，不证明真实连续。机位读字时稳、交接时动；不无故转圈、闪白或反复重启ease。

## 字幕与真实素材（公开内测版）

voice 模式默认补底部同步字幕，不用主标题代替字幕。Agent核对文字与断句，把帧级cues写入story.captions，或以new --captions传入。默认缺字幕会被plan拦截；只有用户明确不要字幕才写captions.enabled=false。字幕不抢主视觉，实际复看深色画面、实拍和片尾。字段见[入门](../docs/GETTING_STARTED.md)。

用户要求混剪时，具体场景用有来源的实拍，抽象关系用动效。用户明确授权联网获取素材、但未提供实拍时，可由Codex使用可用搜索与下载工具，按口播场景自行寻找有明确使用许可的公开照片和短视频，不逐张索取确认；记录作者、原始页面和许可证。搜索/下载受限时报告缺口，不自动购买，不把示意图或生成画面标成实拍。真实素材获取与镜头编排由Agent按已授权能力完成，不把源码中的示意图当实拍；示范工程见examples/voice-to-video。下载来源与作者保留，原件不自动打包。

## 本地确定性工具

在本Skill目录调用，所有输出须新路径，脚本不覆盖原件，不发网络请求或模型请求：

```sh
python3 scripts/motion.py doctor --deps /absolute/compatible-node_modules
python3 scripts/motion.py catalog --relation cause --limit 6
python3 scripts/motion.py probe /absolute/voice-or-video --out /absolute/new-run/media-probe.json
python3 scripts/motion.py plan /absolute/story.json --out /absolute/compiled-plan.json
python3 scripts/motion.py new --dest /absolute/new-project --deps /absolute/compatible-node_modules --story /absolute/story.json --media /absolute/voice-or-video --transcript /absolute/verified-transcript.json
```

没有新素材时，`new`省略media、transcript、story会生成明确标注的静音结构示例。真实媒体缺转写时生成 `needs_revision` 状态，不能称已成片。工程内 `npm run check && npm run build && npm run verify:frames`，`python3 serve.py --port 4341` 仅本地预览。要看旧单项机制打开 `studies.html`；这是参考库，不代表新片已使用全部机制。

首次新题材优先用连续15–20秒验证声画关系，按完整句意选片段并保存源时间；用户指定整片时按其范围完成，不硬塞固定片长。

用户未指定画幅时，默认16:9横屏（示例成片1920×1080）。用户在提示词中明确要求9:16（如1080×1920）、3:4（如1080×1440）或其他宽:高时，以其要求为目标；Codex须相应调整Composition、Player、画布/坐标及标题、实拍、字幕、ending排版，并实际检查。不要只改尺寸数字或直接裁切横屏后声称已适配。

默认运行模板为横屏16:9，支持 collect/connect/compare/evidence/conclusion 五类二维语义结构、原声与固定真人窗；竖屏须按内容另排版。新的复杂机位要按本片内容编辑源码。人脸自动追踪、自动韵律/节拍识别、任意语义全自动导演并未内置。不要把替换JSON说成已解决一切导演问题。

用户要求导出时，在同一工程运行 `npm run render`；使用已有Chrome和依赖，H.264/AAC，音源与画面共用帧时钟。缺依赖先报告，不自行下载。读 [验收](acceptance.md) 完成真实文件检查，不以构建成功代替成片验收。

## 规格与交付

Spec Kit用来固定constitution、spec、plan、tasks和检查记录。详细适配、已核验版本和官方链接见 [Spec Kit适配](spec-kit.md)。它不自带语义导演、机位或读懂检测。本包是独立领域适配，不是官方影视扩展。日常出片无需重跑完整软件开发工作流。

品牌默认使用研究示例蓝#0070DB、黑#141414、白和灰；可在story.brand配置。粘土只用于有叙事任务的对象，原Logo不变形；真实照片/数字有来源，未知不编。个人音视频、密钥、联系人不进入Skill安装包。公开reference另放demo，只有获得明确发布授权才纳入；来源与许可见ATTRIBUTION.md及LICENSE_SCOPE.md。

交付工程、媒体来源、语义镜头/阅读预算/声画落点、实际预览和检查；按请求导出MP4。分别报告完成、待接入和待素材；用户观感/听感未确认就保留pending。用户要求自动完成时，在已授权的本地范围推进，不每一步索取确认。

## 参考与许可

不主张96项技法原创；逐项参考见[ATTRIBUTION](../ATTRIBUTION.md)。早期1–64项出处未完整留存，历史研究档案不新授MIT。不要把参考组件或上游作品说成本仓库发明。配色可按自己的品牌调整，见[换色](../docs/CUSTOMIZATION.md)。
