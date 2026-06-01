from pathlib import Path
import sys

from PIL import Image
from pypdf import PdfReader


def main() -> int:
    if len(sys.argv) != 3:
        print("Usage: extract_tbf_pages.py <pdf-path> <output-dir>")
        return 2

    pdf_path = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)

    reader = PdfReader(str(pdf_path))
    total = len(reader.pages)
    print(f"pages={total}")

    for index, page in enumerate(reader.pages, start=1):
        if not page.images:
            continue

        image = page.images[0].image.convert("RGB")
        if image.width > image.height:
            image = image.rotate(90, expand=True)

        image.thumbnail((1500, 2100), Image.Resampling.LANCZOS)
        image.save(out_dir / f"page_{index:03d}.jpg", quality=88, optimize=True)

        if index % 25 == 0:
            print(f"extracted={index}/{total}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
