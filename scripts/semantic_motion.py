"""Bounded motion choices from Agent-reviewed meaning; no models/network/media inference."""
from pathlib import Path
import json, math
ROOT=Path(__file__).resolve().parents[1]
KINDS={'number_snapshot','number_change','number_comparison','keyword','real_media','join','conclusion'}
RULES={
 'number_snapshot':['number-reel','value-reveal'],
 'number_change':['numeric-comparison'],
 'number_comparison':['numeric-comparison'],
 'keyword':['line-reveal','keyword-rhythm'],
 'real_media':['media-focus'],
 'join':['clay-join'],
 'conclusion':['line-reveal','keyword-rhythm'],
}
# Choice ordering expresses suitability. Recent use only breaks ties among suitable choices.
def recommend(plan):
    registry=json.loads((ROOT/'references/production-registry.json').read_text())
    adapters={x['id']:x for x in registry['adapters']}
    blockers=[]; warnings=[]; results=[]; recent=list(plan.get('recent_mechanisms',[]))[-4:]
    seen=set(); duration=plan.get('duration'); shots=plan.get('shots',[])
    if not isinstance(duration,(float,int)) or not math.isfinite(duration) or duration<=0:
        raise ValueError('duration must be finite and positive')
    if not shots: blockers.append('EMPTY_SHOT_PLAN')
    for index,s in enumerate(shots):
        sid=s.get('id',f'shot-{index+1}'); kind=s.get('kind'); prefix=sid+': '
        if sid in seen:blockers.append(prefix+'DUPLICATE_ID')
        seen.add(sid)
        def fail(code): blockers.append(prefix+code)
        start,end=s.get('start'),s.get('end')
        valid_time=all(isinstance(x,(int,float)) and math.isfinite(x) for x in [start,end]) and 0<=start<end<=duration
        if not valid_time:fail('INVALID_TIME')
        if kind not in KINDS:fail('UNKNOWN_CONTENT_KIND');continue
        if not s.get('meaning') or not s.get('purpose'):fail('MEANING_AND_PURPOSE_REQUIRED')
        if not s.get('focus_object'):fail('FOCUS_OBJECT_REQUIRED')
        reading=s.get('reading',{})
        times=[reading.get(k) for k in ['ready_at','until','min_seconds']]
        if not valid_time or not all(isinstance(x,(int,float)) and math.isfinite(x) for x in times):fail('READ_WINDOW_REQUIRED')
        elif not(start<=times[0]<=times[1]<=end and times[2]>0 and times[1]-times[0]+1e-9>=times[2]):fail('READ_WINDOW_TOO_SHORT')
        if not reading.get('basis'):fail('READ_BUDGET_BASIS_REQUIRED')
        candidates=list(RULES[kind]); notes=[]; supports=[]; options={}
        if kind.startswith('number_'):
            data=s.get('number',{})
            if not data.get('source'):fail('NUMBER_SOURCE_REQUIRED')
            if kind=='number_snapshot':
                if not isinstance(data.get('display'),str) or not data['display']:fail('NUMBER_DISPLAY_REQUIRED')
                if not data.get('observed_at'):fail('SNAPSHOT_TIME_REQUIRED')
                notes.append('数字是快照入场，不能把滚动过程描述成真实增长。')
                if data.get('animate_growth'):fail('SNAPSHOT_CANNOT_IMPLY_GROWTH')
            else:
                values=data.get('observations',[])
                if len(values)!=2 or any(not isinstance(v.get('value'),(float,int)) or isinstance(v.get('value'),bool) or not math.isfinite(v['value']) or not v.get('label') or not v.get('source') for v in values):fail('TWO_VERIFIED_OBSERVATIONS_REQUIRED')
                if data.get('compatible_units') is not True:fail('COMPARISON_UNITS_UNCONFIRMED')
                if kind=='number_change' and any(not v.get('observed_at') for v in values):fail('CHANGE_REQUIRES_TWO_TIMES')
                notes.append('两组数值同屏保留；未给出的增长、差额和因果不推算。')
        if kind=='keyword' and s.get('intent')=='reveal_media':
            candidates=['keyword-window','line-reveal'];notes.append('文字作为真实内容入口，需核对遮罩内素材。')
        elif kind=='keyword' and s.get('intent')=='hierarchy':candidates=['keyword-rhythm','line-reveal']
        elif kind=='keyword' and s.get('intent')=='claim':candidates=['line-reveal','keyword-rhythm']
        if kind=='real_media' or s.get('intent')=='reveal_media':
            media=s.get('media',{})
            if media.get('inspected') is not True or not media.get('source') or not media.get('rights'):fail('MEDIA_INSPECTION_SOURCE_RIGHTS_REQUIRED')
            role=media.get('role')
            if role not in ['evidence','context','explanation']:fail('MEDIA_ROLE_REQUIRED')
            moving=media.get('has_subject_motion') is True
            options['camera']='hold' if moving else 'focus'
            if role=='evidence':
                target=media.get('target')
                if not isinstance(target,list) or len(target)!=4 or not all(isinstance(x,(int,float)) and math.isfinite(x) for x in target) or not(0<=target[0]<target[2]<=1 and 0<=target[1]<target[3]<=1):fail('EVIDENCE_TARGET_REQUIRED')
                supports=['draw-annotation'];notes.append('标记原素材证据位置，作者、时间与限制留在可读范围内。')
            if moving:notes.append('主体已经在运动，默认固定取景；不要叠加无意义漂移。')
        if kind=='join' and len(s.get('participants',[]))<2:fail('JOIN_REQUIRES_REAL_PARTICIPANTS')
        # No seed/random choice. Meaning-specific choices win; avoid adjacent repeat only when both fit.
        scored=sorted(enumerate(candidates),key=lambda it:(int(it[1]==(recent[-1] if recent else None))*3+int(bool(recent) and adapters.get(recent[-1],{}).get('study_id')==adapters[it[1]]['study_id'])*2+recent.count(it[1])*.25+it[0],it[0]))
        chosen=scored[0][1]
        forced=s.get('preferred_adapter')
        if forced:
            if forced not in candidates:fail('PREFERRED_ADAPTER_NOT_SUITABLE')
            else:chosen=forced;notes.append('采用显式选定的适配方案。')
        alternatives=[x for x in candidates if x!=chosen]
        handoff=s.get('handoff')
        if index<len(shots)-1:
            if not handoff or not handoff.get('reason') or handoff.get('to')!=shots[index+1].get('id'):fail('HANDOFF_TO_NEXT_REQUIRED')
            elif handoff.get('kind') in ['focus','match','expand']:
                obj=handoff.get('object_id'); nxt=shots[index+1]
                if not obj or obj not in s.get('object_ids',[]) or obj not in nxt.get('object_ids',[]):fail('HANDOFF_OBJECT_LOST')
                if handoff.get('kind') in ['focus','match']:supports.append('focus-handoff')
            elif handoff.get('kind') not in ['contrast','cut']:fail('UNKNOWN_HANDOFF')
            if valid_time and isinstance(handoff,dict) and isinstance(handoff.get('at'),(int,float)):
                if not start<=handoff['at']<=end:fail('HANDOFF_OUTSIDE_SHOT')
                read_until=reading.get('until')
                if isinstance(read_until,(int,float)) and handoff['at']<read_until:fail('EXIT_BEFORE_READING_COMPLETE')
            else:fail('HANDOFF_TIME_REQUIRED')
        if results and valid_time and isinstance(results[-1]['end'],(int,float)):
            if start>results[-1]['end']:fail('UNCOVERED_TIMELINE')
            if start<results[-1]['start'] or end<results[-1]['end']:fail('UNORDERED_SHOTS')
        if index==0 and valid_time and start!=0:fail('UNCOVERED_OPENING')
        if index==len(shots)-1 and valid_time and end!=duration:fail('UNCOVERED_ENDING')
        rationale=s.get('purpose','')+'；'+('避免相邻镜头重复同一种主动作。' if recent and chosen!=candidates[0] else '优先匹配本段的信息关系。')
        result={'id':sid,'start':start,'end':end,'meaning':s.get('meaning'),'primary':chosen,'study_id':adapters[chosen]['study_id'],'export':adapters[chosen]['export'],'implementation':adapters[chosen]['file'],'supports':list(dict.fromkeys(supports)),'options':options,'alternatives':alternatives,'reason':rationale,'focus_object':s.get('focus_object'),'reading':reading,'handoff':handoff,'notes':notes,'state':'planned_not_wired'}
        results.append(result);recent.append(chosen);recent=recent[-4:]
    return {'version':1,'status':'blocked' if blockers else 'ready_for_implementation','shots':results,'blocking':blockers,'warnings':warnings,'scope':'Agent interprets the content first. Deterministic candidate ranking only; not ASR, image recognition, code generation, wiring proof or visual acceptance.','model_calls':0,'human_visual_acceptance':'pending'}

