"""
Comprehensive Evaluation Engine for KneeAI
Calculates accuracy, per-class precision/recall/F1, macro-averaged metrics,
confusion matrix, and adjacent-grade error analysis (Grade 1 vs 2, Grade 2 vs 3).
"""

import json
import numpy as np
from typing import Dict, Any, List
from sklearn.metrics import (
    accuracy_score,
    precision_recall_fscore_support,
    classification_report,
    confusion_matrix
)

KL_GRADE_NAMES = [
    "Grade 0 (Normal)",
    "Grade 1 (Doubtful)",
    "Grade 2 (Mild)",
    "Grade 3 (Moderate)",
    "Grade 4 (Severe)"
]


def evaluate_predictions(
    y_true: np.ndarray,
    y_pred_probs: np.ndarray
) -> Dict[str, Any]:
    """
    Computes complete statistical evaluation metrics from ground-truth and predicted probabilities.
    
    Args:
        y_true: 1D array of ground truth labels (0-4).
        y_pred_probs: 2D array of predicted class probabilities (N, 5).
        
    Returns:
        Structured evaluation metrics dict.
    """
    y_pred = np.argmax(y_pred_probs, axis=1)

    # Global accuracy
    acc = float(accuracy_score(y_true, y_pred))

    # Macro & Weighted metrics
    precision_macro, recall_macro, f1_macro, _ = precision_recall_fscore_support(
        y_true, y_pred, average="macro", zero_division=0
    )
    precision_weighted, recall_weighted, f1_weighted, _ = precision_recall_fscore_support(
        y_true, y_pred, average="weighted", zero_division=0
    )

    # Per-class metrics
    precision_per_class, recall_per_class, f1_per_class, support_per_class = precision_recall_fscore_support(
        y_true, y_pred, average=None, labels=[0, 1, 2, 3, 4], zero_division=0
    )

    per_class_summary = {}
    for grade_idx, name in enumerate(KL_GRADE_NAMES):
        per_class_summary[f"grade_{grade_idx}"] = {
            "label": name,
            "precision": float(precision_per_class[grade_idx]),
            "recall": float(recall_per_class[grade_idx]),
            "f1_score": float(f1_per_class[grade_idx]),
            "support": int(support_per_class[grade_idx]),
        }

    # Confusion Matrix
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1, 2, 3, 4])
    cm_list = cm.tolist()

    # Adjacent Grade Confusion Analysis
    # In clinical practice, 1-grade off is clinically common; 2+ grade off is major error
    total_samples = len(y_true)
    exact_matches = int(np.sum(y_true == y_pred))
    one_grade_off = int(np.sum(np.abs(y_true - y_pred) == 1))
    multi_grade_off = int(np.sum(np.abs(y_true - y_pred) > 1))

    # Specific key clinical ambiguities:
    # 1. Confusion between Grade 1 (Doubtful) and Grade 2 (Definite Osteophytes)
    g1_true_indices = (y_true == 1)
    g1_as_g2 = int(np.sum(y_pred[g1_true_indices] == 2)) if np.sum(g1_true_indices) > 0 else 0
    g2_true_indices = (y_true == 2)
    g2_as_g1 = int(np.sum(y_pred[g2_true_indices] == 1)) if np.sum(g2_true_indices) > 0 else 0

    # 2. Confusion between Grade 2 (Mild) and Grade 3 (Moderate)
    g2_as_g3 = int(np.sum(y_pred[g2_true_indices] == 3)) if np.sum(g2_true_indices) > 0 else 0
    g3_true_indices = (y_true == 3)
    g3_as_g2 = int(np.sum(y_pred[g3_true_indices] == 2)) if np.sum(g3_true_indices) > 0 else 0

    return {
        "overall": {
            "accuracy": acc,
            "precision_macro": float(precision_macro),
            "recall_macro": float(recall_macro),
            "f1_macro": float(f1_macro),
            "precision_weighted": float(precision_weighted),
            "recall_weighted": float(recall_weighted),
            "f1_weighted": float(f1_weighted),
            "total_samples": total_samples,
        },
        "per_class": per_class_summary,
        "confusion_matrix": cm_list,
        "adjacent_grade_analysis": {
            "exact_agreement_rate": float(exact_matches / total_samples) if total_samples > 0 else 0.0,
            "within_one_grade_rate": float((exact_matches + one_grade_off) / total_samples) if total_samples > 0 else 0.0,
            "multi_grade_discrepancy_rate": float(multi_grade_off / total_samples) if total_samples > 0 else 0.0,
            "g1_predicted_as_g2": g1_as_g2,
            "g2_predicted_as_g1": g2_as_g1,
            "g2_predicted_as_g3": g2_as_g3,
            "g3_predicted_as_g2": g3_as_g2,
        }
    }


def save_metrics_report(metrics: Dict[str, Any], output_path: str):
    """Saves metrics dictionary to a JSON file."""
    with open(output_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[+] Evaluation metrics saved to: {output_path}")
