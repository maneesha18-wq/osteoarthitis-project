"""
Verification Script for KneeAI Machine Learning Pipeline
Tests end-to-end: Preprocessing -> Model Instantiation -> Inference -> Grad-CAM -> Metrics.
Uses real images from local dataset.
"""

import sys
import os
from pathlib import Path
import numpy as np

# Add project root to sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from ml.preprocessing.pipeline import preprocess_image, decode_and_validate_image
from ml.training.models import build_mobilenetv2_model, build_baseline_cnn, compile_model
from ml.explainability.gradcam import compute_gradcam_heatmap, generate_gradcam_visualizations
from ml.evaluation.metrics import evaluate_predictions

def run_verification():
    print("=======================================================")
    print(" Running KneeAI ML Pipeline Self-Verification Test")
    print("=======================================================")

    # 1. Locate a sample real radiograph
    sample_img_path = None
    candidates = [
        "data set/test/0",
        "data set/test/1",
        "data set/auto_test/0",
        "archive/test/1"
    ]
    for c in candidates:
        p = Path(c)
        if p.exists():
            for f in p.glob("*.png"):
                sample_img_path = str(f)
                break
        if sample_img_path:
            break

    if not sample_img_path:
        print("[-] Could not find a test image in expected directories.")
        return False

    print(f"[1] Test radiograph located: {sample_img_path}")

    # 2. Test Preprocessing Pipeline
    with open(sample_img_path, "rb") as f:
        raw_bytes = f.read()

    pil_img = decode_and_validate_image(raw_bytes)
    print(f"[2] Image validated: Format={pil_img.format}, Size={pil_img.size}")

    tensor, original_rgb = preprocess_image(
        pil_img, target_size=(224, 224), apply_clahe=True, normalize_mode="mobilenetv2"
    )
    print(f"[3] Preprocessed tensor shape: {tensor.shape}, min={tensor.min():.2f}, max={tensor.max():.2f}")
    assert tensor.shape == (1, 224, 224, 3), f"Invalid tensor shape: {tensor.shape}"

    # 3. Test Baseline CNN Construction
    baseline_model = build_baseline_cnn(input_shape=(224, 224, 3), num_classes=5)
    compile_model(baseline_model)
    preds_baseline = baseline_model.predict(tensor, verbose=0)
    print(f"[4] Baseline CNN prediction output shape: {preds_baseline.shape}, sum={np.sum(preds_baseline):.4f}")
    assert preds_baseline.shape == (1, 5)

    # 4. Test MobileNetV2 Model Construction
    print("[5] Instantiating MobileNetV2 architecture...")
    mobilenet_model = build_mobilenetv2_model(
        input_shape=(224, 224, 3), num_classes=5, pretrained_weights=None, freeze_base=False
    )
    compile_model(mobilenet_model)
    preds_mobilenet = mobilenet_model.predict(tensor, verbose=0)
    print(f"[6] MobileNetV2 prediction output shape: {preds_mobilenet.shape}, sum={np.sum(preds_mobilenet):.4f}")
    assert preds_mobilenet.shape == (1, 5)

    # 5. Test Grad-CAM Visual Explainability Generation
    print("[7] Computing Grad-CAM heatmap and overlays...")
    target_class = int(np.argmax(preds_mobilenet[0]))
    cam_results = generate_gradcam_visualizations(
        model=mobilenet_model,
        input_tensor=tensor,
        original_rgb=original_rgb,
        target_class_index=target_class,
        alpha=0.45
    )

    heatmap = cam_results["raw_heatmap"]
    print(f"[8] Grad-CAM heatmap generated. Shape: {heatmap.shape}, min={heatmap.min():.2f}, max={heatmap.max():.2f}")
    assert heatmap.shape == (224, 224)
    assert len(cam_results["overlay_base64"]) > 100, "Base64 overlay string is empty"
    print(f"[9] Base64 overlay generated: {len(cam_results['overlay_base64'])} chars")

    # 6. Test Metrics Engine
    print("[10] Testing evaluation metrics calculation...")
    dummy_y_true = np.array([0, 1, 2, 3, 4, 1, 2])
    dummy_y_pred_probs = np.eye(5)[[0, 1, 2, 2, 4, 1, 3]]  # Some exact, some adjacent
    eval_res = evaluate_predictions(dummy_y_true, dummy_y_pred_probs)
    print(f"[11] Evaluation metrics test: Accuracy={eval_res['overall']['accuracy']*100:.1f}%, Within-1-Grade={eval_res['adjacent_grade_analysis']['within_one_grade_rate']*100:.1f}%")

    print("\n=======================================================")
    print(" ALL PIPELINE TESTS PASSED SUCCESSFULLY! ")
    print("=======================================================\n")
    return True

if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
