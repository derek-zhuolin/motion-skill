# 开放式编排与视觉复审（本地 v6）

## 职责与默认范围

当前 Agent 理解原话、观看本地素材、评估候选并实现镜头。脚本解析时间、提供可查的完整目录、检查声明和记录实际使用；不内置 ASR、视频理解模型或自动审美评分。

默认只读当前项目和用户已登记的素材目录。暂不自动抓取；不搜索用户其他私人目录。素材索引只记录路径和类型，不把文件名命中当作画面匹配，不把“本地文件”当作许可。逐个查看拟采用的素材，记录实际内容、可用范围、画面角色与裁切。

品牌只继承本片明确适用的标识、字体、色彩约束、素材身份。画面媒介、构图、景别、IP 出场和镜头顺序从本次语义重新决定。未指定 Interflow 项目时，不强加其蓝色、Logo 或云朵 IP。除非用户明确要求复刻，旧片代码只是可参考的实现，不是新片默认结构。

产品界面分支：在当前 Motion 任务中，Agent 自动按 [Stageshow UI 接入](stageshow-ui.md) 选择原生部件和原例；继承本片既有材质与品牌。仅 UI 镜头使用这一分支。先按 UI 索引找关系动作，再接入统一 frame，不要求用户额外点名。

## 实际执行

1. **输入与时间**：先检查已存在的转录和 source hash。有原声且有 SRT 时运行 `direction srt`。保留原声 1×；SRT 是时间锚点而非分镜，允许多个 cue 属于同一事件、同一 cue 被多个镜头引用。重叠字幕保留并警告，不暗中平移。解析不等于已校核对齐。缺 SRT 时先查缓存；仍缺则报告，不新增转录服务。文案片可继续，时间标为预估。
2. **找素材和机制**：用 `direction assets` 索引指定目录；用 `direction catalog` 联查研究效果、组合配方、成片组件、原生部件、图标和完整 UI 示例（`--limit 0` 列全量）。阅读候选源码/预览，保留各自的适配状态。没有命中就读完整目录或按内容设计，不能默认退回卡片。
3. **导演选择**：Agent 写一个有理由的构思；确有实质分歧时再比较备选。不同应体现在主体、媒介或空间关系，换色不算。按开放的 relationship 记录状态变化、主焦点、阅读窗口、持续对象和交接；不限制为 7 类或固定四幕。候选须有适合理由、Agent 评估的 fit；脚本只在同等适配候选中参考最近使用。先给用户简短编排清单，非逐镜审批。
4. **实现与追踪**：运行 `direction select`，再实际导入组件或实现 custom。study 被选中不自动变成已接入；需适配并验证。镜头具体坐标/时长可以存在于影片代码，禁止将它们当作以后所有影片的固定值。新 custom 先保留于项目，只有可复用接口与实际画面检查齐全后才考虑登记；不自动把每次实验塞进全局库。
5. **针对性复审**：删减需同时写出删了什么、因指向/反馈/交接保留什么；改善检查重点可见、前后状态和原速阅读；性能分别记录预览、素材解码和导出是否实测，未经测量标未测。这些是观察维度，不强制循环三遍，也不等于“减少动画就是进步”。
6. **实物证据与历史**：保存每个变化镜头的实际截图、调用点、实现文件和观察文字；运行 `direction review`。若有稳定 adapter 同时运行既有 `audit-production`。这些是静态线索+人工观察的记录，不是自动像素识别。原速连看和用户接受单独记录。通过后 `direction remember` 写入本地历史。不要写入纯计划或伪造的观察；证据变更会拒绝写历史。重复构图/媒介/主动作给出警告，相关性优先，系列延续可写 repeat_reason。

## CLI

在 Skill 目录调用，输出均使用新文件；history 默认读取实际安装目录的 `.local/composition-history.jsonl`，也可用 --history 指定同品牌共享的本地 JSONL。不要放进发布包。

