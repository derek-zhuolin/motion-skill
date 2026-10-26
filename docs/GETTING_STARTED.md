# 从 reference 到新片

## 环境

- Node.js 22+、npm（依赖版本锁定在根 package-lock.json）。
- Python 3 标准库负责时间、工程生成和检查。
- FFmpeg / ffprobe 用于真实媒体、导出验证和 reference 配音提取。
- 已安装的 Chrome/Chromium。未找到时设置 `REMOTION_BROWSER_EXECUTABLE`；不会自动下载。
- ASR 不内置。使用自己的、已获授权的转写能力；不要把模型下载、上传录音或付费生成当隐含步骤。

## 静音试运行

在仓库根目录：

```sh
npm ci --ignore-scripts
python3 scripts/motion.py new --dest /tmp/motion-example --deps "$PWD/node_modules"
cd /tmp/motion-example
npm run check
npm run build
npm run verify:frames
python3 serve.py --port 4342
```

示例没有音频，画面明确标注结构示意。要显式导出静音演示时才运行 `npm run render -- --allow-example`。

## 只有文案，不录音

使用 `mode: "script"`，让 Agent 根据真实文案填写 story、镜头时长与阅读预算，不填写虚构的转写或口播时间。不要传 `--media` 或 `--transcript`；`source.voice_url` 留空，人物窗关闭。以自己的文稿 story 创建工程：

```sh
python3 scripts/motion.py new --dest /tmp/my-script-film --deps "$PWD/node_modules" \
  --story /path/script-story.json
```

这与省略 story 后产生的 `example` 结构演示不同。完成检查与实际预览后可导出无口播视频。没有接入任何音源时为静音；需要音效或音乐须另行实现，见[声音说明](AUDIO.md)。

## 真实口播

1. `probe` 原音视频，取得实际时长。
2. 准备已核对的转写和时间。不要把能量低谷当语义切句。
3. Agent 填写 `assets/story.example.json` 同结构的 voice story，按真实内容写镜头，而不是盲目替换示例字句。
4. 在 `story.captions` 写核对过的字幕；也可用 `new --captions /path/captions.json` 传入同结构对象。
5. `plan` 算阅读预算，消除 blocking 后 `new` 创建新项目。
6. 检查类型、构建、帧状态，复看后导出。

```sh
python3 scripts/motion.py probe /path/voice.m4a --out /tmp/new-run/media-probe.json
python3 scripts/motion.py plan /path/story.json --out /tmp/new-run/compiled-plan.json
python3 scripts/motion.py new --dest /tmp/new-film --deps "$PWD/node_modules" \
  --media /path/voice.m4a --story /path/story.json --transcript /path/transcript.json \
  --captions /path/captions.json
```

示例路径需换成自己的文件。`new` 不覆盖已有目录，`plan` 不覆盖已有输出。

## 字幕契约

```json
{
  "enabled": true,
  "fps": 30,
  "cues": [
    {"id": "c01", "start_frame": 15, "end_frame": 84, "text": "先把想法说出来"}
  ]
}
```

帧区间左闭右开。不得重叠或超出原声时长。默认 voice 输出没有字幕会被拦；用户明确要求无字幕时写 `{"enabled": false}`。排版位置和长句仍需实际检查；通用模板的底部字幕适合短句，reference 附独立 SRT。

## 验证

```sh
npm run verify:rules
npm run check
npm run build
npm run verify:frames
npm run verify:template
npm run verify:privacy
```

本仓库没有开箱即用的 ASR、自动语义分镜、音乐节拍检测、人脸跟踪或竖屏自动重排。它提供明确的时间/素材契约和可编辑实现，帮助 Agent 完成一次可复看的制作。
