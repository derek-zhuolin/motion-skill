---
name: motion-video
description: 显式调用 Motion Skill / Motion video 时，从原话、SRT 和本地素材提炼语义事件，按内容选择与改造动效，制作连续品牌短片或原声解释视频；涉及产品界面时自动选用 Stageshow UI 部件与参考规则；按需检查，不自动调用模型、上传或发布。
---

# Motion Skill · Motion video

本地定制版 **1.2.0-beta.1+local.11-directed-polish**。保留既有材质、节奏与交接扩展；新增有状态解释、本地媒体呈现与有边界的程序化粘土 3D，不宣称自动审美或任意 3D 生成。

本地工程升级新增 [有状态的解释组件](references/explanation-recipes.md)：`motion.py explain` 可以把 Agent 已判断的拆分、筛选、反馈事件接到实际组件，并用本地图片/视频展示具体对象与结果，另有程序化粘土装配体的真实 3D 路径。动作时长与口播解释时长分开。此扩展已增加 24 秒原声的跨画面 Live 候选，代码经过两路审查与针对性修复；样片尚待语义、素材与视觉接受，不能当作已验收的全自动成片能力；未覆盖的语义继续走下方开放编排和 custom。

## 已认可视觉基准与新音频入口

默认用 [连续粘土方向](references/directed-motion.md) 与 [视觉档案](references/directed-profile.json) 继承 polish32 已认可的字体、蓝色、柔和粘土、主次、阅读和交接质量；明确的本次品牌或用户要求优先。短版与完整 [调用提示词](references/audio-directed-prompt.md) 随包提供。用户只要给音频和目的，不需要点组件名。

新音频先运行 `python3 scripts/motion.py brief --audio /absolute/audio.mp3 --out /absolute/new-run`，再核对转写、按新意思设计并实际接入组件。该命令保存音源指纹、要求和源码，不是自动导演或成片生成器。读取本机 `.local/accepted-motion.json` 可找到认可原片；没有原片也要准确说明，不能把组件小样称为认可影片。

本片具体镜头和秒数不是通用模板。每段先问“动作后看懂什么”，保留完整 UI 与对象身份，主动作错开，快段可用真实图像，结果完全出现后留读。至少寻找一个合乎内容的记忆点，不强行给每段加同一套动效。按关键帧和原速播放修正，测试通过不替代视觉接受。单片已认可；下一段音频的迁移效果仍待实测。

## 产品界面：自动使用 Stageshow UI 层

在 Motion 任务中，只要内容涉及产品窗口、表单、任务列表、拖拽、图表、聊天、通知或手机操作，自动读 [产品 UI 接入](references/stageshow-ui.md)，并按其中索引选用 Stageshow 真实部件与 Gold 原例，不需要用户再次点名。普通 Motion 调用仍按内容选择文字、图形、真实素材、IP 与空间表达；已选材质、字体、品牌和原有动效能力继续保留，UI 不强制全片换成第三方风格。

先看最接近原例的完整动作和实际展示尺寸，再改成当前产品。输入/选择/拖动/完成须有具体对象、可见过程和依赖反馈。界面用于影片时使用统一 frame 时间源，不能把浏览器 CSS 动画或异步 Act 脚本直接当成已可导出的 Motion 组件。

正式随包提供本地 Stageshow kit、Gold 参考、`ProductUIFilm` 创建→排序→分享，以及 `UISwipeArchive`、`UIPhoneExpand`、`UIConversationCards`、`UIFreeDrag`、`UIUpload`、`UIPresence`、`UIChartScrub`、`UIAggregate` 八组独立 frame 组件。按语义关系选择和组合，输入内容/时长/品牌可配置；其余未登记原例进入影片前仍需逐项适配。详细入口、依赖、参数和范围见上述 reference 及 [UI 索引](references/stageshow-index.json)。

完整实际入口见 [组件目录与调用](references/component-catalog.md)：原有10个核心 adapter、9个 UI frame 组件（含任务流）、10个原有扩展，以及33种可组合 UI 部件、33种 Icon。目录区分 `frame_component`、扩展、可组合外观与浏览器行为；可组合不代表其内部网页动画已统一为 frame，96项研究仍是研究资料，不能当作96个生产组件。原生光标与其它部件按目录分别展示。

