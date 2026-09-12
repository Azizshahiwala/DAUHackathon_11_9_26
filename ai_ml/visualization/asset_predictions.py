import os
import sys
import numpy as np
import pandas as pd
import torch
import matplotlib.pyplot as plt

# ---------------------------------------------------------
# Allow imports from project root
# ---------------------------------------------------------
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from models.solar_autoencoder import SolarAutoencoder


# =========================================================
# CONFIGURATION
# =========================================================

DATA_PATH = os.path.join(
    PROJECT_ROOT,
    "data",
    "solar_sensor_data.csv"
)

MODEL_PATH = os.path.join(
    PROJECT_ROOT,
    "models",
    "solar_autoencoder.pth"
)

TRAIN_DATA_PATH = os.path.join(
    PROJECT_ROOT,
    "data",
    "train_data.pt"
)

THRESHOLD_PATH = os.path.join(
    PROJECT_ROOT,
    "data",
    "threshold.txt"
)

OUTPUT_DIR = os.path.join(
    PROJECT_ROOT,
    "output"
)

FEATURE_COLUMNS = [
    "temperature",
    "voltage",
    "current",
    "irradiance",
    "soiling",
    "power_output"
]

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# =========================================================
# LOAD TRAINING STATISTICS
# =========================================================

def load_training_statistics():

    training_data = torch.load(
        TRAIN_DATA_PATH,
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


# =========================================================
# LOAD THRESHOLD
# =========================================================

def load_threshold():

    with open(THRESHOLD_PATH, "r") as file:
        threshold = float(file.read().strip())

    return threshold


# =========================================================
# LOAD MODEL
# =========================================================

def load_model():

    model = SolarAutoencoder().to(DEVICE)

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE,
        weights_only=True
    )

    model.load_state_dict(checkpoint)

    model.eval()

    return model


# =========================================================
# CALCULATE RECONSTRUCTION ERROR
# =========================================================

def calculate_reconstruction_errors(
    model,
    normalized_data,
    batch_size=256
):

    errors = []

    with torch.no_grad():

        for start in range(
            0,
            len(normalized_data),
            batch_size
        ):

            batch = normalized_data[
                start:start + batch_size
            ]

            tensor_batch = torch.tensor(
                batch,
                dtype=torch.float32,
                device=DEVICE
            )

            reconstructed = model(tensor_batch)

            batch_errors = torch.mean(
                (tensor_batch - reconstructed) ** 2,
                dim=1
            )

            errors.extend(
                batch_errors.cpu().numpy()
            )

    return np.array(errors)


# =========================================================
# RISK SCORE
# =========================================================

def calculate_risk_score(error, threshold):

    if error <= threshold:

        score = (
            error / threshold
        ) * 20

    else:

        score = (
            20
            + (
                (error - threshold)
                / threshold
            ) * 80
        )

    return float(
        np.clip(score, 0, 100)
    )


# =========================================================
# RISK LEVEL
# =========================================================

def get_risk_level(risk_score):

    if risk_score < 20:
        return "LOW"

    elif risk_score < 50:
        return "MEDIUM"

    elif risk_score < 75:
        return "HIGH"

    else:
        return "CRITICAL"


# =========================================================
# MAINTENANCE PRIORITY
# =========================================================

def get_maintenance_priority(risk_level):

    if risk_level == "LOW":
        return "ROUTINE"

    elif risk_level == "MEDIUM":
        return "MEDIUM"

    elif risk_level == "HIGH":
        return "HIGH"

    else:
        return "URGENT"


# =========================================================
# MAIN PROCESSING
# =========================================================

