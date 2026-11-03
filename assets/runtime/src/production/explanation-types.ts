export type ContentPart={id:string;text:string;content_id?:string;cue_ids?:string[]};
export type ContentView={
 kind:'document'|'flow'|'spatial'|'media';title:string;segments:ContentPart[];
 media?:{asset_id:string;start_seconds?:number;fit?:'contain'|'cover'};
 camera_mode?:'follow'|'overview'|'part-relay';screen_state?:string|null;
 initial_state?:string;initial_expanded?:boolean;
 emphasis?:{part_id:string;cue_ids:string[]}[];
};
export type ContentObject=ContentView&{owner:string;views?:Record<string,ContentView>};
export type ExplanationEvent={
 id:string;relation:'split'|'filter'|'feedback'|'spatial'|'show';object_id:string;
 view?:string;scene_id?:string;headline?:string;
 transition?:{duration?:number;scale_from?:number;offset_x?:number;offset_y?:number};
 cue_ids:string[];meaning:string;before:string;after:string;
 start:number;end:number;start_frame:number;end_frame:number;
 action_window:[number,number];readable_window:[number,number];
 selected_ids?:string[];asset_range?:[number,number];
 handoff_from:string|null;owner:string;component:string;uses:string[];
};
export type ExplanationScene={id:string;view:string;object_id:string;start:number;end:number;event_ids:string[]};
export type SpatialFrame={file:string;parts:{id:string;x:number;y:number;visible:boolean}[]};
export type SpatialAsset={representation:'rendered-mesh-3d';width:number;height:number;frames:SpatialFrame[];geometry:string;engine:string};
export type MediaAsset={type:'image'|'video';url:string;subject:string;caption:string;source_note:string;role:'evidence'|'context'|'explanation';reality:'recorded'|'reconstructed'|'generated'};
export type ExplanationPlan={
 schema:string;title:string;task:string;source_note:string;fps:number;duration:number;duration_in_frames:number;
 objects:Record<string,ContentObject>;events:ExplanationEvent[];scenes?:ExplanationScene[];
 anchors:{cues:{id:string;start:number;end:number;text:string}[]};
 audio:{url?:string;playback_rate:number;envelope?:number[]};
 theme:{blue:string;ink:string;paper:string;green:string};spatial?:SpatialAsset;media?:Record<string,MediaAsset>;
};
