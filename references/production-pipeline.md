# 从研究到连续影片 · v1.1

先确定同一套视觉规则，再分别处理字体、材质、镜头和声音。交付 `production-manifest.json`，写清 palette / typography / material / motion / sound 的共同约束。默认五类二维结构仍可使用，但不等于已接入研究库。

## 选择与接入

96 项是研究范围，不设每片使用数量。按本片的信息关系筛候选，用真实素材试验，再保留能接成片的机制。`catalog.json` 的 `production_status` 与 `production-registry.json` 区分参考小样和正式 adapter。当前实际组件以 production-registry.json 为准；本次合并新增数字、对照、逐行、素材取景、圈注与焦点交接组件。未登记的其余研究仍是 study_only；需要时先实现源码，不能只填 ID。

工程复制后从 registry 指定的 `src/production/Mechanisms.tsx` 或 `DetailMechanisms.tsx` 导入组件，按本片改写 DirectedFilm。参数是内容、主题和由统一时间轴算出的状态，不是自动导演。`motion.ts` 提供单调三次轨道和摄影机变换；连续段共享切线，有意停留允许归零，不能为刷指标添加无意义漂移。

组合接入按 [motion-combinations.md](motion-combinations.md) 执行：命名语义事件 → 角色轨道 → 少量有因果的机制 → 连续观看。`src/production/score.ts` 提供事件依赖与 cue 进度，示例 JSON 随新工程复制；工具不会自动导入到 DirectedFilm，须在实际影片中调用。修改语义时间先改唯一事件表，再派生所有图层的时间；不要把上一条影片的秒数粘到新音频。

字体保持固定角色与阅读窗口，关键词动作用于引导焦点。粘土使用 SVG 模拟体积，包含厚度、光照渐变、接触影与轻压缩；不是 mesh 3D。真实头像、Logo 保持原貌；有体积的模块需承担接合/归位等具体任务。

## 预演工作台

用同一播放头展示：原始研究 → 真实内容的连续预演。单项研究保持原貌和原始时长，不拉长伪造连贯；明确显示“单项间重置”。新片保留前后镜头，检查进入、变化、离开的全过程。可另提供全幅预演以判断中文阅读。

先做用户批准的短片段；确认前不扩展完整影片。参考小样、内容预演、正式完成片要明确区分。新作品的改造不可写回旧研究，避免失去对照。

## 静态与观看检查

`motion.py audit-production manifest.json --project /absolute/project --out /absolute/new-audit.json` 检查共同规则、adapter 文件与调用、时间区间、对象交接声明。它只证明源码接线，不能证明像素连续。还需在代表帧检查 `data-mechanism`、`data-object`，检查前中后实际画面，再按 1×完整播放。

无说明的长停留给警告，不一律判错；重复帧和速度数据只辅助定位。不要把同一对象 ID、DOM 确定性或构建通过当成观感验收。

检查正在读的对象，不把整台 camera 必须恒定作为通用验收条件。重点检查：是否仍然整张卡片搬家、遮罩是否仅在换两张图、标题是否叠读、后进入的信息是否夺走主焦点。机械上一阶连续也可能反复停车。分层实验不受欢迎时回到已选基线，不继续以增加运动量纠正。

## 音频入口

`new --media /absolute/audio --audio-kind voice|sfx|music` 默认 voice 保持兼容。voice 使用原速与真实转写；sfx/music 必须提供明确 story，不改变文稿时间、不要求伪造转写。其 source.sfx_url / music_url 由模板按同一帧轴播放；音量与落点仍需制作和实际听检。脚本不检测拍点，不自动合成声音或下载依赖。

## 保留参考的组件外观

NumberReel 的 fontFamily、edgeFade、motionBlur、separatorScale、separatorGap 可承接已选片的数字外观；默认渐隐开启、模糊峰值 2.2px、分隔符比例 0.62、两侧间距各 9px。字号和位置由本片传入。不要在抽取组件时丢失这些细节，再将差异称为“新动效”。

修改机制选择、运动路径或阅读时间之前，先记录已选视觉中需要保持的属性。合并检查用同内容同帧对照；它验证本次组件替换，不表示另一条故事已自动重编排，更不保证任何输入都能获得相同观感。
