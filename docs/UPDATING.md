# 安装与更新

[回到首页](../README.md) · [本次 Release](https://github.com/derek-zhuolin/motion-skill/releases/tag/v1.2.0-beta.1) · [更新日志](../CHANGELOG.md)

更新用一句话：**“把我的 Motion Skill 更新到官方仓库最新版，先备份并保留我的修改。”**

Motion Skill 的安装名是 `motion-video`，仓库名是 `motion-skill`。下文使用官方 Skills CLI，不是新的自建更新服务。更新不是通知订阅，也不会自动更新别人电脑上的副本。

## 用 CLI 安装的原版

Node.js 22.20+。首次安装，按提示选择 Agent：

```sh
npx skills add derek-zhuolin/motion-skill --skill motion-video -g
```

以后更新全局安装：

```sh
npx skills update motion-video -g
```

如果当时装在项目内，在那个项目根目录运行：

```sh
npx skills update motion-video -p
```

`-g` 只针对全局；`-p` 只针对当前项目。保留 `motion-video`，避免更新其他 Skill。这些命令跟随原来记录的来源；上述首次安装跟随官方仓库默认分支，不保证只获取带稳定版标签的提交。固定分支或 tag 的安装要分别核对，不自动改其来源。

先用 `npx skills list -g` 查看全局已安装项；它只列安装项，不检查远端版本。若提示找不到 `motion-video`，先确认安装范围与方式，不能据此断言未安装或偷偷新装一份。不同 Agent 的路径不同，Codex 的 CLI 安装通常在 `~/.agents/skills/motion-video`，旧手动安装可能在 `~/.codex/skills/motion-video`。

**Skill 内有自己的修改、`.local`、配置或素材时，先停止直接更新。** 将整个实际安装目录备份到 Skill 目录以外，保留隐藏文件；由 Agent 对比后合并。CLI 的更新会重新安装文件，不负责合并用户修改。制作的视频工程应放在 Skill 目录之外。

## 手动复制、Git 与 Fork

| 之前怎么装 | 更新方式 |
|---|---|
| ZIP / 手动复制文件夹 | 备份旧目录，在新目录获取官方版本，对比后迁移自己的设置；不会自动登记成 CLI 安装 |
| 直接 clone 官方仓库 | 在实际安装目录核对远端、分支与本地改动；备份后，干净且可快进的分支可用 `git pull --ff-only`。有改动或分叉就先合并，不强制重置 |
| Fork 后安装 | 先在自己的 Fork 用 `Sync fork` 同步上游并处理冲突，再更新本地副本。CLI 会跟随原 Fork，不自动改成官方仓库 |

这些方式不需要强行迁移到新工具。不能仅凭文件夹名称判断来源。

## 不想记命令，交给 Agent

> 请把我的 Motion Skill 更新到 https://github.com/derek-zhuolin/motion-skill 的最新版。先确认实际安装位置与来源，备份并保留我的改动、私人素材和已有视频；有冲突先列出来。按原安装方式更新，不顺带更新其他 Skill，不上传文件。完成后告诉我版本和基本检查结果。

更新后核对实际安装目录中的 `package.json` 版本、`SKILL.md` 和 `CHANGELOG.md`；检查入口是否包含默认读取 Remotion Best Practices、编号镜头表、按内容选动效。不要用旧示范片的 Release 标签推断当前源码版本。Agent 未重新加载规则时，新开会话后再使用。

## 版本与通知，保持简单

- 对外标题：**Motion Skill 更新｜更连贯的动效编排**。
- 正文讲变化与更新方法；具体版本仍保留在更新日志、工程元数据和 Release 标签中，方便核对和回退。
- 当前仍为公开测试版；`beta` 不等于稳定性承诺。不重命名旧标签，不把本地 `local.*` 编号当用户需要选择的版本。
- 想接收后续 Release 消息，可在 GitHub 选择 `Watch → Custom → Releases`。单纯推送代码不是发布 Release，Star / Fork 也不等于订阅。已下载的文件不会自动更新。

## 核验记录与边界

2026-10-27 按官方文档及本机 Skills CLI **1.7.4** 核对；独立项目中验证安装与定向更新，不操作现有全局 Skill。CLI 文档与实现有一处差异：该版本的 `check`、`update`、`upgrade` 进入同一更新流程。因此这里**不提供 `skills check` 作为只读检查命令**，也不杜撰 `/update`、`motion update` 或尚未实现的快捷键。

官方参考：[Skills CLI](https://github.com/vercel-labs/skills) · [命令文档](https://github.com/vercel-labs/skills/blob/main/docs/commands.md) · [GitHub Fork 同步](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/syncing-a-fork)。CLI 后续版本可能改变行为；维护这份说明时同时核对实际实现，不能只复制文档。

## 1.2.0-beta.1 迁移范围

现有作品无需重建；新扩展不会自动改写旧场景。新项目可从runtime使用focus/rhythm模块，已有项目先在副本选择性导入，核对依赖与同名文件。`install_focus_camera.py` 遇到不同文件会拒绝覆盖。编排合同是既有semantic-plan的可选version=1扩展；不要为此重做已认可镜头。

克隆声音、素材、缓存、`.local`和私人基准留在原处。已装local补丁的使用者先备份，比较代码/引用再合并；不要直接用Skills CLI覆盖定制目录。重新构建后生成新指纹与审片记录，旧报告不能用于新版本。详见 [三步升级](ORCHESTRATION_UPGRADE.md)。
