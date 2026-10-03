"""
Crawl raw egg images from Bing, auto-annotate with ellipse detection,
train YOLOv8n, and export to TFLite.
No API keys needed!
"""
import sys, shutil, cv2, numpy as np
from pathlib import Path

print("=" * 60)
print("  Egg Detection — Web Crawl + Auto-Annotate + Train")
print("=" * 60)

# ── Step 1: Crawl egg images from Bing ───────────────────────
RAW_DIR    = Path("datasets/eggs_raw/images")
LABELS_DIR = Path("datasets/eggs_raw/labels")
RAW_DIR.mkdir(parents=True, exist_ok=True)
LABELS_DIR.mkdir(parents=True, exist_ok=True)

print("\n[1/4] Crawling egg images from Bing...")

from icrawler.builtin import BingImageCrawler

queries = [
    "raw egg with shell",
    "raw chicken egg white background",
    "raw egg yolk cracked",
    "fresh eggs basket",
    "egg single white background",
]

for q in queries:
    print(f"   Crawling: '{q}'")
    crawler = BingImageCrawler(
        storage={"root_dir": str(RAW_DIR)},
        downloader_threads=4,
        parser_threads=2,
    )
    try:
        crawler.crawl(keyword=q, max_num=30, min_size=(100, 100))
    except Exception as e:
        print(f"   Warning: {e}")

img_files = list(RAW_DIR.glob("*.jpg")) + list(RAW_DIR.glob("*.png")) + list(RAW_DIR.glob("*.jpeg"))
print(f"   Total images: {len(img_files)}")

# ── Step 2: Auto-annotate using ellipse detection ─────────────
print("\n[2/4] Auto-annotating eggs using ellipse detection...")

annotated = 0
for img_path in img_files:
    try:
        img = cv2.imread(str(img_path))
        if img is None:
            continue
        h, w = img.shape[:2]

        # Convert to grayscale and find ellipses
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)
        edges = cv2.Canny(blurred, 50, 150)

        # Find contours and fit ellipses
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        best_box = None
        best_area = 0

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < (h * w * 0.02):  # at least 2% of image
                continue
            x, y, bw, bh = cv2.boundingRect(cnt)
            # Egg-like aspect ratio: between 0.5 and 1.5
            ar = bw / max(bh, 1)
            if 0.4 < ar < 1.6 and area > best_area:
                best_box = (x, y, bw, bh)
                best_area = area

        if best_box is None:
            # Fallback: use full image center (assume egg fills frame)
            margin = 0.1
            best_box = (int(w * margin), int(h * margin),
                        int(w * (1 - 2 * margin)), int(h * (1 - 2 * margin)))

        x, y, bw, bh = best_box
        # Convert to YOLO format (normalized cx, cy, w, h)
        cx = (x + bw / 2) / w
        cy = (y + bh / 2) / h
        nw = bw / w
        nh = bh / h

        label_path = LABELS_DIR / (img_path.stem + ".txt")
        label_path.write_text(f"0 {cx:.6f} {cy:.6f} {nw:.6f} {nh:.6f}\n")
        annotated += 1

    except Exception as e:
        pass

print(f"   Annotated {annotated} images")

# Write data.yaml
DATASET_DIR = Path("datasets/eggs_raw")
yaml_content = f"""path: {DATASET_DIR.resolve().as_posix()}
train: images
val: images
nc: 1
names: ['egg']
"""
yaml_path = DATASET_DIR / "data.yaml"
yaml_path.write_text(yaml_content)

# ── Step 3: Train YOLOv8n ─────────────────────────────────────
print("\n[3/4] Fine-tuning YOLOv8n on egg dataset...")
print(f"      {annotated} images, 25 epochs with heavy augmentation")

from ultralytics import YOLO

model = YOLO("yolov8n.pt")
model.train(
    data=str(yaml_path),
    epochs=25,
    imgsz=640,
    batch=4,
    workers=0,
    device="cpu",
    project="runs/egg",
    name="train",
    exist_ok=True,
    verbose=True,
    plots=False,
    augment=True,
    degrees=20,
    fliplr=0.5,
    flipud=0.3,
    hsv_h=0.02,
    hsv_s=0.7,
    hsv_v=0.4,
    scale=0.5,
    mosaic=1.0,
    mixup=0.1,
)

best_pt = Path("runs/egg/train/weights/best.pt")
print(f"\n   Training done! Best weights: {best_pt}")

# ── Step 4: Export to TFLite ──────────────────────────────────
print("\n[4/4] Exporting to TFLite float16...")

import subprocess
subprocess.run([sys.executable, "-m", "pip", "install", "-q",
                "tensorflow>=2.16.0,<=2.19.0"])

trained = YOLO(str(best_pt))
trained.export(format="tflite", half=True)

tflite_files = list(Path("runs/egg").rglob("*float16.tflite"))
if not tflite_files:
    tflite_files = list(Path("runs/egg").rglob("*.tflite"))

if tflite_files:
    dest = Path("assets/egg_float16.tflite")
    shutil.copy(tflite_files[0], dest)
    mb = dest.stat().st_size / 1024 / 1024
    print(f"\n✅ SUCCESS!")
    print(f"   assets/egg_float16.tflite ({mb:.1f} MB)")
    print(f"   Classes: {trained.names}")
else:
    print("❌ tflite not found")

print("\nAll done!")
