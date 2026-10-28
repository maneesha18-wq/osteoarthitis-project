"""
Reproducible Training Pipeline for KneeAI Kellgren-Lawrence Grading
Supports MobileNetV2 transfer learning & Baseline CNN comparison.
Includes data augmentation (train only), class weighting, early stopping, and artifact export.
"""

import os
import sys
import json
import random
import argparse
from pathlib import Path
from typing import Tuple, List, Dict, Any

CURRENT_DIR = Path(__file__).resolve().parent
ROOT_DIR = CURRENT_DIR.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

keras_dir = ROOT_DIR / ".keras"
keras_dir.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("KERAS_HOME", str(keras_dir))
os.environ.setdefault("MPLCONFIGDIR", os.environ.get("TEMP", os.path.expanduser("~")))
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

import numpy as np
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.utils.class_weight import compute_class_weight

from ml.preprocessing.pipeline import preprocess_image
from ml.training.models import build_mobilenetv2_model, build_baseline_cnn, compile_model
from ml.evaluation.metrics import evaluate_predictions, save_metrics_report

# Global deterministic seed
SEED = 42

def set_seed(seed: int = SEED):
    random.seed(seed)
    np.random.seed(seed)
    tf.random.set_seed(seed)
    os.environ["PYTHONHASHSEED"] = str(seed)


CLASS_NAME_MAP = {
    "0": 0, "0normal": 0, "normal": 0,
    "1": 1, "1doubtful": 1, "doubtful": 1,
    "2": 2, "2mild": 2, "mild": 2,
    "3": 3, "3moderate": 3, "moderate": 3,
    "4": 4, "4severe": 4, "severe": 4,
}

def discover_dataset(dataset_dir: str) -> Tuple[List[str], List[int]]:
    """
    Scans dataset directory for images organized in class subfolders.
    Supports '0', '1', '2', '3', '4' as well as '0Normal', '1Doubtful', '2Mild', etc.
    """
    valid_extensions = {".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff"}
    image_paths = []
    labels = []

    base_path = Path(dataset_dir)
    if not base_path.exists():
        raise FileNotFoundError(f"Dataset path not found: {dataset_dir}")

    for root, _, files in os.walk(base_path):
        for f in files:
            ext = os.path.splitext(f)[1].lower()
            if ext in valid_extensions:
                rel_parts = Path(root).relative_to(base_path).parts
                grade = None
                for part in reversed(rel_parts):
                    clean = part.lower().strip()
                    if clean in CLASS_NAME_MAP:
                        grade = CLASS_NAME_MAP[clean]
                        break
                    elif clean and clean[0] in ["0", "1", "2", "3", "4"]:
                        grade = int(clean[0])
                        break

                if grade is not None:
                    image_paths.append(os.path.join(root, f))
                    labels.append(grade)

    print(f"[+] Discovered {len(image_paths)} labeled images in {dataset_dir}")
    return image_paths, labels


class KneeDataGenerator(tf.keras.utils.Sequence):
    """
    Keras Sequence generator loading and augmenting radiograph batches.
    """
    def __init__(
        self,
        image_paths: List[str],
        labels: List[int],
        batch_size: int = 16,
        target_size: Tuple[int, int] = (224, 224),
        is_training: bool = False,
        apply_clahe: bool = True,
        shuffle: bool = True
    ):
        self.image_paths = image_paths
        self.labels = labels
        self.batch_size = batch_size
        self.target_size = target_size
        self.is_training = is_training
        self.apply_clahe = apply_clahe
        self.shuffle = shuffle
        self.indices = np.arange(len(self.image_paths))
        if self.shuffle:
            np.random.shuffle(self.indices)

    def __len__(self):
        return int(np.ceil(len(self.image_paths) / self.batch_size))

    def on_epoch_end(self):
        if self.shuffle:
            np.random.shuffle(self.indices)

    def __getitem__(self, index):
        batch_idx = self.indices[index * self.batch_size:(index + 1) * self.batch_size]
        batch_paths = [self.image_paths[i] for i in batch_idx]
        batch_labels = [self.labels[i] for i in batch_idx]

        batch_x = []
        for path in batch_paths:
            tensor, _ = preprocess_image(
                path,
                target_size=self.target_size,
                apply_clahe=self.apply_clahe,
                normalize_mode="mobilenetv2"
            )
            img = tensor[0]  # Shape: (224, 224, 3)

            # Apply augmentation only during training
            if self.is_training:
                # Random horizontal flip
                if random.random() > 0.5:
                    img = np.fliplr(img)
                # Random slight rotation (+- 7 degrees)
                if random.random() > 0.5:
                    angle = random.uniform(-7, 7)
                    h, w = self.target_size
                    m = tf.keras.preprocessing.image.apply_affine_transform(
                        img, theta=angle, fill_mode="nearest"
                    )
                    img = m

            batch_x.append(img)

        return np.array(batch_x, dtype=np.float32), np.array(batch_labels, dtype=np.int32)


