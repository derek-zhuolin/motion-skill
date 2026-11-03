# 音频到界面表达：从意思选择动作

## 用户实际调用

“用 Motion 把这段音频做成解释视频，按内容选手机或界面，节奏紧一点，保留原来的材质。”已经足够。Agent 负责语义判断、机制选择、镜头编排与观看，不要求用户点出组件名；原声事实和来源必须保留。

## 四步翻译

1. **输入与时间。** 复用已核对 transcript/SRT、source hash 和缓存；没有转写按原Skill边界处理，不重复转写、不静默增加ASR/付费调用。原声1×，字幕cue是锚点，不强制一句一镜。
2. **观众新看懂什么。** 写清对象、前态、动作、后态与来源。例如“清掉支线→保留一条选题”，不是先挑一个手机皮肤。
3. **关系与载体。** 按含义选筛选、深入、选择、安排等关系，再决定放在手机、窗口、真实屏幕、文字、粘土载体或其他媒介；继承已有材质和品牌。组件不替代Agent的语义判断。
4. **整片编排。** 让有关系的对象持续或显式交接，保护阅读结果，按原声分配动作时长与停留；一个语义可以跨多个cue，不固定四幕或固定组件数量。

## 已可直接调用的 frame 组件

共同形态：`<Component frame={localFrame} fps={fps} duration={seconds} accent={brandColor} fontFamily={font} content={content}/>`。完整画布1280×720，可作为一个镜头放入主片；frame可前后跳，负帧夹紧开场。无Act、setTimeout、CSS animation/transition时钟。

| 关系 | 组件 / 默认时长 | content 必填 | 动作及边界 |
|---|---|---|---|
| 筛掉无关内容 | UISwipeArchive / 3.4s | title, discardTitle, discardDetail, keepTitle, keepDetail, result | 按住、滑动、释放后惯性离场、下一行补位；一条舍弃一条保留的关系 |
| 进一步深入 | UIPhoneExpand / 3.7s | title, cardTitle, cardSubtitle, detail, result | 同一卡片释放裁切变成详情，文字不随外壳scale；此版本是展开并继续，非任意手机应用生成器 |
| 把想法变成选择 | UIConversationCards / 4.9s | title, prompt, question, choices(恰3项), answer, result；selectedIndex可选 | 问题、选项、已回答记录、新任务、原位确认；不等于实际调用AI |
| 将任务安排到日程 | UIFreeDrag / 4.4s | title, task；subtitle/result可选 | 抓取点跟手，斜向移动，目标槽定位，松开吸附；当前是日程网格示意 |
| 输入变成素材 | UIUpload / 3.8s | title, fileName, fileType, fileSize, result | 同一个文件Row从桌面被抓起、运入、展开为上传行，进度完成后成为资产；fileSize是显示字符串 |
| 两个人协作同一内容 | UIPresence / 3.8s | title, documentTitle, body, focusText, result, collaborators(恰2人) | 每人一色，头像、光标与选区一致，结果写回同一文档；不代表真实协作服务 |
| 查看一段数据的具体点 | UIChartScrub / 3.6s | title, chartTitle, unit, points(2–16点)；result可选 | 指针、竖线和曲线上点共位，读数对应最近的原始数据点；未给来源时标为示例数据 |
| 新对象影响整体 | UIAggregate / 3.7s | title, listTitle, itemTitle, metricLabel, baseValue, increment, result；itemDetail/unit可选 | 同一个增量chip入列，落定后合计才从baseValue变为baseValue+increment；无自动回滚 |

导入位置均为 `src/production/<Component>.tsx`。共享工具 `ui-frame.tsx/css` 提供 token 舞台、原生光标和纯数学时间函数。参数长度限制按Unicode code point明确报错；必要时用短标题和显式换行组织词组，而不是缩到不可读。

```tsx
import {UISwipeArchive} from './production/UISwipeArchive';
<UISwipeArchive frame={frame - cueStart * fps} fps={fps} duration={3.4}
  content={{title:'先留下一个方向',discardTitle:'暂时无关的支线',discardDetail:'先放一边',keepTitle:'真正要讲的内容',keepDetail:'这一条继续展开',result:'保留，进入下一步'}} />
```

它们以语义动作独立登记到`production-registry.json.ui_extensions`，`audit-production`可检查真实import/调用；study_id不伪造为96项研究编号。内容导演可用custom candidate或UI索引声明这些扩展，按实际调用记录证据。

新增四组的完整内容形态如下，组件会验证文字长度、数组形状、数值范围和时间参数：

```ts
type UploadContent = {
  title: string; fileName: string; fileType: string;
  fileSize: string; result: string;
}; // 3.8s
type PresenceContent = {
  title: string; documentTitle: string; body: string;
  focusText: string; result: string;
  collaborators: readonly [
    {name: string; color: string}, {name: string; color: string}
  ];
}; // 3.8s；两个名字、两种六位hex颜色须不同
type ChartScrubContent = {
  title: string; chartTitle: string; unit: string;
  points: readonly {label: string; value: number}[];
  result?: string;
}; // 3.6s；2–16个唯一label，数值有限且非负
type AggregateContent = {
  title: string; listTitle: string; itemTitle: string;
  itemDetail?: string; metricLabel: string; unit?: string;
  baseValue: number; increment: number; result: string;
}; // 3.7s；有限非负数，合计不超过1e9
```

按语义选择：一段录音成为可用素材时可用上传；多人共同修改同一对象时可用协作；解释有来源的序列时可用图表查看；输入一个对象使整体统计改变时可用入列合计。图表值与合计必须来自用户内容或明确标示的示例数据，模拟上传、协作与统计画面不提供真实操作或真实时间来源证据。

完整组件、原有扩展、UI小部件、Icon与光标的调用位置见 [组件目录](component-catalog.json)。目录标为可组合的 UI 外观可用于 frame 影片，但它自身的浏览器行为不是全量适配承诺。

## 接力而非固定模板

可选连续示例：清理灵感→卡片展开→对话选方向→任务进日程。这只是一条有语义因果的示例链。真实内容若讲数值变化、人物、真实操作证据或空间关系，就选其他已适用机制，不强行塞进四组。

同一选题/任务在下一镜保留名称、身份与可追踪的视觉交接；若媒介改变，给一句观众能理解的理由。手机不是所有内容的默认答案，UI层也不覆盖原材质、IP、媒体和其它动效。

## 音频、示意与事实

音频说真实操作时，优先核对真实产品/屏幕/结果来源。模拟UI可以解释关系，但不是实际完成操作的证据；示意画面须在交付中写明。此组件库不自带任意音频理解、ASR或新的模型服务。

时长由意思、原声锚点和读完时间决定；默认短时长用于试片，不统一倍速原声。先看含完整意思的短片，再按本轮用户范围扩展。

## 当前验证

最初四个组件各完成了代表帧的真实Remotion renderer渲染，另有交互式前后定位与合片检查。新增 `UIUpload` / `UIPresence` / `UIChartScrub` / `UIAggregate` 均已完成真实 Remotion 4.0.538 代表帧渲染；本地目录还验证了旧动效、材质、IP、mesh 和 UI 部件的代表状态。代表帧证明渲染接线，不代替全片原速、声画同步、性能或用户审美接受。新内容改变后重新检查；其他未登记Gold仍是原例参考。

## 更多有趣方向

presence、chart-scrub、subscriptions、upload 已分别适配为 `UIPresence`、`UIChartScrub`、`UIAggregate`、`UIUpload`。后续更多Gold仍按真实内容需要逐项适配，不能因为原例能在浏览器播放就计入可调用frame组件。
