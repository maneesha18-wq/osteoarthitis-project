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
                
                # Deduce class label from directory name
                rel_parts = Path(file_path).relative_to(base).parts
                class_name = "unknown"
                for part in reversed(rel_parts[:-1]):
                    clean = part.lower().strip()
                    if clean in ["0", "0normal", "normal"]:
                        class_name = "Grade 0 (Normal)"
                        break
                    elif clean in ["1", "1doubtful", "doubtful"]:
                        class_name = "Grade 1 (Doubtful)"
                        break
                    elif clean in ["2", "2mild", "mild"]:
                        class_name = "Grade 2 (Mild)"
                        break
                    elif clean in ["3", "3moderate", "moderate"]:
                        class_name = "Grade 3 (Moderate)"
                        break
                    elif clean in ["4", "4severe", "severe"]:
                        class_name = "Grade 4 (Severe)"
                        break
                    elif clean and clean[0] in ["0", "1", "2", "3", "4"]:
                        class_name = f"Grade {clean[0]}"
                        break

                class_counts[class_name] += 1

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
    if len(sys.argv) > 1:
        inspect_directory(sys.argv[1])
    else:
        candidates = ["Digital Knee X-ray Images/Digital Knee X-ray Images/Knee X-ray Images/MedicalExpert-I", "archive", "data set", "data", "ml/data"]
        results = {}
        for c in candidates:
            if os.path.exists(c):
                results[c] = inspect_directory(c)
