# ============================================================
#             ANOMALY DISTRIBUTION VISUALIZATION
# ============================================================

import os

import numpy as np
import pandas as pd
import torch
import matplotlib.pyplot as plt

from models.solar_autoencoder import SolarAutoencoder


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

DATA_FILE = os.path.join(
    BASE_DIR,
    "data",
    "solar_sensor_data.csv"
)

MODEL_FILE = os.path.join(
    BASE_DIR,
    "models",
    "solar_autoencoder.pth"
)

TRAIN_DATA_FILE = os.path.join(
    BASE_DIR,
    "data",
    "train_data.pt"
)

THRESHOLD_FILE = os.path.join(
    BASE_DIR,
    "data",
    "threshold.txt"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "output"
)

OUTPUT_FILE = os.path.join(
    OUTPUT_DIR,
    "anomaly_distribution.png"
)


# ============================================================
# FEATURES
# ============================================================

FEATURES = [
    "temperature",
    "voltage",
    "current",
    "irradiance",
    "soiling",
    "power_output"
]


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


# ============================================================
# LOAD TRAINING STATISTICS
# ============================================================

def load_training_statistics():

    training_data = torch.load(
        TRAIN_DATA_FILE,
        map_location="cpu",
        weights_only=False
    )

    mean = (
        training_data["mean"]
        .detach()
        .cpu()
        .numpy()
        .astype(np.float32)
    )

    std = (
        training_data["std"]
        .detach()
        .cpu()
        .numpy()
        .astype(np.float32)
    )

    return mean, std


# ============================================================
# LOAD THRESHOLD
# ============================================================

def load_threshold():

    with open(
        THRESHOLD_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        threshold = float(
            file.read().strip()
        )

    return threshold


# ============================================================
# LOAD MODEL
# ============================================================

def load_model():

    model = SolarAutoencoder()

    state_dict = torch.load(
        MODEL_FILE,
        map_location=DEVICE,
        weights_only=True
    )

    model.load_state_dict(
        state_dict
    )

    model = model.to(
        DEVICE
    )

    model.eval()

    return model


# ============================================================
# CALCULATE RECONSTRUCTION ERRORS
# ============================================================

def calculate_errors(
    model,
    data,
    mean,
    std
):

    values = (
        data[FEATURES]
        .values
        .astype(np.float32)
    )

    normalized = (
        values - mean
    ) / std

    input_tensor = torch.tensor(
        normalized,
        dtype=torch.float32
    ).to(DEVICE)

    errors = []

    batch_size = 512

    with torch.no_grad():

        for start in range(
            0,
            len(input_tensor),
            batch_size
        ):

            batch = input_tensor[
                start:start + batch_size
            ]

            reconstructed = model(
                batch
            )

            batch_errors = torch.mean(
                (
                    batch
                    - reconstructed
                ) ** 2,
                dim=1
            )

            errors.extend(
                batch_errors
                .cpu()
                .numpy()
                .tolist()
            )

    return np.array(
        errors,
        dtype=np.float32
    )


# ============================================================
# CREATE GRAPH
# ============================================================

def create_graph(
    data,
    errors,
    threshold
):

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    normal_mask = (
        data["condition"].values
        == "normal"
    )

    abnormal_mask = (
        data["condition"].values
        == "abnormal"
    )

    plt.figure(
        figsize=(14, 7)
    )

    normal_errors = errors[
        normal_mask
    ]

    abnormal_errors = errors[
        abnormal_mask
    ]

    plt.hist(
        normal_errors,
        bins=80,
        alpha=0.65,
        label="Normal Sensor Data"
    )

    plt.hist(
        abnormal_errors,
        bins=80,
        alpha=0.65,
        label="Abnormal Sensor Data"
    )

    plt.axvline(
        threshold,
        linestyle="--",
        linewidth=2,
        label=(
            f"Anomaly Threshold = "
            f"{threshold:.6f}"
        )
    )

    plt.xlabel(
        "Reconstruction Error"
    )

    plt.ylabel(
        "Number of Sensor Readings"
    )

    plt.title(
        "Solar Asset Anomaly Detection - "
        "Reconstruction Error Distribution"
    )

    plt.legend()

    plt.grid(
        alpha=0.25
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_FILE,
        dpi=150
    )

    plt.show()

    print(
        "\nGraph saved to:"
    )

    print(
        OUTPUT_FILE
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print(
        "ANOMALY DISTRIBUTION VISUALIZATION"
    )
    print("=" * 60)

    print(
        f"\nDevice: {DEVICE}"
    )

    print(
        "\nLoading sensor data..."
    )

    data = pd.read_csv(
        DATA_FILE
    )

    print(
        f"Total readings: {len(data)}"
    )

    print(
        "\nLoading training statistics..."
    )

    mean, std = (
        load_training_statistics()
    )

    print(
        "\nLoading anomaly threshold..."
    )

    threshold = load_threshold()

    print(
        f"Threshold: {threshold:.6f}"
    )

    print(
        "\nLoading PyTorch model..."
    )

    model = load_model()

    print(
        "\nCalculating reconstruction errors..."
    )

    errors = calculate_errors(
        model,
        data,
        mean,
        std
    )

    data["reconstruction_error"] = (
        errors
    )

    data["predicted_status"] = np.where(
        errors >= threshold,
        "ANOMALY",
        "NORMAL"
    )

    normal_predictions = (
        data["predicted_status"]
        == "NORMAL"
    ).sum()

    anomaly_predictions = (
        data["predicted_status"]
        == "ANOMALY"
    ).sum()

    print(
        f"\nPredicted NORMAL: "
        f"{normal_predictions}"
    )

    print(
        f"Predicted ANOMALY: "
        f"{anomaly_predictions}"
    )

    print(
        "\nCreating graph..."
    )

    create_graph(
        data,
        errors,
        threshold
    )

    print(
        "\nVisualization completed."
    )


if __name__ == "__main__":
    main()