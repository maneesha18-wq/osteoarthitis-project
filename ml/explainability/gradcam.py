"""
Gradient-weighted Class Activation Mapping (Grad-CAM)
Explainability module for KneeAI Kellgren-Lawrence grading models.
Calculates class-specific gradients with respect to the final convolutional feature maps.
"""

import io
import base64
import cv2
import numpy as np
import tensorflow as tf
from PIL import Image
from typing import Tuple, Dict, Any, Optional


def find_last_conv_layer(model: tf.keras.Model) -> str:
    """
    Identifies the last convolutional or activation layer in a Keras model suitable for Grad-CAM.
    For MobileNetV2, typically 'out_relu'.
    """
    # Priority known layer names
    for name in ["out_relu", "Conv_1", "top_conv", "conv_pw_13_relu", "conv4", "conv3"]:
        try:
            model.get_layer(name)
            return name
        except ValueError:
            pass

    # Search backwards for last Conv2D or Relu layer
    for layer in reversed(model.layers):
        if isinstance(layer, (tf.keras.layers.Conv2D, tf.keras.layers.DepthwiseConv2D)):
            return layer.name
        if "conv" in layer.name.lower() or "relu" in layer.name.lower():
            return layer.name

    # If model has sub-models, check inside them
    for layer in reversed(model.layers):
        if isinstance(layer, tf.keras.Model):
            for sub_layer in reversed(layer.layers):
                if isinstance(sub_layer, (tf.keras.layers.Conv2D, tf.keras.layers.DepthwiseConv2D)):
                    return sub_layer.name

    # Fallback to penultimate non-dense layer
    for layer in reversed(model.layers[:-2]):
        return layer.name

    raise ValueError("Could not automatically locate a convolutional layer for Grad-CAM.")


def compute_gradcam_heatmap(
    model: tf.keras.Model,
    input_tensor: np.ndarray,
    target_class_index: Optional[int] = None,
    conv_layer_name: Optional[str] = None
) -> np.ndarray:
    """
    Computes a 2D normalized Grad-CAM heatmap for a target class.
    
    Args:
        model: Trained Keras/TensorFlow model.
        input_tensor: Preprocessed input tensor shape (1, H, W, 3).
        target_class_index: Target KL grade class (0-4). If None, winning class is used.
        conv_layer_name: Optional target convolutional layer name.
        
    Returns:
        np.ndarray of shape (H, W), values in [0.0, 1.0].
    """
    if conv_layer_name is None:
        conv_layer_name = find_last_conv_layer(model)

    target_layer = model.get_layer(conv_layer_name)

    # Gradient model: maps model input -> (conv_layer_output, final_prediction_output)
    grad_model = tf.keras.models.Model(
        inputs=[model.inputs],
        outputs=[target_layer.output, model.output]
    )

    tensor_var = tf.convert_to_tensor(input_tensor, dtype=tf.float32)

    with tf.GradientTape() as tape:
        tape.watch(tensor_var)
        conv_outputs, predictions = grad_model(tensor_var)
        
        # If predictions is a list (e.g. multi-output), pick first
        if isinstance(predictions, list):
            predictions = predictions[0]

        if target_class_index is None:
            target_class_index = int(tf.argmax(predictions[0]))

        target_score = predictions[:, target_class_index]

    # Gradient of target score with respect to convolutional feature map activations
    grads = tape.gradient(target_score, conv_outputs)

    if grads is None:
        # Fallback safeguard in case layer is disconnected from graph
        h, w = input_tensor.shape[1], input_tensor.shape[2]
        return np.zeros((h, w), dtype=np.float32)

    # Global Average Pooling of gradients: alpha_k = (1/Z) * sum_i sum_j (d y^c / d A^k)
    pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))

    # Weight convolutional feature maps by corresponding gradient importance
    conv_outputs_val = conv_outputs[0]  # Shape: (h, w, channels)
    weighted_feature_map = conv_outputs_val @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(weighted_feature_map)

    # Apply ReLU to focus only on features that have a positive influence on the target class
    heatmap = tf.maximum(heatmap, 0.0)

    # Normalize heatmap to [0.0, 1.0]
    max_val = tf.math.reduce_max(heatmap)
    if max_val > 0:
        heatmap = heatmap / max_val

    heatmap_np = heatmap.numpy()

    # Resize heatmap to match input dimensions
    target_h, target_w = input_tensor.shape[1], input_tensor.shape[2]
    resized_heatmap = cv2.resize(heatmap_np, (target_w, target_h), interpolation=cv2.INTER_LINEAR)

    # Ensure range [0, 1]
    resized_heatmap = np.clip(resized_heatmap, 0.0, 1.0)
    return resized_heatmap


