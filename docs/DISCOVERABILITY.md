# 文档完整性与搜索可发现性

检查日期：2026-10-26。范围是公开 GitHub 仓库的描述、文档与入口；不是搜索排名或 AI 推荐效果测试。

## 本轮改进

- 首页先说明适用人群：有想法、想表达，但不想出镜的创作者；区分“不露脸”与“匿名”。
- 中英文简介说明 voice-to-video、Codex、Remotion、实拍和字幕，采用自然描述，不堆砌关键词。
- FAQ 给出可独立理解的直接答案，并链接到工程、能力边界、提示词、来源和许可记录。
- 保留有声 MP4、动图、源码与字幕入口，让读者能够验证案例。
- GitHub About 与相关 Topics 补充项目用途；将“96 attributed studies”修正为“96 motion studies”，避免暗示全部出处已完成核对。
- 增加内测反馈和 PR 指南，要求实际预览、来源及验证范围。
- CI 的官方 Actions 升级为 Node 24 运行时并锁定提交 SHA，测试系统固定 Ubuntu 24.04；项目测试仍使用 Node 22 / Python 3.12。

## SEO / GEO 的边界

GitHub Topics 用于分类和发现项目，见 [GitHub 官方说明](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/classifying-your-repository-with-topics)。准确的简介、直接答案和清晰链接也方便人和 AI 阅读，但不保证排名或引用。

Google 的 [AI 搜索说明](https://developers.google.com/search/docs/appearance/ai-features)强调现有 SEO 基础仍适用：重要信息用文字表达、建立可发现的链接、提供可靠内容；不要求新增特殊 AI 文本文件或 schema，且索引与展示没有保证。这是 Google 的说明，不推断其他 AI 平台采用相同机制。

目前只维护仓库，没有另建独立网站。在 GitHub 仓库放置 robots.txt、sitemap 或 JSON-LD 文件不等于已经配置了 GitHub 页面本身的抓取与元数据。本轮不把未测量的搜索效果写成成果。

## 仍需继续验证的事项

- 早期研究 1–64 的逐项出处不完整，保留许可排除和署名缺口。
- 9:16 / 3:4 需要工程适配；本地 Playground 演示不等于生产模板已支持自动切换。
- 依赖、下载源与不同操作系统的可用性会变化；CI 通过不能代替实拍下载与实际视频复看。
- 社区贡献按实际效果更新能力表，研究数量变化需同时更新分类、目录与说明。

源代码验证以 [GitHub Actions](https://github.com/derek-zhuolin/motion-skill/actions) 为准；此前 reference 的媒体检查见[制作记录](REFERENCE.md)。
