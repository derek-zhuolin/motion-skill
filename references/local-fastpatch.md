# 本地复用与按需检查

公开版整合本地 .2–.4 的执行路径，保留风格而不固定镜头。作者的私人 AME / GTM 基准、转写记录及原声不在公开包中；这里不公布私人项目的制作过程或速度比较。

## 登记自己的授权基准

`baselines` / `reuse` 读取本机 `.local/baselines.json`，或通过 `--registry` 指定文件。没有登记文件时会说明缺失；不假称已继承某个私人原片。已选原片优先；没有基准时用 `new` 建结构草稿或读取公开 reference 的源码，按新内容写镜头。

登记格式示例（路径改成自己的授权工程；模块须有对应 React 导出）：

```json
{
  "baselines": {
    "my-reference": {
      "label": "我的授权基准",
      "source": "/absolute/reference-project",
      "module": "MyFilm",
      "export": "MyFilm",
      "width": 1920, "height": 1080, "fps": 30, "frames": 450,
      "fonts": [], "props": {},
      "files": [
        {"from": "src/MyFilm.tsx", "to": "src/MyFilm.tsx"},
        {"from": "public/assets", "to": "public/assets"}
      ]
    }
  }
}
```

需登记组件实际依赖的代码、字体与素材；此工具不是通用依赖分析器。它复制白名单映射，不执行源项目脚本，不联网、不转写、不渲染。同名 adapter 有差异时保留来源原件并报告；可用不等于已经调用。兼容依赖需要与 package.json 对齐。

```sh
python3 scripts/motion.py baselines --registry /absolute/private-registry.json
python3 scripts/motion.py reuse --baseline my-reference --registry /absolute/private-registry.json --dest /absolute/new-project --deps /absolute/node_modules
```

初始产物标 `reference_copy`。改新内容必须重写语义事件、字幕与资产映射，旧片的时间点不能直接当新片时间。继承字体、材质与运动性格，按当前意思重新选镜头。

## 同源只转写一次

先查项目已有转写，再用 `scripts/transcript_cache.py get/put` 登记或查询。缓存按媒体和转写文件 hash 核验；命中不自动代表文字准确、覆盖完整或已获授权。引擎不在本包内，不自动启动 ASR 或并发跑第二套引擎。`.local` 及其绝对路径不得进入公开仓库或 pack。

## 少走重复路径

新片默认构建与检查当前片；研究库改动才运行 `build:studies` / `verify:studies`。规范只读本任务有关分支；局部改动不重新转写或重建全部研究。分别记录准备、转写、编排、构建、关键帧、导出与验证用时，不把总等待说成渲染用时，也不宣称已证明快几倍。
