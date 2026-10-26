# 参与内测与贡献

欢迎尝试自己的配色、改进字幕排版、适配新画幅、修复工程问题，或补充历史研究的来源记录。

## 反馈问题

先看[常见问题](docs/FAQ.md)与[运行说明](docs/GETTING_STARTED.md)。仍有问题时，使用仓库的 [Issues](https://github.com/derek-zhuolin/motion-skill/issues/new/choose)，附上：

- 使用的 commit / release、系统、Node / Python / FFmpeg / 浏览器版本。
- 执行的命令、预期结果、实际结果及脱敏后的最短错误日志。
- 若为画面问题：目标比例、具体时间点、脱敏截图；区分源码预览和导出 MP4。

请勿公开密钥、私人路径、原始录音、第三方未授权素材或含个人信息的截图。尽量提供可公开复现的小例子；脱敏日志里的路径可写成 `/path/to/project`。

## 提交修改

1. Fork 并在分支中修改，说明解决的问题；小修改保持范围集中。
2. 改视觉时附实际预览及时间点。只改配色不新增效果 ID；改比例时检查标题、实拍裁切、字幕和 ending。
3. 代码修改运行相关检查。工程变更通常需要 `npm run verify:rules`、`npm run check`、`npm run build`、`npm run verify:frames`、`npm run verify:template`；文档修改检查链接与事实即可。提交前运行 `npm run verify:privacy`。
4. 附检查结果和未验证项。未导出的预览不要标成已交付视频。

## 来源与许可

添加或修改参考效果时，附作者、原始页面、许可与使用方式，并更新 [ATTRIBUTION](ATTRIBUTION.md) / [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md) 中相关条目。缺失的信息明确标为待补，不自行推断授权。

仅提交有权分享的内容，并说明适用条款；沿用 [LICENSE_SCOPE](LICENSE_SCOPE.md) 的分区边界。早期出处不完整的研究档案不会因为一次 PR 自动变成 MIT。第三方原始实拍不作为独立素材包提交。

## 当前适合参与的方向

- 9:16、3:4 的生产模板适配与实机验证（当前默认模板为 16:9）。
- 长字幕断句、字号、安全区和画面重叠问题。
- 可访问的配色与对比度、不同字体的渲染表现。
- 研究 1–64 的逐项出处补充，以及可复现的跨平台安装记录。
