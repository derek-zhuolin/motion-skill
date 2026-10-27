# 动效组合调用与视觉错位

此处是可调用原件的编排说明，不是另一套影片风格，也不保证仅替换 JSON 即完成导演。当前可直接导入的研究 adapter 是 #10、#11、#19；其余先在研究库查看并按内容实现。每片不设数量配额，先选一个主机制和必要的辅助机制。

## 先按关系选组合

| 内容关系 | 可用组合 | 交接任务与限制 |
| --- | --- | --- |
| 从关键词进入真实证据 | #10 KeywordWindow → 真实页面局部 → #11 KineticWords | 同一窗口揭示证据，重点短语接着建立；不在每个段落重做一次开场 |
| 从作者/来源进入某篇内容 | 持续身份 → 实际条目裁片 → 来源位置展开 → 共享标题 | 保留是谁、选中了什么的线索；不是一个已内置的整页 3D adapter，须按真实布局实现 |
| 两种观点/方法形成关系 | 共享内容对象 → #11 短语层次 → #19 ClayJoin | 对象在变换中仍可识别，粘土承担归位/接合；不暗示现实人物合作或自动工作流 |
| 重点已清楚，需要读证据 | 稳定主焦点＋次要层收尾，必要时干净切镜 | 允许停顿；不为“保持动”加入漂移、光效或抖动 |

统一配色、中文/英文的字体角色、材质、圆角与运动性格。变化可以来自裁片景别、遮挡、线索和角色，不必换字体或引入另一种 3D 风格。粘土仍是 SVG 模拟体积。

## 可执行的时间入口

新工程自动复制 `src/production/score.ts` 和 `score.example.json`，但不会自动接入默认影片。将示例另存为当前项目的 `motion-score.json`，由当前音频的核对转写或脚本语义填写根事件；示例中的 8 秒与偏移仅为结构示范。

```tsx
import {compileScore,cueProgress} from './production/score';
import scoreInput from './motion-score.json';
import {KeywordWindow,KineticWords,ClayJoin} from './production/Mechanisms';

// 在组件外解析一次。frame 来自同一 useCurrentFrame()。
const score=compileScore(scoreInput);
const motionTokens={keywordStagger:.08,keywordRise:12}; // 本片设计参数，可调整
const t=frame/fps;
const p=cueProgress(score,'content',t);

// 在现有影片中把这些值传给真正的对象，不只写进 manifest。
// world、theme、persistentNodes 由当前内容与共享视觉规则建立。
<KeywordWindow id="source-window" text="AI" open={cueProgress(score,'window',t)} theme={theme}>
  {world}
</KeywordWindow>;
<KineticWords words={['观点','方法']} t={t} start={score.beats.keywordAt}
  duration={score.cues.keyword.end-score.cues.keyword.start}
  stagger={motionTokens.keywordStagger} rise={motionTokens.keywordRise} theme={theme}/>;
<ClayJoin nodes={persistentNodes} t={t} contactAt={score.beats.contact}
  volume={cueProgress(score,'material',t)} theme={theme}/>;
```

片中只采用需要的组合，以上不是要求同时叠三种机制。`motionTokens` 是本片统一设计参数；关键词时长、错位间隔、位移现在可传参，原默认值保持兼容。最后一批短语的可读时刻要算入 stagger，不能只保护第一行。

`compileScore` 解析 `beats` 的数值或 `{after,offset}` 依赖；拒绝缺失事件、循环依赖、超时和空区间。`cueProgress` 用成片秒数得到确定性进度，不依赖组件挂载时间、DOM timer 或音乐分析。修改一个根事件会传递到相关图层；它不会替你选择镜头、速度或语义。

连续运动应共享一条按事件建的 `curve/track` 轨道，不在每个小动作上重新调用一次独立开场。必要的归零与停顿保留。不要把 `cueProgress` 的数学平滑当成惯性、速度或观感已经接好的证据。

## 视觉错位怎么用

为身份、内容、载体/阴影、机位列出各自任务和因果关系；只拆需要单独表达的层。可以由旧内容让位，新对象接入，载体再收尾；也可以保持同一个载体，仅让选中条目展开。当前基线不强制套“人物先飞、页面再飞、卡片最后展开”。

错位可发生在时间、空间和视觉重量上。采用轻微先后、少量局部位移、前后遮挡或短暂阴影即可建立层次；幅度由字号、景别与真实裁片决定。主重点只保留一个；两个大段正文不长时间重叠，姓名、字幕、内容标题不同时争抢第一层。

真实页面不要永远只作为整张平移的图片；需要时拆出身份、被选条目和标题。但拆片必须保持真实文字与来源，不能把定制影片转场说成网站的现成功能。位置从当前布局与裁片读取，不硬套上一条影片的坐标。

## 下一条音频怎么调用

可这样指定本 Skill：

> 使用 motion-video，延续我选定的上一版视觉基线。先核对这段音频的转写与语义，建立命名事件，再按内容关系选少量组合；保持原字体、蓝白和粘土。让同一视觉承接相关句子，保护阅读焦点，按需要重叠准备和收尾。先给连续短预演，分别检查原声与静音衔接；不要扩整片或发布。

工程内先 `npm run check && npm run verify:score`，再按实际影片跑来源、阅读和像素检查。只有用户要求导出才渲染。该调用词不能保证永不出现 PPT 感；必须保留正常速度对照、用户选择和可回退版本。

参考归属与迁移边界见 [Emil 参考](emil-motion-reference.md)，两轮经验见 [复盘](continuity-review-20261027.md)。
