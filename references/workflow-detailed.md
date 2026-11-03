> 历史兼容流程。样片长度与验收以当前 SKILL.md 的 15–20 秒规则为准；只查所需命令。

---
name: motion-video
description: 显式调用 Motion Skill 或 Motion video 时，把真实音频、口播视频或文案编排为语义清楚、阅读时间足够、对象衔接连续的 Remotion 视觉解释短片。支持真人右下角与96项动效研究参考；含本地时长检查、工程生成和有声导出，不自动上传素材或调用语音/音乐模型。
---

# Motion Skill · Motion video

本地候选版本 **1.1.1-local.1**，未发布。先读 [研究接入与连续预演](production-pipeline.md) 和 [组合调用与错位编排](motion-combinations.md)：统一视觉规则 → 按内容关系选组合 → 真实内容连续预演 → 用户选择 → 正式成片。用户要求先看片段时，确认前不扩展整片。

只在用户点名本Skill或明确要求复用本工作流时执行。先读取项目AGENTS、当前brief与最新要求。新run保留原件；不要擅自加速原声、发布、上传或调用付费模型。

## 核心判断

**先建立主焦点，在可读的前提下让前后动作交接。** 当前意义讲完之前不撤走主信息；非焦点层可以提前准备、继续收尾。语义完成是焦点离开的下限，不是全画面停车的指令。不要把每句话写成一张新卡片，也不要要求所有层永远运动。

优先级：语义清楚、可读性、人声韵律、动作接触、音乐。微动作可以快；新结论和证据必须有理解时间。不要靠把整条片子减速解决信息过载，也不要为了凑目标时长加速人声。

## 按输入工作

- **真实音频/视频**：先probe真实时长，复用已获授权、可用的转写能力，核对文字与时间。此包没有ASR模型；probe的能量低谷不是转写、重音或音乐强拍。有视频才使用原人物；只有音频不生成说话人脸。读 [原声契约](audio-contract.md)。
- **文案**：明确受众、唯一带走的结论和素材。没有音源就保持静音，不把估计的口播时间说成真实时间。
- **复看成片**：按时间点检查构图、焦点、真实交接、阅读时间与声音落点，先给修改点；用户只要求复盘时不要重渲染。

## 语义导演与节奏

读 [导演与可读性](direction.md)，由当前Agent理解原话，填写 `assets/story.example.json` 的同结构草稿，字段含义见 [story契约](story-contract.md)。脚本负责时间计算，不负责理解人说了什么。

每个语义镜头写：短结论、语音起止/语义完成时间、信息关系、一个主焦点、可见标签、最后一批信息可读时间、证据、机位用途、入出对象与交接原因。允许一个画面承接多句话。先给结论，细节渐进揭示；标题优先居中、重点清楚，按品牌与画面再调整，不能每段都重置同一个“标题＋中央物体”布局。

`motion.py plan` 计算阅读预算，保持原声1×。预算参数是可调整的初始假设，必须用实际观看校准；不是通用行业标准。主标题汉字逐字计，英文/数字逐词计，二者分开记录。阅读从 `content_ready_at` 开始，不从入场第一帧开始。若 `NEEDS_SIMPLIFY`，先减字、减少同时出现的信息、让一个视觉跨多句话；仍不够才按用户授权延长/改剪辑，不能悄悄把后段人声推迟。

从 [动效目录](catalog.json) 按信息关系选机制。96项是可浏览研究，非96种独立发明；每片只取实际有用的几项。共享对象必须在像素里可追踪：保留身份、位置/方向与动作因果。静态JSON校验只能查声明，不证明真实连续。保护阅读焦点的屏幕位置、大小、对比和可见时间；不把它实现为全镜头、全图层必须冻结。主对象的动作应为下一步提供空间或线索，不无故转圈、闪白或反复重启ease。

先固定配色、字体角色、材质、运动习惯与声音语言，再处理细节；“分别设计”不等于各自独立。惊喜用熟悉对象在语义转折处改变角色来建立，不靠随机换风格。研究参考必须落实到实际生产组件；当前 #10/#11/#19 有 adapter，见 [生产注册表](production-registry.json)，其他研究不可只写 ID 就宣称已使用。粘土 adapter 为 SVG 模拟体积，不是完整真实 3D 管线。

