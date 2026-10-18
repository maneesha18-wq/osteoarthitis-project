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
    Generates complete explainability artifacts: raw heatmap, colored heatmap, and blended overlay.
    
    Args:
        model: Trained model.
        input_tensor: Preprocessed tensor (1, H, W, 3).
        original_rgb: Un-normalized original radiograph RGB (H, W, 3), uint8.
        target_class_index: Target KL class index.
        alpha: Blending weight for heatmap overlay (0.0 to 1.0).
        colormap: OpenCV colormap constant.
        
    Returns:
        Dict containing raw heatmap, colored heatmap, blended overlay, and base64 strings.
    """
    heatmap = compute_gradcam_heatmap(model, input_tensor, target_class_index)

    # Convert to 8-bit scale [0, 255]
    heatmap_uint8 = np.uint8(255 * heatmap)

    # Apply pseudo-coloring
    heatmap_colored_bgr = cv2.applyColorMap(heatmap_uint8, colormap)
    heatmap_colored_rgb = cv2.cvtColor(heatmap_colored_bgr, cv2.COLOR_BGR2RGB)

    # Ensure original image dimensions match
    if original_rgb.shape[:2] != heatmap.shape[:2]:
        original_resized = cv2.resize(
            original_rgb,
            (heatmap.shape[1], heatmap.shape[0]),
            interpolation=cv2.INTER_AREA
        )
    else:
        original_resized = original_rgb

    # Weighted blending: overlay = alpha * heatmap + (1 - alpha) * original
    blended_overlay = cv2.addWeighted(
        heatmap_colored_rgb, alpha, original_resized, 1.0 - alpha, 0
    )

    # Convert images to base64
    def to_base64(img_array: np.ndarray) -> str:
        pil_img = Image.fromarray(img_array)
        buffer = io.BytesIO()
        pil_img.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode("utf-8")

    return {
        "raw_heatmap": heatmap,
        "heatmap_rgb": heatmap_colored_rgb,
        "overlay_rgb": blended_overlay,
        "original_base64": to_base64(original_resized),
        "heatmap_base64": to_base64(heatmap_colored_rgb),
        "overlay_base64": to_base64(blended_overlay),
    }
