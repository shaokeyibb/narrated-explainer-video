"""Map source-word onsets into edited seconds. Input schema: references/starter.md."""
import argparse
import json
import math
from pathlib import Path


def remap(plan):
    fps = plan["fps"]
    if not isinstance(fps, (float, int)) or not math.isfinite(fps) or fps <= 0:
        raise ValueError("fps must be positive")
    cursor = 0
    spans = []
    for clip in plan["clips"]:
        frames = clip["frames"]
        if type(frames) is not int or frames < 1:
            raise ValueError("Each clip needs a positive integer output frame count")
        if "source" in clip:
            a, b = clip["in"], clip["out"]
            if not (math.isfinite(a) and math.isfinite(b) and 0 <= a < b):
                raise ValueError("Invalid source interval")
            spans.append((clip["source"], a, b, cursor, frames))
        cursor += frames  # Includes deliberately inserted silence.
    cues, ids = [], set()
    for cue in plan["cues"]:
        name = cue["id"]
        if name in ids:
            raise ValueError(f"Duplicate cue ID: {name}")
        ids.add(name)
        source_time = cue["time"]
        matches = []
        for source, a, b, start, frames in spans:
            if source == cue["source"] and a <= source_time < b:
                exact = start + (source_time-a)/(b-a)*frames
                first_frame = math.ceil(exact-1e-9)
                if first_frame >= start + frames:
                    raise ValueError(f"{name}: onset is after the clip's final displayable frame; review the cut")
                matches.append({"seconds": exact/fps, "first_frame": first_frame})
        if not matches:
            raise ValueError(f"{name}: source onset is outside all retained intervals; review the recording")
        # A deliberate replay maps the word more than once. Keep all occurrences.
        cues.append({"id": name, "occurrences": matches})
    return {"fps": fps, "frames": cursor, "duration": cursor/fps, "cues": cues}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("plan", type=Path)
    args = parser.parse_args()
    print(json.dumps(remap(json.loads(args.plan.read_text(encoding="utf-8-sig"))), ensure_ascii=False, indent=2))