处理音频时，先按 [音频到界面表达](references/ui-narrative.md) 把语句翻译成可见的筛选、深入、选择、安排等关系，再选动作和载体；不固定套四幕或每句都用手机。原声与已核对转写提供时间锚点，组件由同一 frame 驱动。

产品 UI 默认收紧空等、允许辅助动作重叠，在抓取/落定/展开处使用有因果的轻回弹；保护输入结果、重排结果和完成反馈的阅读窗口。用户说慢时先调整事件与交接，不把全片或原声统一加速。

## 默认创作入口：开放式编排

先读 [开放式编排](references/open-direction.md)。本节优先于下方历史工作流：默认本地素材，不自动抓取；有 SRT 就解析为时间锚点，按语义事件分镜，不固定一句一镜。Agent 按内容直接选择构思；确有实质分歧时再比较备选，不逐镜审批。

先使用 `motion.py direction assets/catalog` 查看当前素材和全量研究，再由 Agent 提出适配候选，运行 `direction select`。可选 adapter、study 适配或 custom 新动作，不受旧七类选择器限制。实际实现后以截图、调用位置和针对性复审记录运行 `direction review`，再 `direction remember` 记录近期构图/媒介/主动作。具体字段和命令见上述文档；这些工具不替代语义理解或像素检查。

默认继承当前品牌身份，不继承旧片布局；IP 按叙事需要出场。缺素材时变更表达或准确报告缺口，不退回固定卡片。旧 `select-motion` 保留给已有计划兼容；新主题默认走开放入口。旧片修改仍只改相关镜头。

用户认可的字体、排版、材质和局部运动分别保留；构图自由不代表可以丢掉已选粘土视觉。同一对象跨镜保留材质、体积与身份；明确区分真实 3D、渲染图资产、SVG 模拟体积，不因组件名含 Clay 就宣称满足 3D 期待。符号须有可见释义，MG 动作要表达具体变化；“调用了组件”“截图存在”均不等于表达合格。

`direction review` 必须记录含义、材质、连续性的实际观察与 pass/needs_revision/not_applicable。有未解决项不能写成可复用的正向经验。用 `direction feedback` 记录用户对不同维度的明确反馈；既保留认可的字体，也保留被指出的内容问题。没有音频依据时不先编造功能、角色或关系填满画面。

## 内容连续版：先重点信息，再可见事件

制作语音动效、IP 表达或用户要求连续内容时，优先按 [内容连续表达](references/content-events.md) 做：识别重点与来源 → 定义前后状态变化 → 选择素材和持续对象 → 安排主次与交接 → 最后加入必要运镜与声音。先用关键状态图说明新增理解，不能把移动次数当信息密度。此顺序先于下面的效果选择；不把某条片子的文字、四个角色或黑色面板固定为模板。

用 `assets/content-events.example.json` 记录可见事件，运行 `python3 scripts/content_events.py check plan.json --out event-check.json`；需要交接时用 `compile` 输出共享事件表和短镜头表。检查只核声明状态/来源/反馈，不自动理解原声、不判断审美、不证明组件已接线。IP 任务由内容决定，重点标注和完成反馈必须有实际可见变化。使用 `.local` 登记的 `content-events` 本机认可基准时，只继承风格与表达方式，新内容重排事件。

## 默认入口：规范 → 编排清单 → 实现

只要本次要写或改 Remotion，先运行 `python3 scripts/motion.py preflight-remotion --project /absolute/project`，读取它定位的 **remotion-best-practices/SKILL.md**，再按任务读取具体分支。无需用户重复点名。只是找到文件不等于已读；记录实际读取路径、版本与 hash。缺失时按 `references/remotion-integration.md` 处理，不假称已调用、不静默联网安装。保留已可运行工程与内容准备工作。

动手前按 `references/semantic-orchestration.md` 给用户一张**简短镜头编排清单**：时间/本段意思、主焦点、主效果编号与名字、辅助效果、进出场和交接对象、选择原因、可读窗口。先说再做；这份清单不是新增逐镜审批。数字快照、数字变化、关键词层级、证据截图、主体运动的视频要分别判断。每镜一个主表达；效果数量随内容，不规定10或15组。

