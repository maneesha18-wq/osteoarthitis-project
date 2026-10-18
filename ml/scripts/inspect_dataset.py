"""
Dataset Inspection Script for KneeAI
Inspects real directory structure, classes, dimensions, channel formats, and class distributions.
Never fabricates statistics.
"""

import os
import sys
from pathlib import Path
from collections import Counter
from PIL import Image

def inspect_directory(base_path: str):
    base = Path(base_path)
    if not base.exists():
        print(f"[-] Directory does not exist: {base_path}")
        return

    print(f"\n=======================================================")
    print(f" Inspecting Directory: {base.resolve()}")
    print(f"=======================================================")

    subdirs = [d for d in base.iterdir() if d.is_dir()]
    print(f"Immediate subdirectories ({len(subdirs)}): {[d.name for d in subdirs]}")

    all_images = []
    class_counts = Counter()
    image_shapes = Counter()
    color_modes = Counter()
    corrupt_count = 0

    valid_extensions = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}

    for root, dirs, files in os.walk(base):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in valid_extensions:
                file_path = os.path.join(root, f)
                all_images.append(file_path)
                
                # Deduce class label from directory name if labeled 0, 1, 2, 3, 4
                rel_parts = Path(file_path).relative_to(base).parts
                if len(rel_parts) > 1:
                    class_name = rel_parts[0]
                    # If first part is "test" or "auto_test", check second part
                    if class_name in ["test", "auto_test", "train", "val"] and len(rel_parts) > 2:
                        class_name = rel_parts[1]
                    class_counts[class_name] += 1
                else:
                    class_counts["root"] += 1

                # Inspect first 200 images for dimension / mode checks
                if len(all_images) <= 200:
                    try:
                        with Image.open(file_path) as img:
                            image_shapes[img.size] += 1
                            color_modes[img.mode] += 1
                    except Exception as e:
                        corrupt_count += 1

    print(f"\nTotal image files discovered: {len(all_images)}")
    print(f"Corrupted / Unreadable in sample: {corrupt_count}")
    print("\nClass breakdown:")
    for cls, count in sorted(class_counts.items()):
        print(f"  Class '{cls}': {count} images")

    print("\nSample Image Dimensions (width, height):")
    for shape, count in image_shapes.most_common(5):
        print(f"  {shape}: {count} occurrences")

    print("\nSample Color Modes:")
    for mode, count in color_modes.items():
        print(f"  Mode '{mode}': {count} occurrences")

    return {
        "total": len(all_images),
        "classes": dict(class_counts),
        "shapes": dict(image_shapes),
        "modes": dict(color_modes),
    }

if __name__ == "__main__":
    candidates = ["archive", "data set", "data", "ml/data"]
    results = {}
    for c in candidates:
        if os.path.exists(c):
            results[c] = inspect_directory(c)
