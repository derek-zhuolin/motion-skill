# 可调用组件全景

机器清单：[component-catalog.json](component-catalog.json)。本地维护工程的 Playground 位于 `outputs/motion-component-library-v10`，预览入口 `http://127.0.0.1:3278/library/`；仅在该本机预览服务运行时可用，不是公开服务或 Skill 自带常驻服务。

## v11 新增的连续细节入口

新增 8 个 frame 辅助入口：PhraseReveal、PageHandoff、CardResponse、NavigationCue、TraceRule、TraceConfirm、SoftClaySurface、SoftClayJoin。接口和语义边界见 [连续粘土方向](directed-motion.md)。旧基础与 UI 数量保持不变，不把辅助组件冒充 8 套完整影片模板。

## 原有入口

| 类别 | 数量 | 使用方式 |
| --- | --- | --- |
| 原有基础 adapter | 10 | KeywordWindow、KineticWords、ClayJoin、NumberReel、ValueReveal、NumericComparison、LineReveal、MediaFocus、DrawAnnotation、FocusHandoff |
| 原有扩展入口 | 10 | ClaySurface、DocumentSplit、DocumentFilter、FlowFeedback、SpatialExplanation、MediaView、ExplanationFilm、IPActor、CameraStage、FocusCameraStage 与 FocusCameraAnnotation 组合 |
| 产品 UI frame | 9 | ProductUIFilm；UISwipeArchive、UIPhoneExpand、UIConversationCards、UIFreeDrag；UIUpload、UIPresence、UIChartScrub、UIAggregate |
| 可组合 kit 部件 | 33 + 光标 | Window、Phone、输入、列表、消息、图表、状态等外观和状态部件 |
| Icon 名称 | 33 | 用真实 kit 的 `Icon name`；实心版只覆盖源集已提供的字形 |

这是 63 个组件/部件预览入口，另有 Icon 列表。一个入口可以组合多个 helper；参数函数、时序工具和命令不冒充额外可见效果。

## 怎样调用

用户可以直接说：“用 Motion 把这段音频做成视频，按内容选择手机、产品界面和原有材质，动作灵动一点，节奏紧但读得完。”Agent 按当前内容选择实际组件并接线，不要求用户记组件名。需要指定效果时，可以描述“一个文件拖进来后成为素材行”“两个人在同一份文档里标重点”“指针扫过图表，读数跟着对应数据点变”。

UI frame 的共同输入为 `frame / fps / duration / accent / fontFamily / content`，Content 接口见 [ui-narrative.md](ui-narrative.md)。旧基础组件的输入有 `t`、progress 或 Remotion hooks，由同一影片 frame 换算；不能误以为所有旧组件都接受名为 `frame` 的 prop。

## 能力边界

- 真实 3D 扩展需要已渲染 mesh 帧与投影锚点，IP 需要授权图片，MediaView 需要本地媒体和来源声明。总览重用现有本地资产，不内置这些个人素材。
- 可组合部件不等于整组动画已经 frame 适配。kit 原生 Collapse、Roll、Swap、Count、Connector、Fly、Follow、States、Stream、Popover、Scroll、Camera、Expand 仍按原生浏览器行为理解，进入影片时需逐项接管时间。
- 96 项研究是参考范围；已有 10 个基础 adapter 的登记与研究编号保留，不能将研究数量写成生产组件数量。
- 产品 UI、上传、协作和统计可以用于示意，但不证明真实外部操作已经发生。图表值必须来自明确输入；样例数据保留演示标记。
- 技术接线、代表帧、原速播放与用户接受分别记录；总览不构成所有素材、所有尺寸或所有主题的视觉验收。
