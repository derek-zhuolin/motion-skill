# 参考、署名与来源核查

本仓库不主张全部动效技法原创。目录里的“96项”指96个有编号的机制研究实现，不是96项发明。保留参考者与上游作者，不用脱敏删除公开署名。

核查日期：2026-10-26。核查包括当前源码导入、工程依赖、已有参考字段和公开项目/页面；不是完整的逐行原创性鉴定，也不构成全量许可清查证明。

## 参考关系

| 研究 ID | 已记录参考者 / 来源 | 参考内容与本仓库范围 |
|---|---|---|
| 1–64 | 早期本地小样；[Oreo UI](https://github.com/oreo-design/oreo-ui) 机制参考 | 卡片、排版、回弹、微交互等；逐项对应未完整留存，不补造出处，不主张相关技法原创 |
| 65、66、72、76、78 | [Paper Shaders / Paper Design](https://shaders.paper.design/) | 玻璃、金属、网点、线场、软体等视觉机制参考；本库为SVG/CSS近似，未安装其shader包 |
| 67、69、71、73 | [Juan Mora Romero / Codrops](https://tympanus.net/codrops/2026/10/22/juan-mora-romero-portfolio/) | 柔性海报、文字空间、画布等视觉方向参考；没有收录上游站点素材 |
| 68、70、75 | [Jérémie Nallet / Atelier UI / Codrops](https://tympanus.net/codrops/2026/10/21/atelier-ui-webgl-dom/) | 文字与图像的弹性、曲线和切换关系参考；没有接入上游运行库 |
| 74 | [Codrops Creative Hub](https://tympanus.net/codrops/hub/) | 视觉方向集合参考；历史记录未留具体单项作者，不把Hub当成原作品作者 |
| 77 | [Noor Mtir / Paperlab / Codrops](https://tympanus.net/codrops/2026/10/18/real-folds-real-fire/) | 折叠、撕纸与触感方向；当前为二维遮罩/阴影近似，没有收录上游3D库 |
| 79、80 | [Oreo UI](https://github.com/oreo-design/oreo-ui) | 翻片、弹球、触感节奏方向；当前工程未导入Oreo组件 |
| 81–88 | [yihui-dev / awesome-kimi-k3-1-videos](https://github.com/yihui-dev/awesome-kimi-k3-1-videos) | 参考片/案例索引；目录与源码保留公开sourceId。合集MIT不自动授予每个原视频素材权利，仓库未收录那些原片 |
| 89、94、96 | [yomotsu / Camera Controls](https://github.com/yomotsu/camera-controls) | 观察位置、注视点、取景和透视关系；没有接入其Three.js库 |
| 90、95 | [Theatre.js](https://github.com/theatre-js/theatre) | 多属性时间线与焦点组织思路；当前画面仍由Remotion帧驱动 |
| 91 | [Codrops / Scroll3DGrid](https://github.com/codrops/Scroll3DGrid) | 图片平面的空间画廊关系；CSS/SVG近似，不使用上游照片 |
| 92 | [Codrops / RepeatingImageTransition](https://github.com/codrops/RepeatingImageTransition) | 画框接力与连续转场方向；不收录上游素材 |
| 93 | [Codrops / RotatingOnScrollAnimations](https://github.com/codrops/RotatingOnScrollAnimations) | 方向匹配、旋转与视角交接；不是原代码运行版本 |

完整96项逐条名称、分类和参考入口见 [EFFECTS](docs/EFFECTS.md)。保留来源字段并不表示获得了上游素材或所有代码的再许可。

## 仅列为后续研究、没有使用

[Simon Niklaus / 3D Ken Burns](https://github.com/sniklaus/3d-ken-burns) 的公开LICENSE为 **CC BY-NC-SA 4.0**。本包没有其代码、CUDA/CuPy依赖、模型、推理结果或上游照片；不把本库平面取景称为该项目的真实3D重建。

## 上游许可元数据核查

- Camera Controls、三个Codrops GitHub示例：GitHub公开元数据显示MIT。
- Theatre.js：Apache-2.0。
- Kimi视频参考集合：MIT；不推导合集内每个视频的授权。
- Oreo UI：当前公开根目录与license接口未发现许可证文件，**不推定可复制组件源码**。
- Codrops文章、Paper Shaders网页：参考页面可访问；没有据此推定其中代码、站点或素材均可再分发。

本次未找到上述参考组件的实际import或vendor目录，研究代码主要为本地React/SVG/CSS近似实现。但1–64项历史过程不完整，所以研究档案不新授MIT，不能只凭当前文件证明每一行原创。若发现遗漏来源或疑似直接复用，欢迎提Issue附文件、行号和原始链接。

## 工程依赖与字体

实际运行依赖为Remotion、React、React DOM、TypeScript、esbuild及它们的锁定依赖。它们不是本仓库原创，许可见 [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md)。Spec Kit只参考了规格组织方法和公开文档，未分发其CLI。

字体保留原文件与完整许可：Figtree（SIL OFL 1.1）、Source Han Sans（Apache-2.0及NOTICE）。

## reference 实拍素材

- [Denise Jans / Unsplash](https://unsplash.com/photos/macbook-pro-turned-on-ZEtE38ybfao)，[Unsplash License](https://unsplash.com/license)。
- [Natures_Embrace / Pixabay](https://pixabay.com/videos/id-202987/)，[Pixabay Content License](https://pixabay.com/service/license-summary/)。

示范片属于加入叙事、字幕与动效的组合成果；第三方实拍原件不作为独立素材包分发。用途和时间段见 [REFERENCE](docs/REFERENCE.md)。示范讲述声音由作者授权发布；没有做声音匿名化。
