# 可选编排合同与构建指纹

这是一层可选工程工具，保留既有 semantic-plan 和生产 adapter API。它不会解析口播语义、检测强拍或替作者选择镜头，也不会生成视频。没有 `orchestration` 字段时返回 `not_requested`，不是检查通过。

## 一份计划：意思、对象、时间各有主人

在原计划的 `shots` 保留 `id`、`meaning`、`focus_object`、`object_ids`。新增 `orchestration.version = 1`：

- `events`：唯一命名事件表，值为 Composition 秒数。镜头引用 `startEvent`、`endEvent`、`readableFromEvent`、`readableUntilEvent`。如果旧镜头还写着 start/end，必须相等；迁移后可以不重复写。局部返修只需扩展受影响镜头，不强迫重填全片。
- `objects`：每个对象的 `id`、`space`（world/object/screen）、`geometry`。同一对象同一 property 只能登记一个 owner。合法的父子坐标和媒体局部时间仍可使用；这里检查声明，无法证明代码真的只计算了一次。
- `shots`：以 `shotId` 关联原镜头，声明 `role`（process/result/context）、`narration`、`visual`、`annotation`、阅读预算、`motionIntent` 和组件 `reference`。无口播或无需注解时明确写空字符串。
- `reference`：id、version、entry、skin；custom 另写 reason。记录来源和偏离，不凭有一个文件名就声称实际接入。hold、自定义组合、静态阅读不判为失败。
- `evidence`：id、source、scope。result 镜头必须引用存在的 `evidenceRef`。工具只查引用完整；引用和一个 true 都不能证明材料支持结论，事实仍需人核对。
- `handoff`：to、kind、event、reason；focus/match/expand 还须 objectId 在前后两镜都存在。切镜和对比可以没有共享对象。交接不能发生在本镜阅读窗口结束之前。

解析完全部镜头后再核对接收者：接收镜头必须在交接事件时处于 start–end 范围。focus/match/expand 的 event 表示焦点交付完成，必须落在接收镜头的 readableFrom–readableUntil 范围；若要记录过渡启动时间，请另建事件，不用启动时间冒充完成。接收镜头可提前挂载或准备，是否可读仍由单独的阅读窗口约束。cut/contrast 可以先切入再做入场动画，这种情况标记阅读覆盖 not_checked，不误判为无缝交接。

局部计划未扩展接收镜头时给出 warning，并将该关系列在 `handoff_checks` 为 not_checked、总计划为 `plan_partial`。接收镜头时间无法解析时，同样不称已核验；其已有时间错误仍阻断。即便得到 declared_valid，仍只是作者声明一致，不保证 DOM 已可见、媒体已解码或画面已读清。

CLI 退出码：完整声明有效为 0；blocked/stale 为 1；输入/文件错误为 2；plan_partial 为 3。局部计划可以继续制作，但不能把退出码 3 当成发布门槛通过。

画面和字幕完全相同时发出可解释 warning，不强制改写。任务过程不能只画完成对号；“建议试用”的口播应展示具体动作或用途，“需要复核”应有实际待查对象。后一句不能仅靠上一镜的孤立待查卡片代言。

完整的合成计划在 [`assets/orchestration.example.json`](../assets/orchestration.example.json)。其中 `scene.tsx#RecordInspection` 是明确标记的待实现 custom 入口，不冒充现成组件或可播放案例。此文件用于新的编排解析器；旧 `select-motion` 的分类和字段要求保持不变。

```sh
python3 scripts/orchestration.py resolve assets/orchestration.example.json \
  --out .cache/orchestration/resolved.json \
  --shotbook .cache/orchestration/SHOTBOOK.md
```

输出 JSON 的 risk_windows 给出交接和首次可读事件前后 0.2 秒的建议检查窗。它不是自动抽帧，也不保证覆盖所有风险；快速运动、媒体冷启动等可另外增加窗口。所有时间来自命名事件，不从音乐能量峰推断叙事关系。

## 构建之后绑定实际文件

构建入口先生成产物，再把本次影响范围内的源代码、事件配置、音轨、素材和 bundle 显式列入。工具只读取这些文件，不扫描整个磁盘、不联网。下面路径是用户工程示例，替换成真实存在的项目相对路径：

```sh
python3 /path/to/motion-video/scripts/orchestration.py snapshot \
  --project /path/to/film \
  --source src/Scene.tsx --source src/events.ts \
  --config story.json --audio public/audio/music.wav \
  --asset public/images/photo.jpg --artifact public/player.js \
  --out /path/to/film/.cache/build-manifest.json

python3 /path/to/motion-video/scripts/orchestration.py check \
  /path/to/film/.cache/build-manifest.json --project /path/to/film
```

每类参数可重复。结果记录 SHA-256、字节数和内容派生 build_id；源、音轨、素材或产物改变/缺失返回 `stale` 和非零退出码。清单创建时文件缺失直接报错。拒绝绝对依赖路径、`..`、越界 symlink 和常见密钥配置路径。显式列入的普通文件也可能含私人内容，发布仍要隐私扫描；指纹工具不是保密内容识别器。

依赖清单必须包含本镜实际 imports、公共主题、时序数据及所有音源；它不自动遍历 JS import 或发现漏列素材。换声音、速度或配置后先重新映射时间、构建和审片，不能只重新 snapshot 来冒充旧审片仍然有效。把 build_id 显示在 Playground 和审片记录上由工程入口接线完成，此工具不会注入网页。

## 五类证据分别看

`resolve` 把 `evidence.plan` 写成 valid/partial/blocked；wiring、pixels、playback 始终是 not_checked，user_acceptance 始终是 pending。`plan_partial` 表示仍有交接未核验，不是完整计划通过。`snapshot/check` 只证明显式文件集合的内容新鲜度，五类验收仍未检查。不要用 plan_valid 或 fresh 当成发布许可、画面流畅或审美通过。

实际接线需检查组件消费事件与几何的实现；画面需看前/中/后和参考对照；播放需测原速、正反 seek、循环和 waiting/resume；用户认可需明确到版本及范围。已认可的无关镜头保留，并用同帧对照检查是否回归。公开示例应使用合成或有权公开的素材，不能携带克隆声音、私人截图、缓存和本机路径。

```sh
python3 -m unittest discover -s scripts -p 'test_orchestration.py' -v
```

负例覆盖缺证据、未知事件、重复几何 owner、读取时间冲突、交接丢对象、接收镜头尚未开始或尚不可读、音轨更换导致 stale、缺文件、越界/秘密路径与清单篡改；有效的提前准备、hold/custom 保留，未扩展接收镜头和切镜入场明确标记 partial。它们验证工程规则，不验证导演品味。
