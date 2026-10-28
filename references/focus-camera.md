# 重点词运镜 · 可选 beta 扩展 focus-camera/0.1

状态：随 `1.2.0-beta.1` 提供；不承诺自动保持任意内容的审美。**默认关闭，不加入稳定 selector，不改变原有 10 个生产 adapter。**

## 只补一层“此刻看哪里”

Motion 继续决定材质、字体、布局和对象动作。品牌角标/片内页脚不是默认必需元素，按镜头目的与用户风格决定。这一层只在语义需要时改变景别，并把重点词映射到已存在的具体对象：

- `pull-back-reveal`：局部停留 → 明确选择/触发 → 拉远揭示上下文。开头局部必须有信息，不能只放大标题。触发点为可选示意点击，真实视频已有动作时不要另造点击。
- `focus-return`：全貌 → 某条线索/局部对象 → 停稳后短注解 → 回到全貌。用于异常、证据、限制、对比差异等少数重点；普通过渡不加镜头。

两种构思的取舍：整片持续机位变化会改变 Motion 原有风格；本补丁选择少量语义事件，以“到达—阅读—返回”为完整单元。每镜一个重点，不逐字追字幕，不叠多套焦点框。注解补充对象结构、来源或边界，避免复述字幕。

## 使用

新 `motion.py new` 工程会复制模块，但不会启用。既有工程可显式复制：

```sh
python3 scripts/install_focus_camera.py --project /absolute/existing-project
```

不同内容的同名文件会拒绝覆盖；脚本只复制两个模块，不改项目入口、依赖、音频或镜头。阅读 `assets/focus-camera.example.json`，由 Agent 核对语义、真实对象位置和可读时长后填写计划。

```tsx
import {compileFocusPlan, focusFrameAt} from './production/focus-camera';
import {FocusCameraStage, FocusCameraAnnotation} from './production/FocusCamera';
// plan 放在组件外编译；t = useCurrentFrame() / useVideoConfig().fps
const frame = focusFrameAt(plan, t, {enabled:true, strength:1, annotations:true});
return <>
  <FocusCameraStage frame={frame}>{/* 原场景对象 */}</FocusCameraStage>
  <FocusCameraAnnotation frame={frame} color={theme.blue} fontFamily={theme.chinese}/>
  {/* 字幕、品牌、来源说明保持屏幕坐标，不放进 camera stage */}
</>;
```

`enabled` 缺省为 false；关闭或 strength=0 返回恒等机位，不增加场景包装 DOM。切换时不改音频和时间。保留原局部焦点框时，仅在新注解接管的时间窗抑制旧框，避免重复。

## 计划与阅读约束

- `targets` 用画布世界坐标绑定对象；仅支持已知静态矩形。会移动的对象须由编排者提供对应几何或拆段，本版不跟踪。
- 所有 cue 以秒为单位，共用影片时钟；必须有 keyword、targetId、start、arrive、holdUntil、end。focus-return 在 arrive 后 0.12 秒淡入注解，然后满足 minReadSeconds，再返回。
- maxZoom 默认 1.6，最多 2；真实图片/视频须由编排者核对原尺寸，设置 target.maxScale。本扩展不读取媒体清晰度。真实操作片段优先固定机位，不能放大模糊素材掩盖质量问题。
- `safeArea` 和 `protectedRegions` 为屏幕坐标，保护字幕/品牌。完整重点对象必须落在安全区域；注解自动试下、上、右、左，无空位则隐藏并返回 annotationReason。文字实际字宽未自动测量，需看像素；保持短 label + 一行 detail。
- 拉远允许主动裁切媒体，须人工检查首帧、触发、揭示完整性。focus-return 的完整重点对象不可裁掉。相邻 cue 不重叠；不自动移位、改时长、加音效或调用模型。
- 输入校验不等于视觉验收。记录实际用的 mode、keyword、target、时段、材质来源、屏幕固定层、媒体清晰度与原速检查结果。

## Playground 验证后再稳定合入

至少比较：原版 / 补丁开 / 补丁关；同一声音与帧号。看开头、推近前中后、停稳注解、退回全貌；另测随机 seek、轻幅度、注解关闭、非目标镜头。关闭补丁的抽样像素应与原版一致。

本次概念来源：[超级峰视频设计](https://github.com/mileson/chaojifeng-video-design)，研究固定提交 `a7c84de88f9632a013ab2db16cb9ab0543f897e9` 的景别组织与信息揭示原则；新写实现，未复制上游代码、素材或整套工作流。具体 Terra 文稿、克隆声音、媒体和测试场景不进入 Skill 公共资源。黏土材质继续由 Motion 原组件提供。

## 与真实素材或任务 UI 交接

相机不能代替对象行动或媒体准备。按 [交接编排检查](handoff-orchestration.md) 写单一事件图：过程证据选输入/焦点等过程组件，不推断成功；预热只包媒体，字幕/光标保持正确的整片时钟。按需运行 validate_handoffs.py，再检查真实 waiting/resume 和每个交接前中后画面。