由当前 Agent 读内容和核对素材。新主题默认使用上方开放式编排。仅当维护既有 `semantic-plan.example.json` 格式的旧项目时，才使用 `select-motion` 兼容入口。两条入口均须实际导入组件并检查画面；planned 不代表接线，更不代表语义或材质通过。旧项目出现原选择器未覆盖的关系时，可转入开放入口或标注 custom，不把内容硬塞进旧七类。


## 先走最短的正确路径

读取项目 AGENTS、当前任务及用户选定的视觉基准。新 run 保留原件。在本机运行 `python3 scripts/motion.py baselines`，明确修改原片或复刻时可使用 `reuse` 继承实际影片代码、字体和授权素材；新主题只借用适用资产与机制，重新编排；**不要先用五类默认卡片模板重建它**。

- **连续 Launch**：优先用户选定的全球品牌新玩法或 GTM。让一个载体贯穿发现、选中、展开、协作；按语义选少量转折，保留阅读停顿。
- **原声解释**：按本片内容选视觉语言；用户指定 AME 才继承其风格。同一视觉跨多句话，真实影像与示意关系分工；原声保持 1×，无视频不生成说话人脸。
- **修改/复盘**：直接读目标工程的相关镜头和时间表，不重跑转写、信源研究、模板生成或全研究库。
- **没有可用基准**：才用 `new` 建标注清楚的结构草稿，并按实际内容写镜头。默认五类 renderer 不是电影感模板，也不会自动调用研究适配器。

`reuse` 只复制本机已登记源，不执行源脚本，不联网、不转写、不渲染。新工程初始是 reference_copy，旧时间和旧口播属于旧片；换内容时更新语义事件、字幕和资产映射后才能称为新片。没有登记源时准确报缺失，不静默降级为卡片片。

```sh
python3 scripts/motion.py baselines
python3 scripts/motion.py reuse --baseline global-launch --dest /absolute/new-run --deps /absolute/existing-node_modules
# 其他已登记基准：gtm / ame；实际列表以 baselines 输出为准。
```

## 语音：同一段只转写一次

先查已核对的项目 transcript 和 source hash；没有就查询缓存：

```sh
python3 scripts/transcript_cache.py get --media /absolute/audio
python3 scripts/transcript_cache.py put --media /absolute/audio --transcript /absolute/transcript.json  --engine existing-local-engine
```

缓存默认位于本 Skill 的 `.local/transcript-cache`，不进入分享包。命中只证明源与转写文件匹配，仍需检查语言、词时标、覆盖范围和专名；不自动把 verified 改为 true。只做短样片时优先处理选段及少量上下文，不默认整段转写两遍。本轮默认不新增或启动转录服务；缺转录先报告。用户另行启用转录时才复用现有可用本地引擎，启动前记录输入 hash、范围、引擎、预计时长和超时。已有转写任务仍在运行时不要并行开第二种实现；确需切换时先确认旧任务已退出，再只补缺失范围。不因尾部卡住重复跑完全部内容。本 Skill 不内置 ASR 模型或自动切换服务。

## 连续表达与轻量 IP（本地实验）

用户需要高密度、动作接力或 IP 时，按 [连续表达与轻量 IP](references/continuity-ip.md) 规划：压缩无意义等待，保护可读窗口；对象接力与运镜共享命名事件；文字、IP 和路径分区，收尾整体居中略偏上。使用原始授权 PNG/SVG，IP 偶尔引导和强调，不强制每镜出现。没有指定图像生成时不调用 Image API，不要求每组生成图片，也不设置新的统一立体艺术画风。继承已选影片风格。

可复用 runtime `production/ip-motion.tsx` 提供确定性的 IPActor、hopPose、blinkScale、track 和 CameraStage；具体素材与面部坐标属于项目。先用 `scripts/check_continuity_ip.py` 检查声明的时间与布局，再核对运行时画面、实际接线及原速声音；计划通过不是视觉验收。此扩展不修改稳定 adapter registry。先做用户指定时长的 Playground，验收后再扩片。

