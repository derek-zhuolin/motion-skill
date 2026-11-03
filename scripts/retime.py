"""One source clock -> 1.1x delivery clock, without changing reading heuristics."""
import copy
import math

SPEED = 1.1


def retime_story(story, source_duration):
    if story.get('timeline_timebase') == 'delivery':
        raise ValueError('Timeline already retimed; refusing a second speed conversion')
    if not math.isfinite(source_duration) or source_duration <= 0:
        raise ValueError('Invalid source duration')
    if abs(float(story['duration']) - source_duration) > .05:
        raise ValueError('Story must cover the original source duration')
    out = copy.deepcopy(story)
    out.update(audio_speed=SPEED, timeline_timebase='delivery', duration=source_duration / SPEED)
    for scene in out.get('scenes', []):
        for key in ('start', 'end', 'content_ready_at', 'meaning_complete_at', 'entry_seconds'):
            if key in scene:
                scene[key] /= SPEED
        for key in ('start', 'end'):
            if key in scene.get('voice', {}):
                scene['voice'][key] /= SPEED
        for mark in scene.get('emphasis', []):
            mark['at'] /= SPEED
    out.setdefault('source', {}).update(original_duration=source_duration,
        actual_duration=source_duration / SPEED, prepared_speed=SPEED)
    return out


def retime_transcript(data):
    if not isinstance(data, dict) or data.get('timebase') == 'delivery':
        raise ValueError('Expected source-time JSON transcript, not an already retimed transcript')
    if not isinstance(data.get('segments'), list) or not data['segments']:
        raise ValueError('Transcript needs nonempty segments with start/end in seconds')
    out = copy.deepcopy(data)
    def convert(rows):
        for row in rows:
            for key in ('start', 'end'):
                value = row.get(key)
                if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
                    raise ValueError('Transcript start/end must be finite seconds')
                row[key] = value / SPEED
            if row['end'] < row['start']:
                raise ValueError('Invalid transcript range')
            if 'words' in row:
                convert(row['words'])
    convert(out['segments'])
    out.update(timebase='delivery', playback_speed=SPEED)
    return out