def summarize(result):
    registry=json.loads((ROOT/'references/production-registry.json').read_text())
    numbered={a['id']:f"#{a['study_id']} {a['id']}" for a in registry['adapters']}
    lines=['# 开工前镜头编排清单','',f"状态：{result['status']}（计划，不代表已接入）",'', '| 镜头 / 时间 | 表达与主焦点 | 主效果 | 辅助与转场 | 为什么 / 阅读窗口 |','| --- | --- | --- | --- | --- |']
    for s in result['shots']:
        h=s['handoff'] or {};r=s['reading'];safe=lambda x:str(x).replace('|','／').replace('\n',' ')
        lines.append('| '+' | '.join(map(safe,[f"{s['id']} · {s['start']}–{s['end']}s",f"{s['meaning']} / {s['focus_object']}",f"#{s['study_id']} {s['primary']}",', '.join(numbered[x] for x in s['supports'])+'；'+h.get('kind','收尾')+'：'+h.get('reason','停住供人理解'),s['reason']+f"；{r.get('ready_at')}–{r.get('until')}s"]))+' |')
    used={s['primary'] for s in result['shots']}|{x for s in result['shots'] for x in s['supports']}
    ids=sorted({a['study_id'] for a in registry['adapters'] if a['id'] in used})
    lines+=['',f"计划涉及研究编号（含辅助）：{', '.join('#'+str(x) for x in ids)}。数量由内容决定，不设配额。",'','实施后必须另行记录 actual-used 清单、源码调用及关键帧；不能用本表证明已用。']
    if result['blocking']:lines+=['','需先修正：']+['- '+x for x in result['blocking']]
    return '\n'.join(lines)+'\n'