```sh
python3 scripts/motion.py direction srt input.srt --fps 30 --duration 10 --out run/anchors.json
python3 scripts/motion.py direction assets --root /absolute/project/public --out run/assets.json
python3 scripts/motion.py direction catalog --query '聚合' --limit 12 --out run/candidates.json
python3 scripts/motion.py direction select run/direction.json --history /absolute/local/history.jsonl --out run/selection.json
python3 scripts/motion.py direction review run/selection.json --project /absolute/project --actual run/actual.json --out run/review.json
python3 scripts/motion.py direction remember run/review.json --history /absolute/local/history.jsonl --run-id unique-project-revision
```

`new --transcript input.srt` 现在会输出 subtitle-anchors.json，并在没有显式 --captions 时将解析结果传给原字幕配置；不生成分镜，不把 transcript_verified 置为 true。单独的 direction srt 输出也可作为 --captions 输入。存在双人重叠字幕时，现有单条字幕 renderer 不会同时显示两行说话者，应另行设计显示，不把 parser 警告视为已解决。

## 输入字段

`direction.json` 包含 duration、concepts（id/idea/tradeoff）、selected_concept、concept_reason、可选 anchors（上述解析输出）、shots。

每个 shot：id、start/end、meaning、自由文本 relationship、before/after、focus_object、composition、medium、action、reading（ready_at/until/min_seconds/basis）、cue_ids 或 timing_reason、object_ids、handoff（to/kind/reason/object_id；明确 cut 可不保留对象）、candidates。

每个 candidate：type（adapter / study / composition / component / icon / example / custom）、id、suitable、reason、fit（0–1 的 Agent 判断，非客观审美分）；custom 另含 design。study id 指 catalog 编号，adapter id 指 registry；其余 ID 取自统一检索结果。旧组件 ID 继续作为 alias 使用。选择后状态仍是 planned_not_wired。

每个镜头可声明 `layers`：每层有独立 id、候选与作用，例如手机载体、消息关系、材质动作、文字层级、共享运镜。它们与主候选共同工作，不是相互替代。层数不设配额，不为了覆盖库而堆组件。时间、几何和交接对象由本片语义决定，不能把样片坐标固化成通用编排。

研究效果和 composition 仍是 adaptation_required，原生浏览器部件仍是 frame_binding_required。找到一个示例不等于已经将 Act、CSS 或 SMIL 接入 Remotion frame。请求 representation 时必须匹配能力声明；SVG 模拟体积不能满足 rendered-mesh-3d。声明匹配也不证明三维素材或运行依赖已经准备好。

`direction catalog` 保留旧的 effects / matches 字段，另返回 components、compositions、icons、examples、total_matches。limit 对每类分别生效，避免研究效果占满结果而隐藏真正的组件入口。检索是公开数据查询，候选适合性仍由当前 Agent 结合内容判断，不声称内置自动导演。

`actual.json` 包含 fps、shots（id/mechanism/caller/implementation/symbol/observed_frame/frame_evidence/visual_note；实际与计划不同加 change_reason）、passes（remove/improve/performance 各有 findings）。路径相对工程根；observed_frame 是 composition 全局帧号。review 检查文件存在与静态 import/JSX 线索，不证明该帧真正使用了组件；观察人负责对照像素，不能只看到报告 pass 就跳过。

已选层必须在 actual.shots[].layers 中逐一提供相同 id 与 caller / implementation / symbol；可继承镜头的截图和 observed_frame，也可提供层自己的可见时刻。复审核对实际 import 的模块、导出/alias、原实现的内容哈希和 JSX 调用，缺层或以其他组件冒充会阻止通过。原生部件另写 frame_binding，说明浏览器自主动画如何关闭、哪些属性由统一 frame 接管，并实际验证暂停/定位。

study / composition / example 的实际记录需要 adaptations：逐项列 id、caller、implementation、symbol、frame_evidence。仅写一串“已适配的编号”不够。静态检查仍不能识别死分支、遮挡或谎报观察；组件在关键时刻真的可见、表达成立、材质达标和动作连贯，必须看片判断，用户接受仍单独记录。

## 反模板验收

