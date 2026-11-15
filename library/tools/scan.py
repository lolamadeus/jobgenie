# /// script
# requires-python = ">=3.10"
# dependencies = ["pyyaml>=6", "pillow>=10"]
# ///
"""Scan the folders listed in library/config.yaml and write the generated half of the library.

Run from the workspace root:  uv run library/tools/scan.py  [--no-probe]

Writes (generated, safe to overwrite; never hand-edit):
  library/scan/items.json     one row per file of a catalogued kind (path, size, date, dimensions, duration)
  library/scan/folders.json   one row per project folder: counts, date range, examples
  library/scan/meta.json      when the scan ran and what it covered

Audio and video lengths need ffprobe (part of ffmpeg). Without it, the scan still works and those
items just have no duration. Curated facts (which project a folder is, titles, tags) live in
library/projects.yaml and library/curation.yaml, keyed by the stable ids made here.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

import yaml

LIB = Path(__file__).resolve().parents[1]
OUT = LIB / "scan"

BUILTIN = {
    "image": {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".tif", ".tiff", ".psd", ".tga", ".exr", ".svg", ".heic"},
    "video": {".mp4", ".mov", ".mkv", ".avi", ".m4v", ".webm", ".wmv", ".mpg", ".mpeg", ".flv"},
    "audio": {".wav", ".mp3", ".ogg", ".flac", ".aif", ".aiff", ".m4a", ".wma", ".opus"},
    "document": {".pdf", ".docx", ".doc", ".pptx", ".ppt", ".key", ".odt", ".odp", ".pages", ".xlsx", ".md", ".txt", ".rtf"},
    "model": {".fbx", ".obj", ".blend", ".glb", ".gltf", ".ma", ".mb", ".max", ".stl", ".usd", ".usdz", ".ztl", ".c4d", ".3ds"},
}
SKIP_DIRS = {"__pycache__", ".git", "node_modules", "_cache", "cache", "Cache", "CacheClip", "Temp", "temp", "tmp",
             "obj", "Library", "Intermediate", "DerivedDataCache", "Saved", "Build", "Builds", ".gallery", "$RECYCLE.BIN",
             "System Volume Information"}


def sid(path: str) -> str:
    """Stable id from the path (lower-cased), so curation survives rescans."""
    return hashlib.sha1(path.lower().encode("utf-8")).hexdigest()[:12]


def load_config() -> dict:
    p = LIB / "config.yaml"
    cfg = yaml.safe_load(p.read_text(encoding="utf-8")) if p.is_file() else {}
    return cfg or {}


def ext_map(cfg: dict) -> dict:
    """extension -> kind, for the kinds switched on in config.yaml."""
    kinds = {k: set(v) for k, v in BUILTIN.items()}
    for kind, exts in (cfg.get("extensions") or {}).items():
        kinds.setdefault(kind, set()).update(e.lower() if e.startswith(".") else "." + e.lower() for e in exts or [])
    wanted = set(cfg.get("kinds") or BUILTIN) | set((cfg.get("extensions") or {}).keys())
    out = {}
    for kind in kinds:
        if kind in wanted:
            for e in kinds[kind]:
                out.setdefault(e, kind)
    return out


def probe(path: str, ffprobe: str) -> dict:
    try:
        r = subprocess.run(
            [ffprobe, "-v", "error", "-show_entries",
             "format=duration:format_tags=title:stream=codec_type,codec_name,width,height", "-of", "json", path],
            capture_output=True, text=True, timeout=60, encoding="utf-8", errors="replace")
        d = json.loads(r.stdout or "{}")
    except Exception as e:  # unreadable file: record and move on
        return {"probe_error": str(e)[:200]}
    out = {"duration": round(float((d.get("format") or {}).get("duration", 0) or 0), 2)}
    title = ((d.get("format") or {}).get("tags") or {}).get("title")
    if title:
        out["title_tag"] = str(title)[:120]
    for s in d.get("streams", []):
        if s.get("codec_type") == "video" and "width" not in out and s.get("codec_name") not in ("mjpeg", "png"):
            out.update(width=s.get("width"), height=s.get("height"))
        if s.get("codec_type") == "audio":
            out["has_audio"] = True
    return out


def image_size(path: str) -> dict:
    try:
        from PIL import Image
        Image.MAX_IMAGE_PIXELS = None
        with Image.open(path) as im:
            return {"width": im.width, "height": im.height}
    except Exception:
        return {}


def walk(root: dict, exts: dict, skip: set, folders: dict, rows: list):
    base = Path(root["path"])
    if not base.exists():
        print("missing:", base, file=sys.stderr)
        return
    for dirpath, dirnames, filenames in os.walk(base):
        dirnames[:] = [d for d in dirnames if d not in skip and not d.startswith(".")]
        rel = Path(dirpath).relative_to(base)
        project = base.name if root.get("kind") == "flat" else (rel.parts[0] if rel.parts else "_loose")
        key = f"{root['path']}|{project}"
        f = folders.setdefault(key, {
            "id": sid(key), "root": root["path"], "root_label": root.get("label") or base.name, "project": project,
            "path": str(base / project) if project not in ("_loose", base.name) else str(base),
            "files": 0, "counts": {}, "first": None, "last": None, "examples": [],
        })
        for name in filenames:
            ext = os.path.splitext(name)[1].lower()
            kind = exts.get(ext)
            if not kind:
                continue
            p = os.path.join(dirpath, name)
            try:
                st = os.stat(p)
            except OSError:
                continue
            mtime = datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d")
            f["files"] += 1
            f["counts"][kind] = f["counts"].get(kind, 0) + 1
            f["first"] = min(filter(None, [f["first"], mtime]))
            f["last"] = max(filter(None, [f["last"], mtime]))
            if len(f["examples"]) < 6:
                f["examples"].append(name)
            rows.append({"id": sid(p), "path": p, "root": root["path"], "project": project, "folder": f["id"],
                         "rel": str(Path(p).relative_to(base)), "name": name, "ext": ext, "kind": kind,
                         "size": st.st_size, "mtime": mtime})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-probe", action="store_true", help="skip reading durations and image sizes (faster)")
    ap.add_argument("--workers", type=int, default=8)
    args = ap.parse_args()
    cfg = load_config()
    roots = [r if isinstance(r, dict) else {"path": str(r)} for r in (cfg.get("roots") or [])]
    if not roots:
        sys.exit("No folders to scan: add some under `roots:` in library/config.yaml first.")
    exts = ext_map(cfg)
    skip = SKIP_DIRS | set(cfg.get("skip_dirs") or [])
    OUT.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    folders: dict = {}
    rows: list = []
    for root in roots:
        print("scanning", root["path"], flush=True)
        walk(root, exts, skip, folders, rows)
    print(f"walked in {time.time() - t0:.0f}s: {len(folders)} folders, {len(rows)} files", flush=True)

    if not args.no_probe:
        ffprobe = shutil.which("ffprobe")
        if not ffprobe:
            print("ffprobe not found: audio/video lengths will be missing (install ffmpeg to get them)", flush=True)

        def info(r):
            if r["kind"] in ("audio", "video") and ffprobe:
                return probe(r["path"], ffprobe)
            if r["kind"] == "image":
                return image_size(r["path"])
            return {}
        done = 0
        with ThreadPoolExecutor(args.workers) as ex:
            for row, extra in zip(rows, ex.map(info, rows)):
                row.update(extra)
                done += 1
                if done % 500 == 0:
                    print(f"read {done}/{len(rows)}", flush=True)

    # size filters from config
    min_a, min_v = float(cfg.get("min_audio_seconds") or 0), float(cfg.get("min_video_seconds") or 0)
    min_px = int(cfg.get("min_image_px") or 0)

    def keep(r):
        if r["kind"] == "audio" and min_a and r.get("duration") is not None and r["duration"] < min_a:
            return False
        if r["kind"] == "video" and min_v and r.get("duration") is not None and r["duration"] < min_v:
            return False
        if r["kind"] == "image" and min_px and r.get("width") and max(r["width"], r["height"]) < min_px:
            return False
        return True
    kept = [r for r in rows if keep(r)]

    (OUT / "folders.json").write_text(json.dumps(sorted(folders.values(), key=lambda x: (x["root"], x["project"].lower())),
                                                 ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT / "items.json").write_text(json.dumps(kept, ensure_ascii=False, indent=0), encoding="utf-8")
    (OUT / "meta.json").write_text(json.dumps({"scanned": datetime.now().isoformat(timespec="seconds"), "roots": roots,
                                               "files_seen": len(rows), "files_kept": len(kept),
                                               "seconds": round(time.time() - t0)}, indent=1), encoding="utf-8")
    print(f"done in {time.time() - t0:.0f}s: kept {len(kept)} of {len(rows)} files. Next: thumbs.py, then build.py", flush=True)


if __name__ == "__main__":
    main()