def process_all_assets():

    print("=" * 70)
    print("ALL SOLAR ASSET PREDICTION")
    print("=" * 70)

    print("\nDevice:")
    print(DEVICE)

    # -----------------------------------------------------
    # Load dataset
    # -----------------------------------------------------

    print("\nLoading sensor data...")

    df = pd.read_csv(DATA_PATH)

    print("Total sensor readings:", len(df))
    print("Total assets:", df["asset_id"].nunique())

    # -----------------------------------------------------
    # Sort readings
    # -----------------------------------------------------

    df = df.sort_values(
        ["asset_id", "reading_id"]
    )

    # -----------------------------------------------------
    # Take latest reading of every asset
    # -----------------------------------------------------
    #
    # Each asset has many sensor readings.
    # For a fleet dashboard we want the CURRENT/LATEST
    # status of every asset.
    # -----------------------------------------------------

    latest_df = (
        df
        .groupby("asset_id", as_index=False)
        .tail(1)
        .copy()
    )

    latest_df = latest_df.sort_values(
        "asset_id"
    )

    print(
        "Latest readings selected:",
        len(latest_df)
    )

    # -----------------------------------------------------
    # Load model/statistics/threshold
    # -----------------------------------------------------

    print("\nLoading model...")

    model = load_model()

    print("Model loaded successfully.")

    mean, std = load_training_statistics()

    threshold = load_threshold()

    print(
        f"Threshold: {threshold:.6f}"
    )

    # -----------------------------------------------------
    # Prepare features
    # -----------------------------------------------------

    feature_data = latest_df[
        FEATURE_COLUMNS
    ].values.astype(np.float32)

    # -----------------------------------------------------
    # Normalize using TRAINING statistics
    # -----------------------------------------------------

    normalized_data = (
        feature_data - mean
    ) / std

    # -----------------------------------------------------
    # Calculate reconstruction errors
    # -----------------------------------------------------

    print("\nRunning PyTorch inference...")

    reconstruction_errors = (
        calculate_reconstruction_errors(
            model,
            normalized_data
        )
    )

    # -----------------------------------------------------
    # Create prediction results
    # -----------------------------------------------------

    results = []

    for index, (_, row) in enumerate(
        latest_df.iterrows()
    ):

        error = float(
            reconstruction_errors[index]
        )

        anomaly = error >= threshold

        risk_score = calculate_risk_score(
            error,
            threshold
        )

        risk_level = get_risk_level(
            risk_score
        )

        priority = get_maintenance_priority(
            risk_level
        )

        result = {

            "asset_id": row["asset_id"],

            "reading_id": row["reading_id"],

            "temperature": row["temperature"],

            "voltage": row["voltage"],

            "current": row["current"],

            "irradiance": row["irradiance"],

            "soiling": row["soiling"],

            "power_output": row["power_output"],

            "reconstruction_error": error,

            "threshold": threshold,

            "anomaly": bool(anomaly),

            "status": (
                "ANOMALY"
                if anomaly
                else "NORMAL"
            ),

            "risk_score": risk_score,

            "risk_level": risk_level,

            "maintenance_priority": priority,

            # Ground-truth fields are included only
            # for evaluation/reference.
            "actual_condition": row["condition"],

            "actual_fault_type": row["fault_type"]
        }

        results.append(result)

    results_df = pd.DataFrame(results)

    # -----------------------------------------------------
    # Sort by risk
    # -----------------------------------------------------

    results_df = results_df.sort_values(
        "risk_score",
        ascending=False
    ).reset_index(drop=True)

    # -----------------------------------------------------
    # Save CSV
    # -----------------------------------------------------

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    csv_path = os.path.join(
        OUTPUT_DIR,
        "all_asset_predictions.csv"
    )

    results_df.to_csv(
        csv_path,
        index=False
    )

    # =====================================================
    # SUMMARY
    # =====================================================

    total_assets = len(results_df)

    anomaly_count = int(
        results_df["anomaly"].sum()
    )

    normal_count = (
        total_assets - anomaly_count
    )

    critical_count = int(
        (
            results_df["risk_level"]
            == "CRITICAL"
        ).sum()
    )

    high_count = int(
        (
            results_df["risk_level"]
            == "HIGH"
        ).sum()
    )

    medium_count = int(
        (
            results_df["risk_level"]
            == "MEDIUM"
        ).sum()
    )

    low_count = int(
        (
            results_df["risk_level"]
            == "LOW"
        ).sum()
    )

    print("\n" + "=" * 70)
    print("FLEET SUMMARY")
    print("=" * 70)

    print(
        f"\nTotal assets      : {total_assets}"
    )

    print(
        f"Normal assets     : {normal_count}"
    )

    print(
        f"Anomaly assets    : {anomaly_count}"
    )

    print(
        f"\nLOW               : {low_count}"
    )

    print(
        f"MEDIUM            : {medium_count}"
    )

    print(
        f"HIGH              : {high_count}"
    )

    print(
        f"CRITICAL          : {critical_count}"
    )

    # =====================================================
    # TOP RISK ASSETS
    # =====================================================

    print("\n" + "=" * 70)
    print("TOP 10 HIGHEST-RISK ASSETS")
    print("=" * 70)

    top_assets = results_df.head(10)

    print(
        top_assets[
            [
                "asset_id",
                "reconstruction_error",
                "risk_score",
                "risk_level",
                "maintenance_priority"
            ]
        ].to_string(index=False)
    )

    # =====================================================
    # GRAPH 1
    # RECONSTRUCTION ERROR FOR ALL ASSETS
    # =====================================================

    plt.figure(figsize=(16, 7))

    asset_numbers = np.arange(
        len(results_df)
    )

    plt.scatter(
        asset_numbers,
        results_df[
            "reconstruction_error"
        ],
        s=30
    )

    plt.axhline(
        y=threshold,
        linestyle="--",
        linewidth=2,
        label=f"Threshold = {threshold:.3f}"
    )

    plt.xlabel(
        "Assets"
    )

    plt.ylabel(
        "Reconstruction Error"
    )

    plt.title(
        "Reconstruction Error Across All Solar Assets"
    )

    plt.legend()

    plt.grid(
        alpha=0.3
    )

    graph_path = os.path.join(
        OUTPUT_DIR,
        "asset_reconstruction_errors.png"
    )

    plt.tight_layout()

    plt.savefig(
        graph_path,
        dpi=150
    )

    plt.close()

    # =====================================================
    # GRAPH 2
    # RISK SCORE FOR ALL ASSETS
    # =====================================================

    plt.figure(figsize=(16, 7))

    plt.bar(
        asset_numbers,
        results_df["risk_score"]
    )

    plt.axhline(
        y=75,
        linestyle="--",
        linewidth=1.5,
        label="Critical Risk = 75"
    )

    plt.axhline(
        y=50,
        linestyle="--",
        linewidth=1.5,
        label="High Risk = 50"
    )

    plt.xlabel(
        "Assets"
    )

    plt.ylabel(
        "Risk Score"
    )

    plt.title(
        "Risk Score Across All Solar Assets"
    )

    plt.ylim(
        0,
        105
    )

    plt.legend()

    plt.grid(
        alpha=0.3
    )

    risk_graph_path = os.path.join(
        OUTPUT_DIR,
        "asset_risk_scores.png"
    )

    plt.tight_layout()

    plt.savefig(
        risk_graph_path,
        dpi=150
    )

    plt.close()

    # =====================================================
    # GRAPH 3
    # RISK LEVEL DISTRIBUTION
    # =====================================================

    risk_counts = results_df[
        "risk_level"
    ].value_counts()

    levels = [
        "LOW",
        "MEDIUM",
        "HIGH",
        "CRITICAL"
    ]

    values = [
        risk_counts.get(level, 0)
        for level in levels
    ]

    plt.figure(figsize=(9, 6))

    plt.bar(
        levels,
        values
    )

    plt.xlabel(
        "Risk Level"
    )

    plt.ylabel(
        "Number of Assets"
    )

    plt.title(
        "Fleet Risk Distribution"
    )

    plt.grid(
        axis="y",
        alpha=0.3
    )

    distribution_path = os.path.join(
        OUTPUT_DIR,
        "risk_distribution.png"
    )

    plt.tight_layout()

    plt.savefig(
        distribution_path,
        dpi=150
    )

    plt.close()

    # =====================================================
    # GRAPH 4
    # TOP 10 RISK ASSETS
    # =====================================================

    top10 = results_df.head(10).copy()

    top10 = top10.sort_values(
        "risk_score"
    )

    plt.figure(figsize=(10, 6))

    plt.barh(
        top10["asset_id"],
        top10["risk_score"]
    )

    plt.xlabel(
        "Risk Score"
    )

    plt.ylabel(
        "Asset ID"
    )

    plt.title(
        "Top 10 Highest-Risk Solar Assets"
    )

    plt.xlim(
        0,
        105
    )

    plt.grid(
        axis="x",
        alpha=0.3
    )

    top10_path = os.path.join(
        OUTPUT_DIR,
        "top_risk_assets.png"
    )

    plt.tight_layout()

    plt.savefig(
        top10_path,
        dpi=150
    )

    plt.close()

    # =====================================================
    # FINAL OUTPUT
    # =====================================================

    print("\n" + "=" * 70)
    print("FILES GENERATED")
    print("=" * 70)

    print(
        f"\nCSV:"
        f"\n{csv_path}"
    )

    print(
        f"\nGraphs:"
        f"\n{graph_path}"
        f"\n{risk_graph_path}"
        f"\n{distribution_path}"
        f"\n{top10_path}"
    )

    print("\n" + "=" * 70)
    print("ALL ASSET PREDICTION COMPLETED")
    print("=" * 70)


# =========================================================
# PROGRAM ENTRY POINT
# =========================================================

if __name__ == "__main__":
    process_all_assets()