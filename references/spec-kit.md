# Spec Kit适配与来源

本轮复用此前隔离安装的Specify CLI v1.2.3，commit 5ea8b1cf0a38699340a38e00d02770308997d8c0；2026-10-26再次核对官方release与本机version，并在新工程执行init、integration none。没有新增模型进程、全局Agent集成或事件钩子。

映射：constitution固定真实性/原声/可读性边界；spec写观众能复述的结果；plan写语义、注视点、时间预算和素材；tasks写可验证执行项；检查输出记录机械检查与人工观感。story.json是本Skill的领域契约，不是Spec Kit原生格式。

首版采用项目本地规格及模板，不冒称已发布官方preset/extension。CLI初始化和模板结构已执行；Speckit的Agent模型命令没有另开调用。日常换片由当前Agent填语义镜头，再用确定性脚本算预算、生成工程；无需为每条片子重装CLI或重跑完整SDD。

官方材料：
- https://github.com/github/spec-kit/tree/v1.2.3
- https://github.com/github/spec-kit/releases/tag/v1.2.3
- https://github.github.io/spec-kit/guides/customization.html

Spec Kit是流程/模板工具，不提供电影审美、ASR、读懂检测或自动机位。官方上游MIT许可；本包没有重打包官方CLI。自己的语义导演规则、工具和模板独立实现。字体各自许可随包保留；本地封装不等于替用户公开开源授权。
