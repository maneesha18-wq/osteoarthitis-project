"""
Image Preprocessing Pipeline for KneeAI
Unified preprocessing logic for both training and inference.
Supports image validation, resizing, CLAHE contrast enhancement, and normalization.
"""

import io
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Union, Optional

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "TIFF"}
MAX_ALLOWED_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def decode_and_validate_image(
    file_bytes: bytes,
    max_size: int = MAX_ALLOWED_FILE_SIZE
) -> Image.Image:
    """
    Decodes and validates uploaded knee radiograph file bytes.
    Ensures file is within size limits, decodable, and in a supported format.
    """
    if len(file_bytes) > max_size:
        raise ValueError(
            f"File size ({len(file_bytes)/(1024*1024):.2f} MB) exceeds maximum allowed limit ({max_size/(1024*1024):.1f} MB)."
        )

    try:
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()  # Verify file integrity
    except Exception as e:
        raise ValueError(f"Uploaded file is corrupted or not a valid image: {str(e)}")

    # Re-open after verify() closes the stream
    image = Image.open(io.BytesIO(file_bytes))

    if image.format not in ALLOWED_FORMATS:
        raise ValueError(
            f"Unsupported image format: {image.format}. Allowed formats: {', '.join(sorted(ALLOWED_FORMATS))}"
        )

    if image.width < 64 or image.height < 64:
        raise ValueError(
            f"Image dimensions ({image.width}x{image.height}) are too small for diagnostic feature extraction."
        )

    return image


def apply_clahe_contrast_enhancement(
    gray_image: np.ndarray,
    clip_limit: float = 2.0,
    tile_grid_size: Tuple[int, int] = (8, 8)
) -> np.ndarray:
    """
    Applies Contrast Limited Adaptive Histogram Equalization (CLAHE).
    Enhances joint-space contours and subchondral trabecular bone visibility.
    """
    if len(gray_image.shape) == 3 and gray_image.shape[2] == 3:
        # If RGB, convert to grayscale first
        gray = cv2.cvtColor(gray_image, cv2.COLOR_RGB2GRAY)
    else:
        gray = gray_image

    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    enhanced = clahe.apply(gray)
    return enhanced


def preprocess_image(
    image_input: Union[Image.Image, np.ndarray, str],
    target_size: Tuple[int, int] = (224, 224),
    apply_clahe: bool = True,
    normalize_mode: str = "mobilenetv2"
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Standardizes a knee radiograph for CNN feature extraction.
    
    Args:
        image_input: PIL Image, numpy array (H, W) or (H, W, 3), or file path.
        target_size: (height, width) tuple, default (224, 224).
        apply_clahe: Whether to apply adaptive contrast enhancement.
        normalize_mode: 'mobilenetv2' (scales to [-1, 1]) or 'standard' (scales to [0, 1]).
        
    Returns:
        tuple (processed_tensor, original_rgb_resized):
            processed_tensor: np.ndarray shape (1, target_size[0], target_size[1], 3), float32
            original_rgb_resized: np.ndarray shape (target_size[0], target_size[1], 3), uint8
    """
    if isinstance(image_input, str):
        pil_img = Image.open(image_input)
    elif isinstance(image_input, Image.Image):
        pil_img = image_input
    elif isinstance(image_input, np.ndarray):
        pil_img = Image.fromarray(image_input)
    else:
        raise TypeError(f"Unsupported image input type: {type(image_input)}")

    # Convert to grayscale 8-bit array for radiograph consistency
    img_gray = np.array(pil_img.convert("L"), dtype=np.uint8)

    # Resize to target dimensions
    img_resized = cv2.resize(img_gray, target_size, interpolation=cv2.INTER_AREA)

    # Optional CLAHE contrast enhancement
    if apply_clahe:
        contrast_adjusted = apply_clahe_contrast_enhancement(img_resized)
    else:
        contrast_adjusted = img_resized

    # Broadcast 1-channel to 3-channel RGB for MobileNetV2 architecture
    rgb_tensor = np.stack([contrast_adjusted] * 3, axis=-1)
    original_rgb_resized = np.stack([img_resized] * 3, axis=-1)

    # Normalization
    tensor_float = rgb_tensor.astype(np.float32)
    if normalize_mode == "mobilenetv2":
        # MobileNetV2 preprocessing maps [0, 255] -> [-1, 1]
        normalized_tensor = (tensor_float / 127.5) - 1.0
    else:
        # Standard [0, 1]
        normalized_tensor = tensor_float / 255.0

    # Expand batch dimension: (1, H, W, 3)
    batch_tensor = np.expand_dims(normalized_tensor, axis=0)

    return batch_tensor, original_rgb_resized