## 镜头与时间

先一个主焦点，再安排对象交接。保护正在读的对象，不冻结整幅画面；允许配角提前准备。转场必须解释深入、选择、联系、对比等语义，不能每句重开“标题＋中央卡片”。音频、文字、遮罩与机位共用命名事件；需要新的组合时才读 `references/motion-combinations.md`。继承好片的字体、材质、运动习惯与连续性；镜头结构按当前语义重选。复用轨道原件，不固定使用旧片的镜头顺序。先明确本片构思与取舍，确有实质分歧时再比较备选；不同关系不要总用同一组合。

避免 PPT 感先检查画面语法，而不是只增加平移或动画数量：为交接说明对象如何改变用途、景别、裁切或信息关系；真实视频先辨认正在发生的动作，再决定如何承接。连续镜头不等于全片一镜到底，不相关内容可以直接切。数据先解释测试对象、分母、结果及边界，再用图形呈现关系；不要把数字拼成仪表盘或让装饰压住读数。按实际素材与品牌限制配色、字体和材质，不把某次白黑蓝或灰度处理硬设为所有品牌默认。

检查快慢对比、停顿和声音落点：允许加速与留白，不机械等间隔，也不为密集而牺牲阅读；声音落点须人工编辑与实际听检，不宣称自动识别节拍。对象仍在画面内时不能因时间条件突然卸载。交接前、中、后看像素，原速检查画面和声音；浏览器性能、静态接线和用户审美验收分开记录，未能观看或听到就明确说明。参考 [连续运镜复盘](references/visual-direction-20261028.md)。

真实素材和原 Logo 保留身份与来源；明确为 Interflow 项目时默认蓝 #0070DB、黑 #141414、白和灰，不自动改米白。粘土适度，禁止为了动效加无意义漂移。音乐和效果音按已有授权复用；没有音源就明确静音，不编造节拍识别或效果数据。

## 可选：重点词运镜（本地实验）

只有用户需要突出某个重点，或当前语义确实需要局部证据时，才按 [重点词运镜扩展](references/focus-camera.md) 显式启用。保留 Motion 材质与动作，只补两类景别：局部停留后拉远揭示；全貌推近关键词对应对象、停稳短注解，再退回全貌。不要逐句缩放，不默认开启整片机位变化。关键词绑定具体对象，必要字幕留在屏幕层；不默认给整片加品牌角标或页脚，品牌按本片目的出现。注解补充结构或边界，避免复述口播。未绑定或无安全阅读位置时不强行添加。

扩展模块：`production/focus-camera.ts`、`production/FocusCamera.tsx`；新工程随 runtime 提供但默认关闭，既有工程可运行 `scripts/install_focus_camera.py --project /absolute/project`，冲突即停止，不自动改片。先做同帧开/关 Playground 与前中后检查，用户试完再决定稳定合入。本版是 custom experimental extension，不增加稳定 registry 的 10 个 adapter，不声称 selector 已执行或自动识别重点词。

## 混合媒体与任务交接：先检查耦合

局部交接或真实视频卡顿返修，按 [交接编排与检查](references/handoff-orchestration.md) 明确过程/结果证据、单一事件图、可读覆盖、媒体预热与几何归属；再运行 `scripts/validate_handoffs.py plan.json --out report.json`。输入/切换等过程不能用成功对号代替；完成标识须有真实结果证据。复用组件时核对内部时钟，不让焦点框、光标和相机各自重新缓动。真实视频只预热媒体节点，保留原入点与速度。

合同检查只核声明关系；还要看实际接线和原速播放的 waiting/resume 事件。局部返修保留其他镜头、声音和来源基准；不为通过检查重做整片，不把合同通过当作流畅或审美验收。

## 可选：工程编排与音乐律动

局部修复先回答“画面承担什么动作”，再调机位；播放图标不能代替任务过程，成功标识必须有结果证据。语义、组件来源、对象职责与几何 owner 可用现有 semantic-plan 的 `orchestration` v1 扩展记录，运行 `scripts/orchestration.py` 生成 SHOTBOOK 和风险窗口。详见 [编排合同](references/orchestration-contract.md)。

