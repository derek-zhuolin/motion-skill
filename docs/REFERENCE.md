# 48 秒 voice-to-video reference

[完整有声视频发布页](https://github.com/derek-zhuolin/motion-skill/releases/tag/v1.1.0-beta.1) · [直接下载MP4](https://github.com/derek-zhuolin/motion-skill/releases/download/v1.1.0-beta.1/motion-skill-reference.mp4)

![48秒静音动图预览](../demo/motion-skill-preview.gif)

## 实际制作方式

作者提供录音和视觉反馈，在 Codex 中使用 **GPT-6.1 Sol**（作者提供的模型标注）理解原话、编排、修改源码与检查。Whisper 本地转写；Remotion / Chrome 本地渲染；FFmpeg 检查和媒体准备。未把所有步骤说成由一个模型完成，也没有使用新的图像、视频、语音或音乐生成模型。

## 镜头与内容

| 时间 | 内容 | 画面任务 |
|---|---|---|
| 0–9.9s | 不想露脸，内容卡住 | 先提问；3.9s后出现真实剪辑工作台照片 |
| 9.9–17.1s | 先把想法说出来 | 声音胶囊成为稳定焦点 |
| 17.1–24.45s | 录音，交给 Agent | 5.4秒手机实拍；共享声音对象进入Agent |
| 24.45–31.1s | 声音长成画面 | 画面、动效、剪辑轨道渐进展开 |
| 31.1–39.1s | 你负责观点 | 深色留白，强调灵感、判断、表达 |
| 39.1–44.35s | 让想法被看见 | 总结与作品构图 |
| 44.35–48.064s | Motion Skill | 品牌名放大居中，45s后稳定至末帧 |

25条底部字幕按原声时间更新；最后一条46.867s退出，末屏余留约1.2s。字幕做了轻量口语整理：开场省略一处含混重复；ASR的“工作理由”按上下文整理为“工作流”。原话含义未新增经验或业绩，听感与具体字词仍欢迎作者/观众反馈。

## 真实素材

| 素材 | 作者 / 来源 | 成片范围 | 使用方式 |
|---|---|---|---|
| 剪辑工作台照片 | [Denise Jans / Unsplash](https://unsplash.com/photos/macbook-pro-turned-on-ZEtE38ybfao) | 3.9–9.9s | 场景示意；[Unsplash License](https://unsplash.com/license) |
| 双手使用手机视频 | [Natures_Embrace / Pixabay](https://pixabay.com/videos/id-202987/) | 17.1–22.5s | 源片2–7.4s、静音；[Pixabay Content License](https://pixabay.com/service/license-summary/) |

不是作者本人或作者的工作台，也不表示手机屏幕正在录音、素材中的剪辑软件是Motion Skill界面。第三方原件不作为独立素材包再分发，下载脚本只按这些来源准备本地副本。

## 已检查与边界

已检查：本地播放、全片解码、H.264/AAC双轨、1920×1080/30fps/1442帧；原声48.064s；字幕25个时间点确实绘制；实拍静音；片尾没有虚构仓库链接。

视频帧长度48.066667s；MP4容器约48.085s，差异来自帧量化和AAC编码尾垫。字幕版原声与源音轨零延迟相关系数约0.999976。此数据用于同步检查，不等于主观听感满分。

公开示范片保留作者授权发布的讲述声音；原始录音、位置/设备元数据、原始ASR和本机路径未分发。不能把移除元数据说成“声音匿名化”。
