# 有状态的解释组件（本地升级候选）

目的：把能复用的内容状态和画法落到实际组件，而不是让所有主题使用同一张空卡片。

## 先判断含义，再选可用实现

Agent 读取原话/SRT，先判断是科普关系、流程展示还是个人复述，再提出两种构思与取舍。只继承被认可的蓝白绿、字体、克制 UI 和粘土材质；构图、镜头和动作从本次内容决定。

运行 `python3 scripts/motion.py explain recipes` 查看这次真正接线的少量实现：

| 关系 | 实际内容对象 | 变化 | 既有组件 |
| --- | --- | --- | --- |
| split | document：原文段落、段落 ID、来源身份 | 原文档展开，段落内容保持 | ClaySurface、CameraStage |
| filter | 同一 document | 选择既有段落，保留来源 | 同一组内容节点和材质 |
| feedback | flow：同一表达/问题的各状态 | 载体沿路径进入下一状态，再得到反馈 | ClaySurface、CameraStage、curve |
| spatial | spatial：真实部件 ID | 相机转动、空间展开、投影标注 | 程序化 mesh 渲染和 UI 标注 |
| show | media：实际图片或视频与其指代对象 | 展示具体界面、产品或已有结果 | MediaView，本地 PNG/JPEG 或视频 |

这是少量已实现的语义组件，不是封闭的全部镜头类型。未覆盖的关系继续使用 `direction catalog/select` 查研究、适配现有组件或实现 custom；必须真实调用并查看画面。不能为让命令通过而改写原意，不能把未接线的 96 项研究当作本片使用清单。

## 具体事物先选择对应素材

先明确本段的对象、动作和主张，以及它是实际发生还是未来构想。具体界面、产品、操作和成片结果优先查看相关实物素材，再决定是否需要 MG 解释关系；不能为调用粘土组件把所有名词转成抽象部件。SRT 负责时间，不证明素材匹配。

`media` 注册本地素材：`path`（相对 brief 所在目录或绝对路径）、`type`（image/video）、`subject`、`source_note`、`caption`、`role`（evidence/context/explanation）、`reality`（recorded/reconstructed/generated）。`kind: media` 的对象或 view 通过 `media.asset_id` 引用它；事件用 `relation: show`。可选 `start_seconds` 和 `fit`（默认 contain）属于 view.media。示例：

```json
{
  "kind": "media",
  "title": "已有成片",
  "segments": [{"id": "video", "text": "视频结果"}],
  "media": {"asset_id": "existing-film", "start_seconds": 2, "fit": "contain"}
}
```

编译器要求声明来源与可见说明，并拒绝将生成/重建素材声明成真实证据。build 只复制实际引用的本地素材，记录 hash；检查视频轨道和片段长度。素材视频静音、1×，主原声保持连续，不新增抓取、转写或配音。生成和重建素材自动显示示意标记；旧成片需要 caption 说明是已有示例，不能冒充本次音频自动生成结果。

主体和说明仍需实际看片核对，字段完整不等于语义正确。没有微信操作实录就保留缺口；不能用另一款产品、任意手机照片或抽象卡片宣称已表现真实操作。真实视频本身承担动作时不额外强加漂移。没有相关媒体可走开放入口定制，不能静默退回统一模板。

## 一份源时钟

事件引用一个或多个 `cue_ids`；SRT 不固定成一句一镜。每个对象声明 owner、title、segments；每个事件声明 meaning、before、after、object_id。

编译检查：引用必须存在；同一个对象的前后状态必须接上；owner 不能改变；筛选只能来自原有段落。它只核声明一致性，不能判断 Agent 是否读懂原声。

动作的起落与口播解释时长分开。默认按关系给短动作预算，不把十秒口播拉成五秒的 UI 慢动作。必要时在事件里填写 `action_cue`（该事件引用的 cue）与 `action_seconds`；保护阅读窗口。具体镜头需要多次变化时，按可见事件拆开并由同一对象衔接，不添加无意义漂移。

## 同一内容可以换画面，身份不换

`objects.<id>` 保存原始身份与内容；可选 `views` 定义具名表现形式。事件用 `view` 选择该表现形式；不同 view 的 `kind` 可以分别为 flow、document 或 spatial。物理部件 ID 通过 `content_id` 对应回原内容，不能换 owner 或引用不存在的内容。

编译器根据连续事件的 view 与 object_id 生成 scenes；数量不固定，空白时间延续前一画面。每个画面仍由实际组件承担含义，不因主题换成新一套空卡片。`meaning`、`before`、`after`、`cue_ids` 记录选择与交接依据；当前由 Agent 判断语义，编译器只校验声明和时间，不是自动视频检索或语义模型。

可选镜头：flow 的 `follow` 跟随载体，`overview` 从结果拉回流程；spatial 的 `part-relay` 根据真实投影点跟随输入和输出部件。`asset_range: [1, 0]` 可倒放已有展开帧来表达装配。只有视图改变时才进行短暂的前后画面交接；原声和字幕时钟保持连续。

当前 24 秒原声曾演示语音传递、处理任务、粘土模块和结果回看，但用户指出抽象模块与具体对象不匹配，语义与素材需修改。这是该素材的编排选择，不是所有输入的固定四幕。共享 renderer 的兼容性由其他既有主题与 CLI 测试覆盖；不把未实看的一分钟或新主题当作已验收。

## 正式命令

```sh
python3 scripts/motion.py explain compile brief.json --srt source.srt --out new-run/plan.json
python3 scripts/motion.py explain build new-run/plan.json --dest new-run/project --deps /absolute/existing/node_modules
```

有原声时，build 显式传入 `--audio /absolute/source.wav --offset 0 --audio-seconds 15`。只在本地截取，不变速；输出音源 hash、入点、实际长度和能量包络。音频不存在时标为静音示意，不生成新配音或伪造转写。

空间关系需要真实资产：

```sh
python3 scripts/motion.py explain mesh brief.json --blender /absolute/existing/Blender --dest new-mesh --frames 40
python3 scripts/motion.py explain build plan.json --dest new-project --deps /absolute/existing/node_modules --spatial new-mesh/manifest.json
```

连续 filter 从上一选择状态接续；同一 document view 不支持重复 split 来伪装折叠再展开，需明确 custom 折叠过程。

空间示例目前只提供 2–4 层程序化装配体。mesh 命令同时支持根 spatial 对象和事件显式选择的 spatial view；单次只生成一个装配体。输出实际 .blend、带透明度的 PNG、相机投影锚点；不代表任意 3D 建模生成能力。不操作用户打开的 Blender 场景。

## 验收与工程状态

生成工程不代表视觉通过。依次执行 typecheck、build，再查看关键状态、交接前中后、完整播放与原速声音。需要本地导出核验时使用：

```sh
node scripts/review_explanation.mjs /absolute/project /absolute/new-evidence
```

每次使用新证据目录，保存依赖 hash、帧和导出解码结果。脚本中的 frames/playback 初始是 awaiting_observation，用户接受始终单独记录。实际观察和三轮复审仍使用开放编排的 review 合同；修改源文件后重新核验，不拿旧截图证明新代码。

已补充 24 秒原声多画面 Live 对照；本轮按用户要求不新增视频或 3D 渲染。两路 code-review 的四项实现问题已修复并静态复核；102 项 Skill 测试与 4 项运行时状态断言通过。正常/中途改源的导出复审新路径、spatial-view 的 Blender 执行本轮未重新运行。具体样片的语义、素材和视觉接受单独记录，不因工程升级自动通过。
