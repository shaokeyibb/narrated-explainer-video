"""Copy the editable Web starter and a project brief into an empty project directory."""
import argparse
from pathlib import Path
import shutil
import tempfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("destination", type=Path)
parser.add_argument("--with-sound", action="store_true", help="Include the optional licensed sample music and sound effect")
args = parser.parse_args()
destination = args.destination.resolve()
if destination.exists():
    parser.error("Choose a new directory so an existing project is preserved")
assets = Path(__file__).resolve().parents[1] / "assets"
destination.parent.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(dir=destination.parent) as temporary:
    staged = Path(temporary) / "project"
    shutil.copytree(assets / "starter", staged)
    shutil.copy2(assets / "project-brief.json", staged / "project-brief.json")
    shutil.copy2(assets / "storyboard.md", staged / "storyboard.md")
    if args.with_sound:
        shutil.copytree(assets / "sound", staged / "sound")
    staged.rename(destination)
print(destination)