人/身份、内容、载体/阴影、镜头可分层控制，但只在有交接任务时拆分；层数更多不代表更自然。统一字体、材质与运动性格，允许错开起落和轻微余势。使用命名语义事件与相对偏移管理时间，见 `src/production/score.ts`；不要在文字、镜头、遮罩与测试中各写一套绝对秒数。位置与裁切仍按真实内容设计，工具不自动导演。

复用经验前读 [最近两轮复盘](continuity-review-20261027.md)：保留用户选中的上一版，未接受的更复杂实验不成为默认。参考 [Emil Kowalski 的动效原则与迁移边界](emil-motion-reference.md)，保留原 Motion Skill 风格；不机械移植 UI 时长、实时网页动画或整套第三方风格。

## 音频到来后的短验证

先 probe 时长、核对转写与专有名词，再把语义完成、主要信息可读和下一步准备映射到命名事件。延续用户选定的视觉基线；加入音频不会自动触发重新切页，也不把每句字幕当作新镜头。先看正常速度的原声与画面，再单独检查静音衔接，最后才叠加已授权音效。原声保持 1×；音频、字幕、对象与机位共用一条帧时间轴。未收到音频时，不编造转写、重音或声画验证结论。

## 本地确定性工具

在本Skill目录调用，所有输出须新路径，脚本不覆盖原件，不发网络请求或模型请求：

```sh
python3 scripts/motion.py doctor --deps /absolute/compatible-node_modules
python3 scripts/motion.py catalog --relation cause --limit 6
python3 scripts/motion.py probe /absolute/voice-or-video --out /absolute/new-run/media-probe.json
python3 scripts/motion.py plan /absolute/story.json --out /absolute/compiled-plan.json
python3 scripts/motion.py audit-production /absolute/production-manifest.json --project /absolute/project --out /absolute/new-audit.json
python3 scripts/motion.py new --dest /absolute/new-project --deps /absolute/compatible-node_modules --story /absolute/story.json --media /absolute/voice-or-video --transcript /absolute/verified-transcript.json
```

没有新素材时，`new`省略media、transcript、story会生成明确标注的静音结构示例。真实媒体缺转写时生成 `needs_revision` 状态，不能称已成片。工程内 `npm run check && npm run build && npm run verify:frames`，`python3 serve.py --port 4341` 仅本地预览。要看旧单项机制打开 `studies.html`；这是参考库，不代表新片已使用全部机制。

音效/配乐输入使用 `new --story /absolute/story.json --media /absolute/audio --audio-kind sfx`（或 music）；不把音效当旁白要求转写，也不因加入音效重新切分视觉。省略 audio-kind 默认 voice，兼容旧工程。

首次新题材优先用连续15–25秒验证声画关系，按完整句意选片段并保存源时间；用户指定整片时按其范围完成，不硬塞固定片长。

默认运行模板为横屏16:9，支持 collect/connect/compare/evidence/conclusion 五类二维语义结构、原声与固定真人窗；竖屏须按内容另排版。新的复杂机位要按本片内容编辑源码。人脸自动追踪、自动韵律/节拍识别、任意语义全自动导演并未内置。不要把替换JSON说成已解决一切导演问题。

用户要求导出时，在同一工程运行 `npm run render`；使用已有Chrome和依赖，H.264/AAC，音源与画面共用帧时钟。缺依赖先报告，不自行下载。读 [验收](acceptance.md) 完成真实文件检查，不以构建成功代替成片验收。

## 规格与交付

Spec Kit用来固定constitution、spec、plan、tasks和检查记录。详细适配、已核验版本和官方链接见 [Spec Kit适配](spec-kit.md)。它不自带语义导演、机位或读懂检测。本包是独立领域适配，不是官方影视扩展。日常出片无需重跑完整软件开发工作流。

品牌默认沿用Interflow蓝#0070DB、黑#141414、白和灰；可在story.brand配置。粘土只用于有叙事任务的对象，原Logo不变形；真实照片/数字有来源，未知不编。个人音视频、密钥、联系人不进入Skill分享包。

交付工程、媒体来源、语义镜头/阅读预算/声画落点、实际预览和检查；按请求导出MP4。分别报告完成、待接入和待素材；用户观感/听感未确认就保留pending。用户要求自动完成时，在已授权的本地范围推进，不每一步索取确认。
