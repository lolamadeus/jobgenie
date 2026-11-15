# /// script
# requires-python = ">=3.10"
# dependencies = ["pillow>=10", "pypdfium2>=4"]
# ///
"""Make preview images for the library (library/thumbs/<id>.jpg).

    uv run library/tools/thumbs.py              # everything missing a preview
    uv run library/tools/thumbs.py --sheets TEXT [--per 12]
        # also tile previews whose path contains TEXT into contact sheets (library/thumbs/sheets/),
        # which is the quick way for an agent to look at a lot of work at once and identify it

- Images: a downscaled copy (Pillow; most formats incl. PSD composites).
- Videos: a 4-frame strip taken at 15/40/65/90% of the clip (needs ffmpeg; hover-scrub in the app).
- PDFs: the first page.
Safe to re-run; only missing previews are made. Run build.py afterwards so the app knows about them.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

LIB = Path(__file__).resolve().parents[1]
THUMBS = LIB / "thumbs"
W, H = 240, 135          # one video frame
IMG = 520                # longest edge for image and PDF previews
FFMPEG = shutil.which("ffmpeg")


def image_thumb(row: dict, out: Path) -> str | None:
    from PIL import Image
    Image.MAX_IMAGE_PIXELS = None
    with Image.open(row["path"]) as im:
        im.thumbnail((IMG, IMG))
        im.convert("RGB").save(out, "JPEG", quality=82)
    return None


def pdf_thumb(row: dict, out: Path) -> str | None:
    import pypdfium2 as pdfium
    pdf = pdfium.PdfDocument(row["path"])
    try:
        page = pdf[0]
        scale = IMG / max(page.get_size())
        img = page.render(scale=scale).to_pil()
        img.convert("RGB").save(out, "JPEG", quality=82)
    finally:
        pdf.close()
    return None


def video_strip(row: dict, out: Path) -> str | None:
    if not FFMPEG:
        return "ffmpeg not installed"
    dur = float(row.get("duration") or 0)
    if dur <= 0 or not row.get("width"):
        return "no video stream"
    inputs, filters = [], []
    for i, frac in enumerate((0.15, 0.40, 0.65, 0.90)):
        inputs += ["-ss", f"{dur * frac:.2f}", "-i", row["path"]]
        filters.append(f"[{i}:v:0]scale={W}:{H}:force_original_aspect_ratio=decrease,"
                       f"pad={W}:{H}:-1:-1,setsar=1[v{i}]")
    fc = ";".join(filters) + ";" + "".join(f"[v{i}]" for i in range(4)) + "hstack=inputs=4[out]"
    r = subprocess.run([FFMPEG, "-v", "error", "-y", *inputs, "-filter_complex", fc, "-map", "[out]",
                        "-frames:v", "1", "-q:v", "5", str(out)], capture_output=True, timeout=180)
    return None if r.returncode == 0 else r.stderr.decode(errors="replace")[-200:]


def make(row: dict) -> str | None:
    out = THUMBS / f"{row['id']}.jpg"
    if out.exists() and out.stat().st_size > 0:
        return None
    try:
        if row["kind"] == "image":
            return image_thumb(row, out)
        if row["kind"] == "video":
            return video_strip(row, out)
        if row["ext"] == ".pdf":
            return pdf_thumb(row, out)
    except Exception as e:  # unreadable or unsupported file: no preview, move on
        out.unlink(missing_ok=True)
        return f"{type(e).__name__}: {e}"[:200]
    return None


def wanted(row: dict) -> bool:
    return row["kind"] in ("image", "video") or row["ext"] == ".pdf"


def sheets(rows: list, match: str, per: int):
    from PIL import Image, ImageDraw
    sel = [r for r in rows if match.lower() in r["path"].lower() and (THUMBS / f"{r['id']}.jpg").exists()]
    outdir = THUMBS / "sheets"
    outdir.mkdir(parents=True, exist_ok=True)
    slug = "".join(c if c.isalnum() else "_" for c in match).strip("_") or "all"
    made = []
    cols, cw, ch = 3, 4 * W // 2, IMG // 2 + 24
    for n in range(0, len(sel), per):
        chunk = sel[n:n + per]
        rows_n = (len(chunk) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * cw, rows_n * ch), "black")
        draw = ImageDraw.Draw(sheet)
        for i, r in enumerate(chunk):
            with Image.open(THUMBS / f"{r['id']}.jpg") as im:
                im.thumbnail((cw - 8, ch - 28))
                x, y = (i % cols) * cw, (i // cols) * ch
                sheet.paste(im.convert("RGB"), (x + 4, y + 24))
                draw.text((x + 6, y + 5), f"{n + i + 1}. {r['rel']}"[:70], fill="white")
        out = outdir / f"{slug}_{n // per + 1:03d}.jpg"
        sheet.save(out, "JPEG", quality=80)
        made.append({"sheet": str(out), "items": [(n + i + 1, r["id"], r["rel"]) for i, r in enumerate(chunk)]})
    (outdir / f"{slug}_index.json").write_text(json.dumps(made, indent=1), encoding="utf-8")
    print(f"{len(made)} sheets for {len(sel)} items -> {outdir}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sheets", default=None, help="make contact sheets for items whose path contains this text")
    ap.add_argument("--per", type=int, default=12)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--only", default=None, help="only items whose path contains this text")
    args = ap.parse_args()
    THUMBS.mkdir(parents=True, exist_ok=True)
    rows = json.loads((LIB / "scan" / "items.json").read_text(encoding="utf-8"))
    if args.sheets is not None:
        return sheets(rows, args.sheets, args.per)
    if not FFMPEG and any(r["kind"] == "video" for r in rows):
        print("ffmpeg not found: videos get no preview strip (install ffmpeg to add them)", flush=True)
    todo = [r for r in rows if wanted(r) and not (THUMBS / f"{r['id']}.jpg").exists()
            and (not args.only or args.only.lower() in r["path"].lower())]
    print(f"{len(todo)} previews to make", flush=True)
    fails = 0
    with ThreadPoolExecutor(args.workers) as ex:
        for i, err in enumerate(ex.map(make, todo), 1):
            fails += bool(err)
            if i % 200 == 0:
                print(f"{i}/{len(todo)} ({fails} without a preview)", flush=True)
    print(f"done; {fails} without a preview. Next: uv run library/tools/build.py", flush=True)


if __name__ == "__main__":
    main()
