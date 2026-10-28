# 可选音乐驱动编排

律动来自“预备、动作、落点、阅读”的不同长度，不是让所有对象一起弹跳。先解释这镜要表达什么，再选择少量音乐起音和动作音效作为落点。用户认可原有画面时，只调整相关动作及邻接交接，保留配音、字幕和真实视频时钟。

## 制作顺序

1. 先确定已有配音和事实，再试听音乐结构。需要新配乐时按音源授权调用生成工具；不用空白文件或合成测试音冒充生成结果。
2. 在音源 hash 下记录候选起音及出处：`music-onset`、`voice`、`action` 或 `editorial`。能量突变是候选，不等于强拍。人工选少量有用落点，并保留不动的阅读窗口。
3. 把主动作、分组、相机、遮罩绑到同一份命名事件。相机只导航，动作仍要能表达本段语义。不能用“播放按钮＋待查卡”替代真实任务关系。
4. 音乐、配音、SFX 分轨控制；多个画面版本共享一个音频层，切换不重播双份声音。混音检查清晰度、峰值与片尾，不追求每拍都放音效。
5. 同时间轴对照原版/律动版，检查切换、正反向 seek、进出场边界及原速连续播放。音源或速度改变就使旧落点证据失效；重新映射后再审查。

## Helper

`assets/runtime/src/production/rhythm.ts` 是可选的纯时间函数，不自动安装到旧工程，不改变稳定 adapter 数量。

```ts
import {createRhythmScore, cueProgress, sampleRhythmTrack} from './production/rhythm';
const score = createRhythmScore(8, [
  {id:'start', at:0, source:'editorial'},
  {id:'arrive', at:1.03, source:'music-onset'},
  {id:'read-end', at:3.1, source:'voice'},
  {id:'exit', at:3.62, source:'action'},
], 'sha256-of-the-used-audio');
const t = frame / fps; // Composition clock; do not retime Video/Audio with this track.
const x = sampleRhythmTrack(t, score, [
  {event:'start',value:200}, {event:'arrive',value:600},
  {event:'read-end',value:600}, {event:'exit',value:900},
], 600);
const reveal = cueProgress(t, score, 'start', 'arrive');
```

重复数值代表保持不动，曲线不会在停顿中额外漂移。`sampleRhythmCamera` 返回一次解析的 `{x,y,scale}`，供镜头及世界空间注解共同消费；字幕保留屏幕空间。`enabled:false` 或 `strength:0` 返回提供的基准姿态。时间戳、缺失事件、倒序轨道和非法缩放会报错。它不做自然语言重点识别，不分析音频，也不修改视频入点或速度。

可运行的两内容对照见 [Rhythm Playground](../examples/rhythm-playground/README.md)。它使用原创合成测试节奏，不是 ACE-Step 的效果展示。真实生成流程、首次下载和等待说明应与示例区别阅读，见 [音频说明](../docs/AUDIO.md)。

## 验证边界

`node scripts/test-rhythm.mjs` 验证实际 helper 的确定性、保持段、边界、开关和非法输入，不能证明画面有趣或音乐合拍。所有公开作品仍需要画面/听感人工审查；“已编排”“技术通过”“用户接受”分别记录。
