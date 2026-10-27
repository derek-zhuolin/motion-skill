# Remotion Best Practices：默认依赖与GitHub说明

Motion Skill负责内容判断、镜头选型、阅读时间与对象交接；Remotion官方技能负责React视频实现、时间线、素材和Studio规范；Remotion npm包提供渲染能力。三者分别安装/读取/执行。

## 默认调用

用户调用Motion Skill且任务涉及Remotion代码时，Agent必须先定位并读取remotion-best-practices入口，再按入口读取本任务需要的分支。无需用户再次提醒。编辑已有工程同样适用。只改文案文档无需启动整套视频流程。

```sh
python3 scripts/motion.py preflight-remotion --project /absolute/project --out evidence/remotion-preflight.json
```

定位顺序：显式skills-root → 项目.skills目录（.agents/.codex/.claude）→用户对应技能目录。兼容官方技能为单独Skill目录或入口下REFERENCE.md的布局。输出路径、版本、hash与必要分支；不把found写成已阅读。

Agent在开工记录中补充实际读过哪些分支；本机验证版本4.0.538是测试版本，不代表今后最新版。先读入口，不默认把所有规范塞进上下文。升级另作兼容性检查。

缺失时说明缺失、保留现有工程并完成内容准备。不得宣称已使用；不得自动联网安装。经用户允许安装后可按官方方法：

```sh
npx skills add remotion-dev/skills
```

官方文档：https://www.remotion.dev/docs/ai/skills
官方仓库：https://github.com/remotion-dev/skills

不要把一台电脑的 /Users/... 路径写成所有用户都能访问的依赖；不要宣称GitHub的SKILL.md会自动下载/执行另一个Skill。

## GitHub应展示的文件

- README：三层分工、首次安装两套Skill、preflight命令、15–20秒先样片的入口。
- SKILL.md：必须读取官方入口、按内容选型、开工前编排清单、已用/未用区分。
- references/semantic-orchestration.md：内容类型→效果选择表、连续性和阅读窗口。
- references/production-registry.json：实际可导入组件和研究编号；仍然保留study_only边界。
- assets/runtime/src/production/DetailMechanisms.tsx：真正可复用的数字/关键词/素材细节实现。
- examples / tests：结构化计划、选择输出、真实运行报告；公开例子使用授权素材或显式测试素材。
- CHANGELOG：本次问题、修复内容、验证环境与未覆盖项。本公开源码版本为 1.1.1-beta.1，整合本地 .4；源码推送不等于新建 GitHub Release 资产。

本包不重新分发官方Remotion技能正文；以依赖说明和定位器接入。Remotion技能及运行时各自遵循上游许可，Motion Skill不替上游另行授权。

## 测试与验收

验证入口存在、缺失时可解释、项目路径优先、语义匹配与防错、组件实际调用、代表关键帧、可读性与原速预览。构建通过不等于自动导演成功，也不证明所有Agent有相同结果。