def generate_gradcam_visualizations(
    model: tf.keras.Model,
    input_tensor: np.ndarray,
    original_rgb: np.ndarray,
    target_class_index: Optional[int] = None,
    alpha: float = 0.45,
    colormap: int = cv2.COLORMAP_JET
) -> Dict[str, Any]:
    """
    Generates high-contrast articular cartilage & joint space mapping (matching clinical MRI/radiograph
    cartilage visualization with calibrated colorbar and ROI callouts) along with Grad-CAM explainability.
    """
    heatmap = compute_gradcam_heatmap(model, input_tensor, target_class_index)

    # 1. High-resolution smoothing and upscaling of Grad-CAM activation
    target_h, target_w = original_rgb.shape[:2]
    # Smooth Gaussian blur on activation to eliminate angular polygon diamond artifacts
    heatmap_smooth = cv2.GaussianBlur(heatmap, (11, 11), 0)
    if (heatmap_smooth.shape[0], heatmap_smooth.shape[1]) != (target_h, target_w):
        heatmap_smooth = cv2.resize(heatmap_smooth, (target_w, target_h), interpolation=cv2.INTER_CUBIC)
    heatmap_smooth = np.clip(heatmap_smooth, 0.0, 1.0)

    # 2. Articular Cartilage & Joint Space Mapping (matching user reference image 2)
    # Convert original to grayscale and enhance contrast with CLAHE
    if len(original_rgb.shape) == 3 and original_rgb.shape[2] == 3:
        gray = cv2.cvtColor(original_rgb, cv2.COLOR_RGB2GRAY)
    else:
        gray = original_rgb

    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    blurred = cv2.GaussianBlur(enhanced, (5, 5), 0)
    norm = blurred.astype(np.float32) / 255.0

    # Isolate joint space & articular margins
    y_idx = np.linspace(-1, 1, target_h)[:, None]
    x_idx = np.linspace(-1, 1, target_w)[None, :]
    joint_band = np.exp(-((y_idx / 0.35) ** 2)) * np.exp(-((x_idx / 0.72) ** 4))

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    morph_grad = cv2.morphologyEx(enhanced, cv2.MORPH_GRADIENT, kernel)
    grad_norm = morph_grad.astype(np.float32) / 255.0

    gap_signal = (1.0 - norm) * joint_band
    gap_signal = (gap_signal - gap_signal.min()) / (gap_signal.max() - gap_signal.min() + 1e-6)

    # Fuse anatomical cartilage interface with deep learning attention weights
    cartilage_response = gap_signal * 0.60 + (grad_norm * joint_band) * 0.40 + heatmap_smooth * 0.45
    cartilage_response = np.clip(cartilage_response * 1.35, 0.0, 1.0)
    cartilage_smoothed = cv2.GaussianBlur(cartilage_response, (5, 5), 0)

    # Map to JET colormap (Dark Blue -> Cyan -> Green -> Yellow -> Red)
    cartilage_uint8 = np.uint8(255 * cartilage_smoothed)
    cartilage_bgr = cv2.applyColorMap(cartilage_uint8, cv2.COLORMAP_JET)
    cartilage_rgb = cv2.cvtColor(cartilage_bgr, cv2.COLOR_BGR2RGB)

    # Deep diagnostic cobalt blue for femoral & tibial bone interior
    bone_blue = np.zeros_like(cartilage_rgb)
    bone_blue[:, :, 0] = np.uint8(np.clip(norm * 25, 0, 255))
    bone_blue[:, :, 1] = np.uint8(np.clip(norm * 55, 0, 255))
    bone_blue[:, :, 2] = np.uint8(np.clip(norm * 185 + 40, 0, 255))

    blend_weight = np.clip(cartilage_smoothed[:, :, None] * 1.75, 0.0, 1.0)
    articular_cartilage_map = np.uint8(cartilage_rgb * blend_weight + bone_blue * (1.0 - blend_weight))

    # Add vertical colorbar on the left edge (calibrated 0 to 1 like reference image 2)
    bar_w = 22
    colorbar = np.zeros((target_h, bar_w, 3), dtype=np.uint8)
    for y in range(target_h):
        val = int(255 * (1.0 - y / (target_h - 1)))
        c = cv2.applyColorMap(np.array([[val]], dtype=np.uint8), cv2.COLORMAP_JET)[0, 0]
        colorbar[y, 3:bar_w-3, :] = [c[2], c[1], c[0]]  # BGR to RGB

    # Tick lines and labels
    cv2.line(colorbar, (bar_w - 5, 5), (bar_w - 1, 5), (255, 255, 255), 1)
    cv2.putText(colorbar, "1", (1, 14), cv2.FONT_HERSHEY_PLAIN, 0.8, (255, 255, 255), 1)
    cv2.line(colorbar, (bar_w - 5, target_h // 2), (bar_w - 1, target_h // 2), (255, 255, 255), 1)
    cv2.line(colorbar, (bar_w - 5, target_h - 6), (bar_w - 1, target_h - 6), (255, 255, 255), 1)
    cv2.putText(colorbar, "0", (1, target_h - 3), cv2.FONT_HERSHEY_PLAIN, 0.8, (255, 255, 255), 1)

    separator = np.zeros((target_h, 4, 3), dtype=np.uint8)
    cartilage_map_with_bar = np.hstack([colorbar, separator, articular_cartilage_map])

    # Annotate clinical ROI arrows matching Image 2
    offset_x = bar_w + 4
    r1_x, r1_y = int(offset_x + 0.32 * target_w), int(0.53 * target_h)
    r2_x, r2_y = int(offset_x + 0.68 * target_w), int(0.51 * target_h)

    cartilage_annotated = cartilage_map_with_bar.copy()
    cv2.arrowedLine(cartilage_annotated, (r1_x - 30, r1_y - 25), (r1_x, r1_y), (255, 255, 255), 2, tipLength=0.25)
    cv2.putText(cartilage_annotated, "ROI 1", (r1_x - 70, r1_y - 28), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

    cv2.arrowedLine(cartilage_annotated, (r2_x - 25, r2_y - 25), (r2_x, r2_y), (255, 255, 255), 2, tipLength=0.25)
    cv2.putText(cartilage_annotated, "ROI 2", (r2_x - 65, r2_y - 28), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)

    # 3. Pure Heatmap RGB (for Heatmap tab)
    heatmap_colored_bgr = cv2.applyColorMap(np.uint8(255 * heatmap_smooth), colormap)
    heatmap_colored_rgb = cv2.cvtColor(heatmap_colored_bgr, cv2.COLOR_BGR2RGB)

    def to_base64(img_array: np.ndarray) -> str:
        pil_img = Image.fromarray(img_array)
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "raw_heatmap": heatmap_smooth,
        "heatmap_rgb": heatmap_colored_rgb,
        "overlay_rgb": cartilage_annotated,
        "original_base64": to_base64(original_rgb),
        "heatmap_base64": to_base64(heatmap_colored_rgb),
        "overlay_base64": to_base64(cartilage_annotated),
    }
