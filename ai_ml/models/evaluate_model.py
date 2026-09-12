import os
import sys
import numpy as np
import pandas as pd
import torch
import matplotlib.pyplot as plt


# ============================================================
# ADD PROJECT ROOT TO PYTHON PATH
# ============================================================

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)


# ============================================================
# IMPORT AUTOENCODER
# ============================================================

from models.solar_autoencoder import SolarAutoencoder


# ============================================================
# PATH CONFIGURATION
# ============================================================

DATA_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "solar_sensor_data.csv"
)

TRAIN_DATA_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "train_data.pt"
)

MODEL_FILE = os.path.join(
    PROJECT_ROOT,
    "models",
    "solar_autoencoder.pth"
)

THRESHOLD_FILE = os.path.join(
    PROJECT_ROOT,
    "data",
    "threshold.txt"
)

OUTPUT_DIR = os.path.join(
    PROJECT_ROOT,
    "output"
)


# ============================================================
# CREATE OUTPUT DIRECTORY
# ============================================================

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)


# ============================================================
# FEATURE CONFIGURATION
# ============================================================

FEATURE_COLUMNS = [
    "temperature",
    "voltage",
    "current",
    "irradiance",
    "soiling",
    "power_output"
]


# ============================================================
# REQUIRED DATASET COLUMNS
# ============================================================

REQUIRED_COLUMNS = [
    "asset_id",
    "reading_id",
    "temperature",
    "voltage",
    "current",
    "irradiance",
    "soiling",
    "power_output",
    "condition",
    "fault_type"
]


# ============================================================
# FALLBACK THRESHOLD
# ============================================================

DEFAULT_ANOMALY_THRESHOLD = 1.033187


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


# ============================================================
# PRINT HEADER
# ============================================================

def print_header(title):

    print("\n")
    print("=" * 70)
    print(title)
    print("=" * 70)


# ============================================================
# LOAD TRAINING NORMALIZATION STATISTICS
# ============================================================