def train_pipeline(
    dataset_dir: str = "data set",
    output_dir: str = "ml/artifacts",
    model_type: str = "mobilenetv2",
    epochs: int = 15,
    batch_size: int = 16,
    learning_rate: float = 1e-4,
    fine_tune: bool = True
):
    set_seed(SEED)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"\n=======================================================")
    print(f" Starting KneeAI Model Training Pipeline ({model_type.upper()})")
    print(f"=======================================================")

    # 1. Dataset Discovery
    image_paths, labels = discover_dataset(dataset_dir)
    if len(image_paths) == 0:
        raise ValueError(f"No labeled images found in: {dataset_dir}")

    # 2. Stratified Train / Val / Test Split (70% train, 15% val, 15% held-out test)
    train_paths, test_paths, train_labels, test_labels = train_test_split(
        image_paths, labels, test_size=0.15, random_state=SEED, stratify=labels
    )
    train_paths, val_paths, train_labels, val_labels = train_test_split(
        train_paths, train_labels, test_size=0.176, random_state=SEED, stratify=train_labels
    )

    print(f"Data Partitions:")
    print(f"  - Training Set:   {len(train_paths)} images")
    print(f"  - Validation Set: {len(val_paths)} images")
    print(f"  - Held-out Test:  {len(test_paths)} images")

    # 3. Class Weighting for Imbalance
    unique_classes = np.unique(train_labels)
    class_weights_arr = compute_class_weight(
        class_weight="balanced",
        classes=unique_classes,
        y=train_labels
    )
    class_weights_dict = {int(c): float(w) for c, w in zip(unique_classes, class_weights_arr)}
    print(f"Computed Class Weights: {class_weights_dict}")

    # 4. Data Generators
    train_gen = KneeDataGenerator(
        train_paths, train_labels, batch_size=batch_size, is_training=True
    )
    val_gen = KneeDataGenerator(
        val_paths, val_labels, batch_size=batch_size, is_training=False, shuffle=False
    )
    test_gen = KneeDataGenerator(
        test_paths, test_labels, batch_size=batch_size, is_training=False, shuffle=False
    )

    # 5. Build & Compile Model
    if model_type == "mobilenetv2":
        backup_model_path = output_path / f"{model_type}_knee_kl_backup.keras"
        existing_model_path = output_path / f"{model_type}_knee_kl.keras"
        if backup_model_path.exists():
            print(f"[+] Initializing from verified architecture: {backup_model_path}")
            model = tf.keras.models.load_model(str(backup_model_path))
        elif existing_model_path.exists():
            print(f"[+] Initializing from verified architecture: {existing_model_path}")
            model = tf.keras.models.load_model(str(existing_model_path))
        else:
            model = build_mobilenetv2_model(
                input_shape=(224, 224, 3),
                num_classes=5,
                pretrained_weights="imagenet",
                freeze_base=not fine_tune
            )
    else:
        model = build_baseline_cnn(input_shape=(224, 224, 3), num_classes=5)

    compile_model(model, learning_rate=learning_rate)
    model.summary()

    # 6. Callbacks
    model_save_path = output_path / f"{model_type}_knee_kl.keras"
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor="val_loss", patience=4, restore_best_weights=True, verbose=1
        ),
        tf.keras.callbacks.ModelCheckpoint(
            filepath=str(model_save_path),
            monitor="val_loss",
            save_best_only=True,
            verbose=1
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss", factor=0.5, patience=2, min_lr=1e-6, verbose=1
        )
    ]

    # 7. Train Model
    print(f"\n[+] Executing model training across {epochs} epochs...")
    history = model.fit(
        train_gen,
        validation_data=val_gen,
        epochs=epochs,
        class_weight=class_weights_dict,
        callbacks=callbacks
    )

    # Save training history
    history_dict = {k: [float(val) for val in v] for k, v in history.history.items()}
    with open(output_path / "training_history.json", "w") as f:
        json.dump(history_dict, f, indent=2)

    # 8. Evaluation on Held-Out Test Set
    print("\n[+] Evaluating on Held-Out Test Set...")
    y_true_list = []
    y_pred_probs_list = []

    for i in range(len(test_gen)):
        bx, by = test_gen[i]
        preds = model.predict(bx, verbose=0)
        y_true_list.extend(by)
        y_pred_probs_list.extend(preds)

    y_true_arr = np.array(y_true_list)
    y_pred_probs_arr = np.array(y_pred_probs_list)

    metrics = evaluate_predictions(y_true_arr, y_pred_probs_arr)
    save_metrics_report(metrics, str(output_path / "evaluation_metrics.json"))

    print("\n================== Held-Out Evaluation Summary ==================")
    print(f"Overall Accuracy:       {metrics['overall']['accuracy']*100:.2f}%")
    print(f"Macro F1-Score:         {metrics['overall']['f1_macro']*100:.2f}%")
    print(f"Within 1-Grade Rate:    {metrics['adjacent_grade_analysis']['within_one_grade_rate']*100:.2f}%")
    print("=================================================================\n")

    # 9. Save Metadata
    metadata = {
        "model_type": model_type,
        "model_version": "1.0.0",
        "input_shape": [224, 224, 3],
        "num_classes": 5,
        "classes": {
            "0": "Grade 0 (Normal)",
            "1": "Grade 1 (Doubtful)",
            "2": "Grade 2 (Mild)",
            "3": "Grade 3 (Moderate)",
            "4": "Grade 4 (Severe)",
        },
        "preprocessing": {
            "target_size": [224, 224],
            "clahe_applied": True,
            "normalize": "mobilenetv2",
        },
        "dataset_source": str(dataset_dir),
        "total_training_samples": len(train_paths),
        "total_test_samples": len(test_paths),
        "accuracy": metrics["overall"]["accuracy"],
        "macro_f1": metrics["overall"]["f1_macro"],
    }
    with open(output_path / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[+] All artifacts successfully exported to: {output_path}")
    return model, metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train KneeAI KL Grade Classification Model")
    parser.add_argument("--dataset", type=str, default="data set", help="Path to dataset directory")
    parser.add_argument("--model", type=str, default="mobilenetv2", choices=["mobilenetv2", "baseline"])
    parser.add_argument("--epochs", type=int, default=5, help="Number of epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    args = parser.parse_args()

    train_pipeline(
        dataset_dir=args.dataset,
        model_type=args.model,
        epochs=args.epochs,
        batch_size=args.batch_size
    )
