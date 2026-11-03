# 产品 UI · Stageshow 正式接入

## 自动入口

在已调用 Motion 的任务中，出现产品界面、操作路径、表单、列表/表格、拖拽、通知、对话、图表或设备时，Agent 自动选用本分支，不要求用户再说 Stageshow。用户可直接说“用 Motion 做产品演示”。Agent 在镜头清单说明采用的部件、原例、动作意义与阅读窗口。

保留本片已有字体、品牌、材质、IP和其他机制。UI 可在粘土载体、真实屏幕、文字或空间关系之间交接；具体产品的真实身份优先。此分支不把所有影片变成通用灰色窗口，也不替代非UI表达。

## 参考文件与真实部件

- 本地源码：`assets/runtime/vendor/stageshow/`，包含kit、examples、references、许可、资产声明和SOURCE.json文件指纹。不依赖项目外的个人安装路径。
- 选例：读 [UI索引](stageshow-index.json)，再读最接近Gold的源码与原始预览；不要靠名字重画。
- 首次制作UI时读 vendored `references/craft.md`；构图读 `framing.md`，运动读 `motion.md`。按场景再读Phone/图表/消息的部件说明。
- 使用 `Window` / `Phone` / `Row` / `Field` / `Badge` / `Check` / `Cursor` 等真实部件；真实Logo和资产仍按原来源/许可。保留NOTICE.md的第三方资产边界。
- Gold部件不是统一产品皮肤；把本片品牌tokens、真实内容和产品特征接进去。

### 源码快照的运行边界

随包保存的是 kit、examples、references、assets 与来源/许可，未带上游独立 npm 工程、playground 或 film 脚本。vendored README/SKILL 是保留的上游原文，其中的 `npm run dev`、`scripts/film.mjs` 不能直接在这个快照目录执行。Motion 影片按下方 frame 接口接入；原例用现有本地 Gold Playground 预览，缺预览工具时用已兼容本机依赖另建隔离预览并准确报告，不静默运行上游安装命令。此边界优先于上游示例中的环境搭建步骤。

## 影片接线

新建项目随runtime复制UI kit和适配器；旧片/继承工程使用 `python3 scripts/install_product_ui.py --project /absolute/project --check` 检查，缺文件时可在已授权本地返修内用 `--apply` 只补缺失文件。遇到冲突不覆盖，按报告处理。依赖：现有React/ReactDOM，测试过的 `lucide-react@1.61.0`；模板已声明。new/reuse 在创建工程前校验 React、ReactDOM 与 Lucide 的兼容版本，缺失则明确报错、不创建半成品。缺依赖先找本机可用安装或准确报告，不静默下载。

```tsx
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {ProductUIFilm} from './production/ProductUIFilm';

export function ProductScene() {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <ProductUIFilm frame={frame} fps={fps}
    story={{title:'本片实际计划名',tasks:['任务一','任务二','任务三'],audience:'团队空间',result:'已分享给团队'}} />;
}
```

这条可复用流覆盖创建→三项任务重排→分享，适合对应语义。任务数量及内容长度按接口验证；其他故事组合原部件/另写关系适配，不把本流硬套到所有产品。`product-ui.ts`提供节奏配置与状态函数，组件支持accent/fontFamily继承本片。

独立登记在production-registry的`ui_extensions`，保留原10个研究adapter和编号。`audit-production`同时识别此UI扩展并核对真实import/JSX调用，study_id记null，不冒用研究编号。开放编排可用custom candidate注明本UI扩展，不伪造新的96项研究ID。

网页Gold的Act/等待/CSS动画可用于本地参考播放；进入Motion影片需适配为frame驱动。此版本除上述任务流外，还正式适配滑动归档、手机卡片展开、对话选项卡、自由拖拽、文件上传、多人协作、图表逐点查看、对象入列后更新合计八组，API见 [音频到界面表达](ui-narrative.md)。其他未列出的原例保持“原生可预览、影片待适配”。可暂停/定位不等于已通过Remotion导出测试；实际导出后另检查。

## 设计与动作规则

1. 先确定最终尺寸、主对象与动作结果；窗口在画面占够比例，按语义裁切，关键操作/结果不得被切掉。窄屏按需要重新构图，不只把桌面缩小。
2. 标题、输入、正在操作项、结果用真实文案；周边占位保留产品结构但降低信息噪声。文字通常3–7条是起点，真实表格/文档按场景调整，不把规则当硬配额。
3. 提示行和按钮状态预留位置；输入/编辑前后文字保持对齐，外壳改尺寸时不拉伸文字。
4. 动作有原因：抓取→跟随→邻行让位→落定；输入→校验→修正→完成；单元格提交→依赖合计随后更新；骨架→原位真实数据；按钮发送→原位完成。光标接实际目标几何，不能指错或用完成勾替代过程。
5. 对象尽量持续，依赖组错峰进入；允许配角提前准备、动作重叠，结果保留阅读时间。
6. 用户偏好较紧节奏：先削无意义等待、缩短悬空移动，在抬升/落下/展开处用小幅、快速停稳的回弹。不要随机漂移，不逐镜整屏弹跳，不牺牲读数，也不统一加速旁白。
7. 对比同内容/同状态看进入、中间、落定，原速看完整路径；检查光标/对象同步、弹层边界、文字切换与循环原因。用户接受、技术接线、像素检查和导出验证分开记录。

## 以后如何调用

“用Motion做15秒产品演示，展示创建、排序、分享，保留品牌材质”已足够，Agent自动选UI部件。需要更具体可说“偏真实产品界面”“卡片展开成整屏”“滑动归档有惯性”“节奏紧一点，结果看得清”。参考规则按需读取，不要求用户记组件名或手动调全部参数。

## 八组动作的直接入口

使用 `UISwipeArchive` / `UIPhoneExpand` / `UIConversationCards` / `UIFreeDrag` / `UIUpload` / `UIPresence` / `UIChartScrub` / `UIAggregate`，共同参数为 `frame, fps, duration, accent, fontFamily, content`。内容需显式提供，参数限制由组件验证。八组均可前后定位，动作没有独立浏览器动画时钟。八组均已完成真实 Remotion 代表帧渲染；本地总览另完成 38 张代表帧验证。整片仍需检查过渡、阅读和声音。

## 总览与调用边界

[component-catalog.json](component-catalog.json) 是完整可见入口清单，保留原有10个核心 adapter、10个原有扩展和本层9个 UI frame 组件（含 `ProductUIFilm`），另列33种可组合 UI 部件和33种 Icon；光标另列。UI 部件可以直接参与构图，其网页动画行为须由影片时间接管。原例、Gold和96项研究不计入生产 frame 组件。目录展示“如何调用”和真实导入位置，不等同于每种组合均通过完整影片验收。
