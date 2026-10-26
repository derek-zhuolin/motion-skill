# story.json 契约

由当前Agent依据真实内容填写；示例不是用户事实。运行模板暂支持横屏1600×900、60fps；导出可按1.2倍到1080p。主结构由五种renderer承担，96研究可按需在源码中复用。

## 顶层

- mode：example（显式标注无真人/无音源）、script（真实文稿，未必有声音）、voice（真实声画轴）。
- duration / fps：实际成片时长与帧率；voice模式需与source.actual_duration匹配。
- source：voice_url、video_url（本地assets相对路径）、actual_duration、transcript_verified、source_offset。默认1×且offset=0；先裁片段时另存origin_range，不能仅改offset欺骗同步。
- layout.face：enabled、归一化x/y/w/h、可选object_position。固定裁切不是自动人脸跟踪；无视频时enabled=false。
- pacing：预算参数覆盖，全部记录在编译结果。主标题上限单独计算汉字与英文词，不能混用len统计。

## scenes 每个语义镜头

id / start / end：顺序连续覆盖整条声画轴。一个镜头可以含多句话；微动作不是新场景。
headline：一个短结论。relation：claim / collect / process / compare / cause / evidence / conclusion。
entry_seconds：入场到主体稳定。content_ready_at：最后一批主要信息真正能读的绝对时刻，省略时等于start+entry_seconds。逐步出现内容时务必按最后主要信息更新它。
inspection_seconds：观察关系/证据所需额外预算，可按实测调整。
voice（voice模式必填）：start、end、text；meaning_complete_at是原话意思讲清的绝对时刻，不能比实际讲话更晚或早于本句。必须先核对转写。
visual：renderer为collect / connect / compare / evidence / conclusion；labels为需要读的短标签；focus_object须在object_ids中；token={x,y}为持续焦点的位置；evidence另需asset。
camera：reading_motion=none/subtle/active，reason说明为什么移动；active需人工检查阅读目标是否稳。
handoff：type、reason；shared_entity另需object_id在前后两镜真实保留。visual_verified不能由脚本凭JSON声明直接判真。
emphasis：[{at,word}]为人工/转写核对后的动作抵达绝对落点；预备动作应在此前开始，不是到重音才启动一秒动画，也不是从能量峰值自动推导。
caption：可选短字幕，实际排版要检查与人像、图表的遮挡；模板不是完整逐字字幕编辑器。

## 编译产物

timing包含stable_at、content_ready_at、read_budget_seconds、read_complete_at、protected_until、preparation_at、handoff_at及deficit_seconds。
protected_until取阅读完成、本句原声结束和语义完成的较晚时间，再加落定。preparation只占剩余空间，不能侵占阅读。没空间就警示沿用原焦点；若保护时间超镜头则NEEDS_SIMPLIFY阻塞。
audit.ready_for_visual_review只表示声明与预算无阻塞，视觉/听感验收仍为pending，不等于观众必然读懂。

## 底部同步字幕

voice模式默认要求captions={enabled:true,fps:30,cues:[{id,start_frame,end_frame,text}]}。帧区间左闭右开，不得重叠或超出媒体长度。用核对后的短句；不把主标题当字幕。用户明确不要字幕可设enabled:false。长句、手机阅读和片尾避让仍须实际检查。
