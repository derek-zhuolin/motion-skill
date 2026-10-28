# Rhythm Playground

12 秒可拖动对照。两种内容变体（发票录入、库存整理）共享同一套命名事件与 `production/rhythm.ts`；两种编排（律动版、均匀版）保持同一素材、测试音和总时长。演示字段从资料进入表单，疑点保留并被镜头关注，避免用播放按钮表示一切动作。

## 直接试效果

[下载预构建Playground](https://github.com/derek-zhuolin/motion-skill/releases/download/v1.2.0-beta.1/motion-rhythm-playground.zip)（约0.9MB）。解压后按README.txt启动本地HTTP服务即可看对照，不需Node构建或ACE-Step。需要Python3；直接双击file://不支持。

## 本地运行

在仓库根目录使用现有匹配依赖，或首次运行 `npm ci`。这个命令安装前端依赖，不下载 ACE-Step 模型。

```sh
node scripts/test-rhythm.mjs
node node_modules/typescript/bin/tsc -p examples/rhythm-playground/tsconfig.json
node examples/rhythm-playground/build.mjs
node scripts/verify-rhythm-build.mjs
python3 -m http.server 4360 --bind 127.0.0.1 --directory examples/rhythm-playground/dist
```

浏览器打开 `http://127.0.0.1:4360/`。若依赖在其他目录，两个 Node 命令均支持 `--deps /absolute/node_modules`，版本须匹配根 `package.json`。依赖不会复制进示例。构建输出在被忽略的 `dist/`，运行时需要 HTTP，不支持双击 `file://`。

## 对照什么

- 律动版：提前准备、短促转移、分组落位、疑点阅读停顿；相机只导航到当前信息。
- 均匀版：相同动作按等间距时间安排，相机固定。它是教学对照，不代表旧 Motion Skill 的所有效果。
- 切换版本和内容保留播放位置。暂停后拖动，正向/反向 seek 都由当前帧重算。
- 测试音单轨。开关声音不会叠加第二播放器；没有配音，不能据此验收真实口播混音。

## 真实边界

测试音由 `build.mjs` 确定性合成，116 BPM，包含鼓和简单拨弦，不是 ACE-Step 生成歌曲。节拍、事件、镜头是示例作者手工选择；helper 不识别强拍，不判断语义，不自动编舞。本例不含私人原片、声音、商标素材，也不宣称任何模型完成了这些任务。

`build.json` 记录该次实际源码、打包用到的依赖输入、音源和 bundle 指纹。页面从同目录读取 build ID，并与构建时注入的 ID 比较；不匹配显示 stale。bundle hash 在构建后记录，避免自引用。页面 ID 检查仅能比较当前 bundle 与 manifest 是否同一代，**不会自动验证所有源码、依赖、音乐和产物文件**。运行 `node scripts/verify-rhythm-build.mjs` 才会逐项读取实际文件计算 SHA-256；任何变化、缺失、越界路径都返回非零和 stale。依赖目录默认是项目的 `node_modules`，可显式传 `--deps /absolute/node_modules`，源文件与产物不允许通过符号链接逃出各自根目录。`--self-test` 在独立临时副本中实际修改源码、WAV 与 bundle 一个字节，验证失败并还原，另验证越界路径与符号链接逃逸；不会修改当前源码。这些不是视觉验收报告。音频节奏和画面观感仍需原速观看与试听。修改音源、速度或镜头后，要重新选事件并生成证据。
