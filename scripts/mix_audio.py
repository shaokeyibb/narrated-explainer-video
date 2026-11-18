"""Loop a measured music phrase under a finished narration and place physical sound cues."""
import argparse
import json
import math
import os
from pathlib import Path
import subprocess
import tempfile


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("voice", type=Path)
    p.add_argument("music", type=Path)
    p.add_argument("output", type=Path, help="Output AAC in an .m4a container")
    p.add_argument("--loop-in", type=float, required=True)
    p.add_argument("--loop-seconds", type=float, required=True, help="Duration of whole bars at source tempo")
    p.add_argument("--music-db", type=float, default=-16)
    p.add_argument("--fx", nargs=2, action="append", default=[], metavar=("FILE", "EDITED_SECOND"))
    p.add_argument("--credit", required=True, help="Attribution for the actual music and edits")
    a = p.parse_args()
    ff, probe = os.environ.get("FFMPEG", "ffmpeg"), os.environ.get("FFPROBE", "ffprobe")

    def duration(path):
        raw = subprocess.check_output([probe, "-v", "error", "-select_streams", "a:0", "-show_streams", "-show_format", "-of", "json", str(path)])
        obj = json.loads(raw)
        return float(obj["streams"][0].get("duration", obj["format"]["duration"]))

    n, music_length = duration(a.voice), duration(a.music)
    if not (0 <= a.loop_in < music_length and 0 < a.loop_seconds <= music_length-a.loop_in and math.isfinite(a.music_db)):
        p.error("Choose a finite gain and a loop inside the music recording")
    if a.output.suffix.lower() != ".m4a" or a.output.resolve() in {a.voice.resolve(), a.music.resolve()}:
        p.error("Choose a separate .m4a output")
    count = round(a.loop_seconds * 48000)
    tail = min(2, n/3)
    args = [ff, "-v", "error", "-y", "-i", str(a.voice), "-i", str(a.music)]
    filters = ["[0:a]asplit=2[v][key]",
               f"[1:a]aresample=48000,atrim=start={a.loop_in},asetpts=PTS-STARTPTS,atrim=end_sample={count},"
               f"aloop=loop=-1:size={count},atrim=duration={n},highpass=f=55,equalizer=f=2200:t=o:w=1.5:g=-3,"
               f"volume={a.music_db}dB,afade=t=in:d={min(.8,tail)},afade=t=out:st={n-tail}:d={tail}[m]",
               "[m][key]sidechaincompress=threshold=0.039:ratio=2:attack=55:release=360[b]"]
    stems = ["[v]", "[b]"]
    for i, (filename, value) in enumerate(a.fx, 2):
        sec = float(value)
        if not 0 <= sec < n or Path(filename).resolve() == a.output.resolve():
            p.error("Invalid FX location or output")
        args.extend(["-i", filename])
        filters.append(f"[{i}:a]atrim=duration=0.2,asetpts=PTS-STARTPTS,lowpass=f=1800,volume=-24dB,"
                       f"afade=t=in:d=0.015,afade=t=out:st=0.08:d=0.12,adelay={round(sec*1000)}:all=1[fx{i}]")
        stems.append(f"[fx{i}]")
    filters.append("".join(stems)+f"amix=inputs={len(stems)}:duration=first:normalize=0,alimiter=limit=0.91:latency=1:level=0[out]")
    a.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=a.output.parent) as tmp:
        part = Path(tmp)/"mix.m4a"
        destination = part if a.output.is_absolute() else os.path.relpath(part)
        subprocess.run(args+["-filter_complex",";".join(filters),"-map","[out]","-c:a","aac","-b:a","192k","-ar","48000","-ac","2","-metadata","comment="+a.credit,str(destination)],check=True)
        part.replace(a.output)


if __name__ == "__main__":
    main()