保留真实旧版与相同输入，不能给 Before 人为添加噪声或晃动。检查不同语义样例（过程变化、观点冲突、真实素材解释）的编排差异，不把三个名称换在同一构图中算通过。SRT 合成测试数据只验证解析与跨 cue 编排，不冒称原声对齐已验证。无原声或真实材料时，明确可验证与尚待验证的范围。

## v6：复审结果必须能表示“不合格”

沿用旧表单即可新增这些观察信息，不限制镜头数量、MG 类型或固定造型：

- 每个实际 shot 增加实际 `composition/medium/action`，不从计划偷偷复制。与计划不同须说明 change_reason。
- 增加 `visual_checks`：meaning、material、continuity 各含 status（pass / needs_revision / not_applicable）和 observation。没检查或仍需修改会阻止 evidence_recorded 和 remember；not_applicable 也须说明原因。这里只验证记录是否闭环，不自动判图，也不能防止 Agent 虚假填写，必须诚实看片。
- frame_evidence 使用 PNG/JPEG 截图；按实际字节而非文件扩展名检查基本文件头与尺寸，避免把文本文件当截图。仍需观察实际图像和运动过程。
- 实际调用文件及其静态本地 import、静态 staticFile 素材、package/lock 文件一并记录哈希。动态引用、外部素材等不能由静态扫描完整发现，须通过 actual.dependencies 显式列明。文件变化后重新复审，不复用旧结论。
- SRT cue 需合法时段。镜头引用的 cue 默认与镜头有时间交集；有意提前铺垫或延后回看时填 anchor_offset_reason，不强制每句切镜。
- 多个构思的 id 与内容不能完全重复；只有一个有理由的构思也可继续。脚本仅能识别重复文本，不把“文字不同”自动当作两种有意义的创意。

用户反馈独立追加，不改写原始制作记录：

若本片需要明确的界面归属或分区关系，`actual.layout` 可指定本地 `contract` 与 `samples` JSON。contract 按本片声明采样时刻、可见区间、内容所属容器及互不遮挡的区域；samples 来自实际浏览器 frame，记录继承父级后的 opacity、真实 DOM 祖先与归一化画面边界。review 将界面过早消失、内容脱离容器、越界、分区重叠或漏采样列为阻塞项。该检查是可选的空间关系检查，不强制工作台、分栏或统一模板；有意重叠的对象不声明 disjoint。它不证明美术质量，也不替代原速观看和用户反馈。

连续片需要检查交接中间帧及卡片内部文字，不能只检查每段停稳后的大容器。`contained` 关系可声明 `from/until`；`disjoint` 也支持 `{ids:[a,b],from,until}`，旧的 `[a,b]` 写法仍有效。关系的时段应来自真实的进入、停留与退出安排，不为隐藏失败而缩短。稳定段的 `visibility` 可加 `min_onscreen`，同时提供 `viewport:{width,height}`，用于拒绝 opacity 正常但界面已经移出画面的情况。几何检查不理解遮罩和审美；滑动、叠化、文字接替仍须观看，并保留已发现故障的反例验证。

```sh
python3 scripts/motion.py direction feedback user-feedback.json
```

反馈文件含 run_id、source（仅 user）、note（真实反馈）、dimensions，例如 typography=accepted、meaning=needs_revision、material=needs_revision。只根据用户明确反馈填写，Agent 不代替用户接受作品。select 会返回 recent_feedback，先读其中的拒绝原因；旧作可用于避免重复，不因为“已做过”就成为被认可的样板。v1 旧复审仍可读取，但重新 remember 必须做 v2 复审。

视觉重点：用已看见的主体、动作和结果来承载语义；不让未解释的字母/加号/连线充当内容。接触要检查交接前中后的实际边界，不能靠名字叫 Join 推断相接。同一主体材质不能无理由由有体积变成扁平；用户选择的粘土视觉属于延续项，不能为了去模板化自行删除。保存与当前材质相关的基准，不许把 SVG 渐变称为真实 3D。


## v11 已认可方向优先

音频任务先读 [连续粘土方向](directed-motion.md)。构思比较和历史三轮复审是判断维度，不再要求每次产出两套方案或固定三遍检查。按关键问题看、改、复看；保留已有验证工具的字段兼容，但不要把填表作为影片效果。
