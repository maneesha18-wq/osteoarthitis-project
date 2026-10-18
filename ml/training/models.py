"""
Model Architectures for Knee Osteoarthritis KL Grade Classification
Contains:
1. Baseline CNN: Lightweight custom CNN comparison architecture.
2. MobileNetV2: Transfer-learning architecture utilizing depthwise separable convolutions.
"""

import tensorflow as tf
from tensorflow.keras import layers, models


def build_baseline_cnn(
    input_shape=(224, 224, 3),
    num_classes=5,
    dropout_rate=0.4
) -> tf.keras.Model:
    """
    Constructs a simple convolutional neural network baseline.
    Serves as an experimental benchmark against transfer-learned backbones.
    """
    inputs = layers.Input(shape=input_shape, name="input_radiograph")

    # Block 1
    x = layers.Conv2D(32, (3, 3), padding="same", activation="relu", name="conv1")(inputs)
    x = layers.MaxPooling2D((2, 2), name="pool1")(x)

    # Block 2
    x = layers.Conv2D(64, (3, 3), padding="same", activation="relu", name="conv2")(x)
    x = layers.MaxPooling2D((2, 2), name="pool2")(x)

    # Block 3
    x = layers.Conv2D(128, (3, 3), padding="same", activation="relu", name="conv3")(x)
    x = layers.MaxPooling2D((2, 2), name="pool3")(x)

    # Block 4
    x = layers.Conv2D(256, (3, 3), padding="same", activation="relu", name="conv4")(x)
    x = layers.MaxPooling2D((2, 2), name="pool4")(x)

    # Classification Head
    x = layers.GlobalAveragePooling2D(name="gap")(x)
    x = layers.Dropout(dropout_rate, name="dropout_1")(x)
    x = layers.Dense(128, activation="relu", name="dense_features")(x)
    x = layers.Dropout(dropout_rate / 2, name="dropout_2")(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="kl_predictions")(x)

    model = models.Model(inputs=inputs, outputs=outputs, name="baseline_cnn_knee_oa")
    return model


def build_mobilenetv2_model(
    input_shape=(224, 224, 3),
    num_classes=5,
    pretrained_weights="imagenet",
    freeze_base=True,
    fine_tune_at=100,
    dropout_rate=0.3
) -> tf.keras.Model:
    """
    Constructs a transfer-learning model based on MobileNetV2.
    
    Args:
        input_shape: Dimensions of radiograph input (224, 224, 3).
        num_classes: 5 classes corresponding to KL Grades 0, 1, 2, 3, 4.
        pretrained_weights: 'imagenet' or None.
        freeze_base: If True, freezes the base feature extractor initially.
        fine_tune_at: Layer index from which to unfreeze for fine-tuning.
        dropout_rate: Regularization dropout rate before final dense layer.
    """
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=input_shape,
        include_top=False,
        weights=pretrained_weights
    )

    base_model.trainable = not freeze_base
    if not freeze_base and fine_tune_at > 0:
        for layer in base_model.layers[:fine_tune_at]:
            layer.trainable = False

    x = base_model.output

    # Classification Head
    x = layers.GlobalAveragePooling2D(name="global_avg_pool")(x)
    x = layers.BatchNormalization(name="batch_norm")(x)
    x = layers.Dropout(dropout_rate, name="head_dropout_1")(x)
    x = layers.Dense(128, activation="relu", name="head_dense")(x)
    x = layers.Dropout(dropout_rate * 0.7, name="head_dropout_2")(x)
    outputs = layers.Dense(num_classes, activation="softmax", name="kl_predictions")(x)

    model = models.Model(inputs=base_model.input, outputs=outputs, name="mobilenetv2_knee_kl")
    return model


def compile_model(
    model: tf.keras.Model,
    learning_rate: float = 1e-4
) -> tf.keras.Model:
    """
    Compiles model with Adam optimizer and Categorical Crossentropy.
    """
    optimizer = tf.keras.optimizers.Adam(learning_rate=learning_rate)
    model.compile(
        optimizer=optimizer,
        loss="sparse_categorical_crossentropy",
        metrics=[
            "accuracy",
            tf.keras.metrics.SparseTopKCategoricalAccuracy(k=2, name="top_2_accuracy")
        ]
    )
    return model
