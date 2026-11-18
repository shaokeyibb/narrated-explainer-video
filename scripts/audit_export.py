"""Inspect the delivered MP4. Optional picture-only rolling hold scan requires Pillow."""
import argparse
import collections
import json
import os
from pathlib import Path
import re
import subprocess


def srt_time(value):
    h, m, s, ms = map(int, re.split("[:,]", value))
    if m >= 60 or s >= 60:
        raise ValueError("Invalid SRT time " + value)
    return h * 3600 + m * 60 + s + ms / 1000


def read_subtitles(path, duration):
    cues = []
    pattern = r"(\d{2,}:\d{2}:\d{2},\d{3}) --> (\d{2,}:\d{2}:\d{2},\d{3})"
    content = path.read_text(encoding="utf-8-sig").strip()
    if not content:
        raise ValueError("Empty SRT file")
    for block in re.split(r"\n\s*\n", content):
        lines = block.splitlines()
        m = re.fullmatch(pattern, lines[1]) if len(lines) >= 3 else None
        if not m or not "".join(lines[2:]).strip():
            raise ValueError(f"Unreadable subtitle block: {lines[0]}")
        a, b = (srt_time(v) for v in m.groups())
        if not (0 <= a < b <= duration + .002) or (cues and a < cues[-1][1]):
            raise ValueError(f"Invalid or overlapping subtitle: {a}–{b}")
        cues.append((a, b))
    return cues


def hold_scan(ff, path, bottom, limit, cues):
    from PIL import Image, ImageChops
    # Pictures have the same active area at each timestamp. Ignore the subtitle band.
    step, width, height = .25, 256, 120
    args = [ff, "-v", "error", "-i", str(path), "-an", "-vf",
            f"fps=4,crop=iw:floor(ih*{bottom}/2)*2:0:0,scale={width}:{height},format=gray",
            "-f", "rawvideo", "-pix_fmt", "gray", "-"]
    end_cues = iter((b, cues[i-1][0]) for i, (_, b) in enumerate(cues) if i > 0)
    upcoming = next(end_cues, None)
    count = 0
    window = collections.deque()
    flagged = []
    with subprocess.Popen(args, stdout=subprocess.PIPE) as proc:
        while data := proc.stdout.read(width*height):
            if len(data) != width*height:
                raise ValueError("Incomplete decoded frame")
            t = count * step
            count += 1
            window.append((t, Image.frombytes("L", (width, height), data)))
            while window[0][0] < t-limit:
                window.popleft()
            start = max(0, t-limit)
            two_cues = False
            while upcoming and upcoming[0] <= t:
                start = max(start, upcoming[1])
                two_cues = True
                upcoming = next(end_cues, None)
            if t < limit and not two_cues:
                continue
            frames = [im for sec, im in window if sec >= start-.125]
            if len(frames) < 2:
                continue
            lo = hi = frames[0]
            for im in frames[1:]:
                lo, hi = ImageChops.darker(lo, im), ImageChops.lighter(hi, im)
            changed = sum(ImageChops.difference(hi, lo).histogram()[13:])
            if changed < width*height*.001:
                if flagged and start <= flagged[-1][1]:
                    flagged[-1][1] = t
                else:
                    flagged.append([round(start, 3), t])
        if proc.wait():
            raise RuntimeError("Could not decode the picture series")
    return flagged


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path)
    parser.add_argument("--duration", type=float, required=True, help="Edited narration duration in seconds")
    parser.add_argument("--fps", type=float, required=True, help="Expected constant output frame rate")
    parser.add_argument("--captions", type=Path)
    parser.add_argument("--chapters", type=int)
    parser.add_argument("--pace", action="store_true", help="Report candidate holds for editorial review")
    parser.add_argument("--hold", type=float, default=3)
    parser.add_argument("--diagram-bottom", type=float, default=.82, help="Fraction of image height above captions")
    args = parser.parse_args()
    if not (0 < args.diagram_bottom <= 1 and args.duration > 0 and args.fps > 0 and args.hold >= .5):
        parser.error("Invalid time, frame rate or crop")
    ff, probe = os.environ.get("FFMPEG", "ffmpeg"), os.environ.get("FFPROBE", "ffprobe")
    info = json.loads(subprocess.check_output([probe, "-v", "error", "-show_streams", "-show_chapters", "-of", "json", str(args.video)]))
    video = next(s for s in info["streams"] if s["codec_type"] == "video")
    audio = next(s for s in info["streams"] if s["codec_type"] == "audio")
    raw = subprocess.check_output([probe, "-v", "error", "-select_streams", "v:0", "-show_packets", "-show_entries", "packet=pts_time", "-of", "json", str(args.video)])
    pts = sorted(float(p["pts_time"]) for p in json.loads(raw)["packets"])
    frames = round(args.duration * args.fps)
    if len(pts) != frames or max(abs(t-i/args.fps) for i,t in enumerate(pts)) > max(.001,.05/args.fps):
        raise ValueError("Frame count, origin or cadence differs from the edited clock")
    if abs(float(video["duration"])-args.duration) > 1/args.fps or abs(float(audio["start_time"])) > .010 or abs(float(audio["duration"])-args.duration) > max(.05,1/args.fps):
        raise ValueError("Check stream start times, AAC priming and track lengths")
    if args.chapters is not None and len(info["chapters"]) != args.chapters:
        raise ValueError("Missing or unexpected chapter markers")
    cues = read_subtitles(args.captions, args.duration) if args.captions else []
    subprocess.run([ff, "-v", "error", "-xerror", "-i", str(args.video), "-map", "0:v:0", "-map", "0:a:0", "-f", "null", "-"],check=True)
    report = {"decoded_frames":frames,"size":[video["width"],video["height"]],"audio_channels":audio["channels"],
              "chapters":len(info["chapters"]),"subtitle_cues":len(cues) if args.captions else None}
    if args.pace:
        report["inspect_picture_intervals_seconds"] = hold_scan(ff,args.video,args.diagram_bottom,args.hold,cues)
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
