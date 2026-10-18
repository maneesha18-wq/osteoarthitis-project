# KneeAI Dataset Inspection & Statistical Summary

**Dataset Identifier:** Kaggle Knee Osteoarthritis Dataset with Severity  
**Inspection Date:** 2026-10-18  
**Inspection Script:** `ml/scripts/inspect_dataset.py`  
**Storage Compliance:** All raw image directories (`archive/`, `data set/`, `ml/data/`) are excluded from Git version control via `.gitignore`.

---

## 1. Directory Structure

```
data set/
├── auto_test/
│   ├── 0/   (KL Grade 0)
│   ├── 1/   (KL Grade 1)
│   ├── 2/   (KL Grade 2)
│   ├── 3/   (KL Grade 3)
│   └── 4/   (KL Grade 4)
└── test/
    ├── 0/
    ├── 1/
    ├── 2/
    ├── 3/
    └── 4/
```

---

## 2. Quantitative Class Distribution

| KL Grade | Radiographic Label | Usable Images | Percentage | Staging Description |
| :---: | :---: | :---: | :---: | :--- |
| **0** | None / Normal | 1,243 | 54.90% | Normal joint space width, no osteophytes |
| **1** | Doubtful | 374 | 16.52% | Questionable joint space narrowing, possible osteophytic lipping |
| **2** | Mild | 403 | 17.80% | Definite osteophytes present, possible mild joint narrowing |
| **3** | Moderate | 200 | 8.83% | Multiple moderate osteophytes, definite joint space narrowing, mild sclerosis |
| **4** | Severe | 44 | 1.94% | Large osteophytes, severe joint space obliteration, marked bone deformity |
| **Total** | — | **2,264** | **100.0%** | **Zero corrupted files encountered** |

---

## 3. Radiograph Characteristics
- **Native Dimensions:** 224 × 224 pixels (uniformly standardized).
- **Color Format:** Grayscale mode `L` (single-channel 8-bit unsigned integer, values 0–255).
- **Three-Channel Conversion Strategy:** For compatibility with pre-trained MobileNetV2 backbones, single-channel tensors are broadcast across RGB channels ($C_1 = C_2 = C_3$).
- **Normalization:** Min-Max scaling to range $[0.0, 1.0]$ or MobileNetV2 standard normalization $[-1.0, 1.0]$.
- **Contrast Enhancement:** CLAHE (Contrast Limited Adaptive Histogram Equalization, clip limit = 2.0, grid size = 8×8) enhances subchondral bone edges without amplifying high-frequency noise.

---

## 4. Class Imbalance Mitigation Strategy
The dataset exhibits significant imbalance, with Grade 0 representing ~55% of images and Grade 4 representing only ~1.9%. To prevent the model from defaulting toward the majority class:
1. **Computed Class Weights:** Applied inversely proportional to class frequencies during model training.
2. **Stratified Sampling:** Preserves grade proportions in Train, Validation, and Held-Out Test splits.
3. **Macro-Averaged F1 Evaluation:** Prioritized over simple accuracy to ensure clinical fidelity across minority severe classes.