def load_training_statistics():

    if not os.path.exists(TRAIN_DATA_FILE):

        raise FileNotFoundError(
            f"\nTraining data file not found:\n"
            f"{TRAIN_DATA_FILE}"
        )

    training_data = torch.load(
        TRAIN_DATA_FILE,
        weights_only=False
    )

    if "mean" not in training_data:

        raise KeyError(
            "Mean normalization values not found "
            "in train_data.pt"
        )

    if "std" not in training_data:

        raise KeyError(
            "Standard deviation values not found "
            "in train_data.pt"
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

    # Avoid division by zero
    std[std == 0] = 1.0

    return mean, std


# ============================================================
# LOAD ANOMALY THRESHOLD
# ============================================================

def load_anomaly_threshold():

    if os.path.exists(THRESHOLD_FILE):

        try:

            with open(
                THRESHOLD_FILE,
                "r"
            ) as file:

                value = file.read().strip()

            threshold = float(value)

            if threshold > 0:

                return threshold

        except (
            ValueError,
            OSError
        ):

            pass

    return DEFAULT_ANOMALY_THRESHOLD


# ============================================================
# LOAD PYTORCH MODEL
# ============================================================

def load_model():

    if not os.path.exists(MODEL_FILE):

        raise FileNotFoundError(
            f"\nTrained model not found:\n"
            f"{MODEL_FILE}"
        )

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

def calculate_reconstruction_errors(
    model,
    normalized_data,
    batch_size=512
):

    all_errors = []

    total_samples = len(
        normalized_data
    )

    for start in range(
        0,
        total_samples,
        batch_size
    ):

        end = min(
            start + batch_size,
            total_samples
        )

        batch = normalized_data[
            start:end
        ]

        input_tensor = torch.tensor(
            batch,
            dtype=torch.float32,
            device=DEVICE
        )

        with torch.no_grad():

            reconstructed = model(
                input_tensor
            )

            errors = torch.mean(
                (
                    input_tensor
                    - reconstructed
                ) ** 2,
                dim=1
            )

        all_errors.extend(
            errors
            .cpu()
            .numpy()
            .tolist()
        )

    return np.array(
        all_errors,
        dtype=np.float32
    )


# ============================================================
# CONFUSION MATRIX
# ============================================================

def calculate_confusion_matrix(
    actual,
    predicted
):

    actual = np.asarray(
        actual,
        dtype=np.int32
    )

    predicted = np.asarray(
        predicted,
        dtype=np.int32
    )

    true_negative = int(
        np.sum(
            (actual == 0)
            &
            (predicted == 0)
        )
    )

    false_positive = int(
        np.sum(
            (actual == 0)
            &
            (predicted == 1)
        )
    )

    false_negative = int(
        np.sum(
            (actual == 1)
            &
            (predicted == 0)
        )
    )

    true_positive = int(
        np.sum(
            (actual == 1)
            &
            (predicted == 1)
        )
    )

    return (
        true_negative,
        false_positive,
        false_negative,
        true_positive
    )


# ============================================================
# MODEL METRICS
# ============================================================

def calculate_metrics(
    true_negative,
    false_positive,
    false_negative,
    true_positive
):

    total = (
        true_negative
        + false_positive
        + false_negative
        + true_positive
    )

    accuracy = (
        true_negative
        + true_positive
    ) / total if total > 0 else 0.0

    precision_denominator = (
        true_positive
        + false_positive
    )

    precision = (
        true_positive
        / precision_denominator
        if precision_denominator > 0
        else 0.0
    )

    recall_denominator = (
        true_positive
        + false_negative
    )

    recall = (
        true_positive
        / recall_denominator
        if recall_denominator > 0
        else 0.0
    )

    f1_denominator = (
        precision
        + recall
    )

    f1 = (
        2
        * precision
        * recall
        / f1_denominator
        if f1_denominator > 0
        else 0.0
    )

    return (
        accuracy,
        precision,
        recall,
        f1
    )


# ============================================================
# FAULT-WISE EVALUATION
# ============================================================

def calculate_fault_wise_evaluation(
    df
):

    abnormal_df = df[
        df["condition"].astype(str).str.lower()
        != "normal"
    ].copy()

    results = []

    fault_types = sorted(
        abnormal_df[
            "fault_type"
        ]
        .dropna()
        .unique()
        .tolist()
    )

    for fault_type in fault_types:

        fault_df = abnormal_df[
            abnormal_df["fault_type"]
            == fault_type
        ]

        total_samples = len(
            fault_df
        )

        detected = int(
            np.sum(
                fault_df[
                    "predicted_anomaly"
                ].values
                == 1
            )
        )

        missed = (
            total_samples
            - detected
        )

        detection_rate = (
            detected
            / total_samples
            * 100.0
            if total_samples > 0
            else 0.0
        )

        results.append(
            {
                "fault_type": fault_type,
                "total_samples": total_samples,
                "detected": detected,
                "missed": missed,
                "detection_rate": round(
                    detection_rate,
                    2
                )
            }
        )

    return pd.DataFrame(
        results
    )


# ============================================================
# PLOT CONFUSION MATRIX
# ============================================================

def plot_confusion_matrix(
    true_negative,
    false_positive,
    false_negative,
    true_positive
):

    matrix = np.array(
        [
            [
                true_negative,
                false_positive
            ],
            [
                false_negative,
                true_positive
            ]
        ]
    )

    fig, ax = plt.subplots(
        figsize=(7, 6)
    )

    image = ax.imshow(
        matrix
    )

    ax.set_xticks(
        [0, 1]
    )

    ax.set_yticks(
        [0, 1]
    )

    ax.set_xticklabels(
        [
            "NORMAL",
            "ANOMALY"
        ]
    )

    ax.set_yticklabels(
        [
            "NORMAL",
            "ANOMALY"
        ]
    )

    ax.set_xlabel(
        "Predicted"
    )

    ax.set_ylabel(
        "Actual"
    )

    ax.set_title(
        "Solar Autoencoder Confusion Matrix"
    )

    for i in range(2):

        for j in range(2):

            ax.text(
                j,
                i,
                str(matrix[i, j]),
                ha="center",
                va="center",
                fontsize=14
            )

    fig.colorbar(
        image,
        ax=ax
    )

    plt.tight_layout()

    output_file = os.path.join(
        OUTPUT_DIR,
        "confusion_matrix.png"
    )

    plt.savefig(
        output_file,
        dpi=200,
        bbox_inches="tight"
    )

    plt.close()

    return output_file


# ============================================================
# PLOT FAULT DETECTION RATES
# ============================================================

def plot_fault_detection_rates(
    fault_results
):

    if fault_results.empty:

        return None

    fig, ax = plt.subplots(
        figsize=(10, 6)
    )

    ax.bar(
        fault_results["fault_type"],
        fault_results[
            "detection_rate"
        ]
    )

    ax.set_xlabel(
        "Fault Type"
    )

    ax.set_ylabel(
        "Detection Rate (%)"
    )

    ax.set_title(
        "Fault-Wise Anomaly Detection Rate"
    )

    ax.set_ylim(
        0,
        105
    )

    plt.xticks(
        rotation=45,
        ha="right"
    )

    plt.tight_layout()

    output_file = os.path.join(
        OUTPUT_DIR,
        "fault_detection_rates.png"
    )

    plt.savefig(
        output_file,
        dpi=200,
        bbox_inches="tight"
    )

    plt.close()

    return output_file


# ============================================================
# PLOT RECONSTRUCTION ERROR DISTRIBUTION
# ============================================================

def plot_error_distribution(
    normal_errors,
    abnormal_errors,
    threshold
):

    fig, ax = plt.subplots(
        figsize=(10, 6)
    )

    ax.hist(
        normal_errors,
        bins=60,
        alpha=0.6,
        label="Actual Normal"
    )

    ax.hist(
        abnormal_errors,
        bins=60,
        alpha=0.6,
        label="Actual Abnormal"
    )

    ax.axvline(
        threshold,
        linestyle="--",
        linewidth=2,
        label=f"Threshold = {threshold:.6f}"
    )

    ax.set_xlabel(
        "Reconstruction Error"
    )

    ax.set_ylabel(
        "Number of Samples"
    )

    ax.set_title(
        "Reconstruction Error Distribution"
    )

    ax.legend()

    plt.tight_layout()

    output_file = os.path.join(
        OUTPUT_DIR,
        "evaluation_error_distribution.png"
    )

    plt.savefig(
        output_file,
        dpi=200,
        bbox_inches="tight"
    )

    plt.close()

    return output_file


# ============================================================
# SAVE METRICS TEXT FILE
# ============================================================

def save_metrics_text(
    total_samples,
    actual_normal,
    actual_abnormal,
    predicted_normal,
    predicted_abnormal,
    true_negative,
    false_positive,
    false_negative,
    true_positive,
    accuracy,
    precision,
    recall,
    f1,
    threshold,
    reconstruction_errors
):

    output_file = os.path.join(
        OUTPUT_DIR,
        "model_metrics.txt"
    )

    with open(
        output_file,
        "w",
        encoding="utf-8"
    ) as file:

        file.write(
            "PYTORCH SOLAR AUTOENCODER EVALUATION\n"
        )

        file.write(
            "=" * 60 + "\n\n"
        )

        file.write(
            f"Device: {DEVICE}\n"
        )

        file.write(
            f"Total samples: {total_samples}\n"
        )

        file.write(
            f"Actual normal: {actual_normal}\n"
        )

        file.write(
            f"Actual abnormal: {actual_abnormal}\n"
        )

        file.write(
            f"Predicted normal: {predicted_normal}\n"
        )

        file.write(
            f"Predicted abnormal: {predicted_abnormal}\n\n"
        )

        file.write(
            "CONFUSION MATRIX\n"
        )

        file.write(
            f"True Negative : {true_negative}\n"
        )

        file.write(
            f"False Positive: {false_positive}\n"
        )

        file.write(
            f"False Negative: {false_negative}\n"
        )

        file.write(
            f"True Positive : {true_positive}\n\n"
        )

        file.write(
            "MODEL PERFORMANCE\n"
        )

        file.write(
            f"Accuracy : {accuracy * 100:.2f}%\n"
        )

        file.write(
            f"Precision: {precision * 100:.2f}%\n"
        )

        file.write(
            f"Recall   : {recall * 100:.2f}%\n"
        )

        file.write(
            f"F1 Score : {f1 * 100:.2f}%\n\n"
        )

        file.write(
            "ANOMALY THRESHOLD\n"
        )

        file.write(
            f"{threshold:.6f}\n\n"
        )

        file.write(
            "RECONSTRUCTION ERROR\n"
        )

        file.write(
            f"Minimum: {np.min(reconstruction_errors):.6f}\n"
        )

        file.write(
            f"Maximum: {np.max(reconstruction_errors):.6f}\n"
        )

        file.write(
            f"Mean   : {np.mean(reconstruction_errors):.6f}\n"
        )

        file.write(
            f"Median : {np.median(reconstruction_errors):.6f}\n"
        )

    return output_file


# ============================================================
# MAIN EVALUATION
# ============================================================

def evaluate_model():

    print_header(
        "PYTORCH SOLAR AUTOENCODER EVALUATION"
    )

    print(
        f"\nDevice: {DEVICE}"
    )

    # ========================================================
    # LOAD DATASET
    # ========================================================

    print(
        "\nLoading dataset..."
    )

    if not os.path.exists(DATA_FILE):

        raise FileNotFoundError(
            f"\nDataset not found:\n{DATA_FILE}"
        )

    df = pd.read_csv(
        DATA_FILE
    )

    # --------------------------------------------------------
    # Validate columns
    # --------------------------------------------------------

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in df.columns
    ]

    if missing_columns:

        raise ValueError(
            "Dataset is missing required columns: "
            + str(missing_columns)
        )

    print(
        f"Total samples: {len(df)}"
    )

    # ========================================================
    # CHECK MISSING VALUES
    # ========================================================

    missing_values = (
        df[
            FEATURE_COLUMNS
        ]
        .isnull()
        .sum()
        .sum()
    )

    if missing_values > 0:

        raise ValueError(
            f"Dataset contains {missing_values} "
            "missing sensor values."
        )

    # ========================================================
    # LOAD MODEL
    # ========================================================

    print(
        "\nLoading trained model..."
    )

    model = load_model()

    print(
        "Model loaded successfully."
    )

    # ========================================================
    # LOAD NORMALIZATION STATISTICS
    # ========================================================

    mean, std = (
        load_training_statistics()
    )

    print(
        "\nTraining normalization statistics loaded."
    )

    # ========================================================
    # LOAD THRESHOLD
    # ========================================================

    threshold = (
        load_anomaly_threshold()
    )

    print(
        f"Anomaly threshold: {threshold:.6f}"
    )

    # ========================================================
    # CREATE FEATURE MATRIX
    # ========================================================

    feature_data = (
        df[
            FEATURE_COLUMNS
        ]
        .values
        .astype(np.float32)
    )

    # ========================================================
    # NORMALIZE USING TRAINING STATISTICS
    # ========================================================

    normalized_data = (
        feature_data - mean
    ) / std

    # ========================================================
    # PYTORCH INFERENCE
    # ========================================================

    print(
        "\nRunning PyTorch inference..."
    )

    reconstruction_errors = (
        calculate_reconstruction_errors(
            model,
            normalized_data
        )
    )

    print(
        "Inference completed."
    )

    # ========================================================
    # PREDICTION
    # ========================================================

    df["reconstruction_error"] = (
        reconstruction_errors
    )

    df["anomaly_threshold"] = (
        threshold
    )

    df["predicted_anomaly"] = (
        reconstruction_errors
        >= threshold
    ).astype(int)

    df["predicted_condition"] = np.where(
        df["predicted_anomaly"] == 1,
        "abnormal",
        "normal"
    )

    # ========================================================
    # ACTUAL LABEL
    # ========================================================

    df["actual_condition"] = (
        df["condition"]
        .astype(str)
        .str.lower()
    )

    df["actual_anomaly"] = (
        df["actual_condition"]
        != "normal"
    ).astype(int)

    # ========================================================
    # FIX FOR actual_fault_type
    # ========================================================

    # Keep original fault_type untouched.
    # Create an explicit evaluation column.

    df["actual_fault_type"] = (
        df["fault_type"]
        .astype(str)
    )

    # ========================================================
    # DATASET SUMMARY
    # ========================================================

    actual_normal = int(
        np.sum(
            df["actual_anomaly"].values
            == 0
        )
    )

    actual_abnormal = int(
        np.sum(
            df["actual_anomaly"].values
            == 1
        )
    )

    predicted_normal = int(
        np.sum(
            df["predicted_anomaly"].values
            == 0
        )
    )

    predicted_abnormal = int(
        np.sum(
            df["predicted_anomaly"].values
            == 1
        )
    )

    print_header(
        "DATASET SUMMARY"
    )

    print(
        f"\nTotal samples       : {len(df)}"
    )

    print(
        f"Actual normal       : {actual_normal}"
    )

    print(
        f"Actual abnormal     : {actual_abnormal}"
    )

    print(
        f"Predicted normal    : {predicted_normal}"
    )

    print(
        f"Predicted abnormal  : {predicted_abnormal}"
    )

    # ========================================================
    # CONFUSION MATRIX
    # ========================================================

    (
        true_negative,
        false_positive,
        false_negative,
        true_positive
    ) = calculate_confusion_matrix(
        df["actual_anomaly"].values,
        df["predicted_anomaly"].values
    )

    print_header(
        "CONFUSION MATRIX"
    )

    print(
        "\n                 PREDICTED"
    )

    print(
        "              NORMAL  ANOMALY"
    )

    print(
        f"ACTUAL NORMAL   "
        f"{true_negative:5d}   "
        f"{false_positive:5d}"
    )

    print(
        f"ACTUAL ABNORMAL "
        f"{false_negative:5d}   "
        f"{true_positive:5d}"
    )

    # ========================================================
    # MODEL METRICS
    # ========================================================

    (
        accuracy,
        precision,
        recall,
        f1
    ) = calculate_metrics(
        true_negative,
        false_positive,
        false_negative,
        true_positive
    )

    print_header(
        "MODEL PERFORMANCE"
    )

    print(
        f"\nAccuracy  : {accuracy * 100:.2f}%"
    )

    print(
        f"Precision : {precision * 100:.2f}%"
    )

    print(
        f"Recall    : {recall * 100:.2f}%"
    )

    print(
        f"F1 Score  : {f1 * 100:.2f}%"
    )

    # ========================================================
    # RECONSTRUCTION ERROR STATISTICS
    # ========================================================

    print_header(
        "RECONSTRUCTION ERROR STATISTICS"
    )

    print(
        f"\nMinimum : {np.min(reconstruction_errors):.6f}"
    )

    print(
        f"Maximum : {np.max(reconstruction_errors):.6f}"
    )

    print(
        f"Mean    : {np.mean(reconstruction_errors):.6f}"
    )

    print(
        f"Median  : {np.median(reconstruction_errors):.6f}"
    )

    # ========================================================
    # FAULT-WISE EVALUATION
    # ========================================================

    fault_results = (
        calculate_fault_wise_evaluation(
            df
        )
    )

    print_header(
        "FAULT-WISE DETECTION"
    )

    if fault_results.empty:

        print(
            "\nNo abnormal fault samples found."
        )

    else:

        print(
            "\n"
            + fault_results.to_string(
                index=False
            )
        )

    # ========================================================
    # SAVE COMPLETE RESULTS
    # ========================================================

    output_columns = [
        "asset_id",
        "reading_id",

        "temperature",
        "voltage",
        "current",
        "irradiance",
        "soiling",
        "power_output",

        "condition",
        "actual_condition",

        "fault_type",
        "actual_fault_type",

        "reconstruction_error",
        "anomaly_threshold",

        "actual_anomaly",
        "predicted_anomaly",

        "predicted_condition"
    ]

    # --------------------------------------------------------
    # Safety check
    # --------------------------------------------------------

    available_columns = [
        column
        for column in output_columns
        if column in df.columns
    ]

    detailed_results = (
        df[
            available_columns
        ].copy()
    )

    detailed_results_file = os.path.join(
        OUTPUT_DIR,
        "model_evaluation_results.csv"
    )

    detailed_results.to_csv(
        detailed_results_file,
        index=False
    )

    # ========================================================
    # SAVE FAULT-WISE RESULTS
    # ========================================================

    fault_results_file = os.path.join(
        OUTPUT_DIR,
        "fault_wise_evaluation.csv"
    )

    fault_results.to_csv(
        fault_results_file,
        index=False
    )

    # ========================================================
    # SAVE METRICS
    # ========================================================

    metrics_file = save_metrics_text(
        total_samples=len(df),
        actual_normal=actual_normal,
        actual_abnormal=actual_abnormal,
        predicted_normal=predicted_normal,
        predicted_abnormal=predicted_abnormal,
        true_negative=true_negative,
        false_positive=false_positive,
        false_negative=false_negative,
        true_positive=true_positive,
        accuracy=accuracy,
        precision=precision,
        recall=recall,
        f1=f1,
        threshold=threshold,
        reconstruction_errors=reconstruction_errors
    )

    # ========================================================
    # CREATE GRAPHS
    # ========================================================

    confusion_file = (
        plot_confusion_matrix(
            true_negative,
            false_positive,
            false_negative,
            true_positive
        )
    )

    fault_graph_file = (
        plot_fault_detection_rates(
            fault_results
        )
    )

    normal_errors = (
        df[
            df["actual_anomaly"] == 0
        ]["reconstruction_error"]
        .values
    )

    abnormal_errors = (
        df[
            df["actual_anomaly"] == 1
        ]["reconstruction_error"]
        .values
    )

    error_distribution_file = (
        plot_error_distribution(
            normal_errors,
            abnormal_errors,
            threshold
        )
    )

    # ========================================================
    # FINAL OUTPUT SUMMARY
    # ========================================================

    print_header(
        "EVALUATION FILES SAVED"
    )

    print(
        f"\n1. {detailed_results_file}"
    )

    print(
        f"2. {fault_results_file}"
    )

    print(
        f"3. {metrics_file}"
    )

    print(
        f"4. {confusion_file}"
    )

    if fault_graph_file:

        print(
            f"5. {fault_graph_file}"
        )

    print(
        f"6. {error_distribution_file}"
    )

    # ========================================================
    # FINAL SUCCESS
    # ========================================================

    print_header(
        "MODEL EVALUATION COMPLETED SUCCESSFULLY"
    )

    print(
        "\nPyTorch Autoencoder evaluation completed "
        "without errors."
    )


# ============================================================
# PROGRAM ENTRY POINT
# ============================================================

if __name__ == "__main__":

    evaluate_model()