发布预览前，对显式源码、音轨、素材、配置和构建产物建立指纹；任一依赖改变，旧报告标 stale。五层状态分开：计划、接线、画面、播放、用户接受；哈希一致不自动升级视觉状态。按 [三步工程化升级](references/engineering-upgrade.md) 做范围明确的回归，不强制全项目重做。

用户要跟音乐调整画面时，先选定/试听已有授权音乐，或在明确授权后使用外部生成服务；再挑真实起音候选、口播锚点和语义停顿。使用 [音乐驱动编排](references/music-driven-motion.md) 的可选 helper，以 composition 时间控制分组、停留和机位，真实视频和配音不随音乐全局变速。不要每拍都缩放，不把频谱峰值说成可靠强拍识别。没有音乐时可静音制作。

[律动 Playground](https://github.com/derek-zhuolin/motion-skill/tree/v1.2.0-beta.1/examples/rhythm-playground) 提供同一时间与测试音的对照；合成测试音不是 ACE-Step 作品。Motion 不内置音乐模型、音效库或自动混音服务。使用 ACE-Step 前须说明 [首次模型下载、等待与效果边界](references/ace-step-setup.md)，不在未告知时自动下载数 GB 模型。新音源产生后重新检查锚点与混音，保留已经授权的配音。

## 只检查本次改动，不绕回整座研究库

默认先交 15–20 秒、包含完整意思的真实内容样片。用户验收通过后才扩整片；明确要求其他片长或直接整片时，以该次用户要求为准，不额外设确认。验收按 `references/pilot-acceptance.md`，技术检查通过不自动将用户验收改成 accepted。

继承工程运行 `npm run check && npm run build && npm run verify:assets`；默认结构工程运行 `npm run check && npm run build && npm run verify:frames`；涉及命名事件再运行 `verify:score`。`build:studies` / `verify:studies` 仅在修改研究库或用户要看研究库时执行。96 项是灵感研究，不是每片配额。当前 adapter 数量以 production-registry.json 为准，需真实导入才算接入。只改文案不重复渲染无关帧；只看 Playground 不默认导出整片。

关键交接检查前、中、后画面；原速连看一次，再确认文字与声音。真实 MP4 用于区分浏览器预览性能和影片编排，不把数学连续或测试通过说成审美通过。

导出使用独立 public 素材目录和每次新建的 bundle 目录；不要把历史 MP4、下载链接、研究页面一起打包。缺依赖准确报错，不自动下载。导出之后检查音轨、时长和解码；不顺带更新浏览器或系统配置。

本地素材优先。先查现有来源与实际图像/视频内容，按“证据、解释、情境”决定用途。默认不自动抓取；缺关键素材时先调整表达或报告缺口。只有用户另行启用外部检索时，再在授权范围内检索公开源并核对许可、裁切与语义；不以关键词搜索命中当作适配证据。此过程由当前 Agent 编排，不宣称本包内置全自动素材识别模型。

## 按需资料，不要求全部通读

- 前置选型、镜头编号与内容适配：`references/semantic-orchestration.md`。
- Remotion 依赖安装、定位及 GitHub 说明：`references/remotion-integration.md`。
- 新音频：`references/audio-contract.md`。
- 新语义计划 / 阅读预算：`references/direction.md`、`references/story-contract.md`。
- 需要新机制：`direction catalog --query ... --out ...` 查候选，再看实现与预览；检索不足时分批浏览全目录，不只在旧 relation 映射中选。
- 实际接入新 adapter：`references/production-pipeline.md`。
- 再次出现停走或读不完：`references/continuity-review-20261027.md`；PPT 感与真实素材融合：`references/visual-direction-20261028.md`。
- 完整命令和旧兼容流程：`references/workflow-detailed.md`，仅查相关段落。
- 本补丁来源和测量边界：`references/local-fastpatch.md`。

不修改原声速度、不编造内容、未知写未知；个人音视频和 `.local` 本机索引不得进入分享包。只做已授权本地修改。交付说明基准、实际改动、准备/转写/编排/渲染用时和未确认的观感；不要把已有原片副本当新完成片。
